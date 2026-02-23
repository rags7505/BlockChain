import { useAuth } from "../context/AuthContext"

export default function Navbar() {
  const { displayName, walletAddress, role } = useAuth()
  
  // DEBUG: Log what Navbar is receiving
  console.log('Navbar - displayName:', displayName);
  console.log('Navbar - walletAddress:', walletAddress);
  console.log('Navbar - role:', role);

  return (
    <div style={{ padding: "15px", background: "#111", color: "#fff" }}>
      <strong>Forensic Evidence System</strong>
      <span style={{ float: "right" }}>
        {displayName || `${walletAddress?.slice(0, 6)}...${walletAddress?.slice(-4)}`} ({role})
      </span>
    </div>
  )
}
