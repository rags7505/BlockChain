import { createContext, useContext, useState, useEffect } from "react";
import { ethers } from "ethers";
import axios from "axios";

type Role = "superadmin" | "judge" | "investigator" | "viewer" | null;

interface AuthContextType {
  role: Role;
  walletAddress: string | null;
  displayName: string | null;
  isConnected: boolean;
  connectWallet: () => Promise<void>;
  logout: () => void;
  // Legacy for backward compatibility
  username: string | null;
  login: (username: string, password: string) => boolean;
}

const AuthContext = createContext<AuthContextType>(null as any);

const BASE_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";

declare global {
  interface Window {
    ethereum?: any;
  }
}

// Helper function to detect MetaMask with proper waiting
const detectEthereumProvider = async (timeout = 3000): Promise<any> => {
  // If already available, return immediately
  if (window.ethereum) {
    return window.ethereum;
  }

  // Wait for ethereum#initialized event or timeout
  return new Promise((resolve, reject) => {
    let handled = false;

    const handleInitialized = () => {
      if (!handled) {
        handled = true;
        resolve(window.ethereum);
      }
    };

    // Listen for initialization event
    window.addEventListener('ethereum#initialized', handleInitialized, { once: true });

    // Set timeout
    setTimeout(() => {
      if (!handled) {
        handled = true;
        window.removeEventListener('ethereum#initialized', handleInitialized);
        if (window.ethereum) {
          resolve(window.ethereum);
        } else {
          reject(new Error('MetaMask not detected'));
        }
      }
    }, timeout);
  });
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [role, setRole] = useState<Role>(null);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  // Load auth state from localStorage on mount
  useEffect(() => {
    const storedToken = localStorage.getItem("authToken");
    const storedWallet = localStorage.getItem("walletAddress");
    const storedRole = localStorage.getItem("userRole") as Role;
    const storedName = localStorage.getItem("displayName");

    if (storedToken && storedWallet && storedRole) {
      setWalletAddress(storedWallet);
      setRole(storedRole);
      setDisplayName(storedName);
      setIsConnected(true);
    }
  }, []);

  // Check if wallet is still connected
  useEffect(() => {
    if (window.ethereum && walletAddress) {
      window.ethereum.request({ method: 'eth_accounts' }).then((accounts: string[]) => {
        if (accounts.length === 0 || accounts[0].toLowerCase() !== walletAddress.toLowerCase()) {
          // Wallet disconnected
          logout();
        }
      });
    }
  }, [walletAddress]);

  const connectWallet = async () => {
    try {
      // Properly detect MetaMask with timeout
      let ethereum;
      try {
        ethereum = await detectEthereumProvider();
      } catch (error) {
        alert("MetaMask not installed! Please install MetaMask extension from metamask.io and refresh the page.");
        throw new Error("MetaMask not installed");
      }

      // Request account access
      const accounts = await ethereum.request({
        method: 'eth_requestAccounts',
      });

      // Check if user canceled the request
      if (!accounts || accounts.length === 0) {
        throw new Error("MetaMask connection was canceled");
      }

      const walletAddr = accounts[0];

      // Step 1: Request nonce from backend
      const nonceRes = await axios.post(`${BASE_URL}/api/wallet-auth/request-nonce`, {
        walletAddress: walletAddr,
      });

      if (!nonceRes.data.success) {
        alert(nonceRes.data.error || "Wallet not registered. Contact admin.");
        return;
      }

      const { nonce, message } = nonceRes.data;

      // Step 2: Sign message with MetaMask
      const provider = new ethers.BrowserProvider(ethereum);
      const signer = await provider.getSigner();
      const signature = await signer.signMessage(message);

      // Step 3: Verify signature and get token
      const verifyRes = await axios.post(`${BASE_URL}/api/wallet-auth/verify`, {
        walletAddress: walletAddr,
        signature,
        nonce,
      });

      if (!verifyRes.data.success) {
        alert(verifyRes.data.error || "Authentication failed");
        return;
      }

      const { token, user } = verifyRes.data;

      // DEBUG: Log what we received
      console.log('Auth Response User:', user);
      console.log('Display Name:', user.displayName);

      // Store auth data
      localStorage.setItem("authToken", token);
      localStorage.setItem("walletAddress", user.walletAddress);
      localStorage.setItem("userRole", user.role);
      localStorage.setItem("displayName", user.displayName || "");

      setWalletAddress(user.walletAddress);
      setRole(user.role);
      setDisplayName(user.displayName);
      setIsConnected(true);
    } catch (error: any) {
      console.error("Connect wallet error:", error);
      
      // Handle MetaMask user rejection
      if (error.code === 4001 || error.message?.includes("User rejected") || error.message?.includes("canceled")) {
        console.log("User canceled MetaMask connection");
        // Don't show alert for user cancellation, just silently fail
        return;
      }
      
      // Show alert for other errors
      const errorMessage = error.response?.data?.error || error.message || "Failed to connect wallet";
      alert(errorMessage);
    }
  };

  const logout = async () => {
    try {
      if (walletAddress) {
        await axios.post(`${BASE_URL}/api/wallet-auth/logout`, { walletAddress });
      }
    } catch (err) {
      console.error("Logout error:", err);
    } finally {
      setRole(null);
      setWalletAddress(null);
      setDisplayName(null);
      setIsConnected(false);
      localStorage.removeItem("authToken");
      localStorage.removeItem("walletAddress");
      localStorage.removeItem("userRole");
      localStorage.removeItem("displayName");
    }
  };

  // Legacy username/password login (deprecated)
  const login = (user: string, password: string) => {
    alert("⚠️ Username/password login is deprecated. Please use MetaMask wallet authentication.");
    return false;
  };

  return (
    <AuthContext.Provider
      value={{
        role,
        walletAddress,
        displayName,
        isConnected,
        connectWallet,
        logout,
        // Legacy for backward compatibility
        username: walletAddress || displayName,
        login,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
// import { createContext, useContext } from "react"

// const AuthContext = createContext()

// export function AuthProvider({ children }) {
//   const user = {
//     username: "admin1",
//     role: "MAIN_ADMIN"
//   }

//   return (
//     <AuthContext.Provider value={{ user }}>
//       {children}
//     </AuthContext.Provider>
//   )
// }

// export function useAuth() {
//   return useContext(AuthContext)
// }
