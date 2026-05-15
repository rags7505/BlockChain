import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  Box,
  Card,
  CardContent,
  Button,
  Typography,
  Alert,
  Container,
  Avatar,
  CircularProgress,
} from "@mui/material";
import {
  Gavel,
  AccountBalanceWallet,
} from "@mui/icons-material";

export default function Login() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const auth = useAuth();
  const navigate = useNavigate();

  const handleConnectWallet = async () => {
    setLoading(true);
    setError("");
    
    try {
      await auth.connectWallet();
      // On success, navigate to dashboard
      navigate("/dashboard");
    } catch (err: any) {
      setError(err.message || "Failed to connect wallet");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 2,
      }}
    >
      <Container maxWidth="sm">
        <Card
          elevation={24}
          sx={{
            borderRadius: 4,
            overflow: "hidden",
          }}
        >
          <Box
            sx={{
              bgcolor: "primary.main",
              color: "white",
              py: 4,
              textAlign: "center",
            }}
          >
            <Avatar
              sx={{
                width: 80,
                height: 80,
                margin: "0 auto",
                bgcolor: "white",
                color: "primary.main",
                mb: 2,
              }}
            >
              <Gavel sx={{ fontSize: 40 }} />
            </Avatar>
            <Typography variant="h4" fontWeight="bold" gutterBottom>
              Forensic Chain of Custody
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.9 }}>
              Blockchain-Based Evidence Management System
            </Typography>
          </Box>

          <CardContent sx={{ p: 4 }}>
            <Typography
              variant="h6"
              textAlign="center"
              color="text.secondary"
              gutterBottom
              sx={{ mb: 3 }}
            >
              🔐 Connect Your Wallet to Login
            </Typography>

            {error && (
              <Alert severity="error" sx={{ mb: 3 }}>
                {error}
              </Alert>
            )}

            <Alert severity="info" sx={{ mb: 3 }}>
              <Typography variant="body2">
                <strong>Authentication via MetaMask</strong>
              </Typography>
              <Typography variant="caption">
                Your wallet address determines your role and access level. Contact your administrator if you need access.
              </Typography>
            </Alert>

            <Button
              fullWidth
              variant="contained"
              size="large"
              onClick={handleConnectWallet}
              disabled={loading}
              startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <AccountBalanceWallet />}
              sx={{
                py: 1.5,
                textTransform: "none",
                fontSize: 16,
                fontWeight: "bold",
              }}
            >
              {loading ? "Connecting..." : "Connect MetaMask Wallet"}
            </Button>

            <Box sx={{ mt: 4, textAlign: "center" }}>
              <Typography variant="caption" color="text.secondary" gutterBottom display="block">
                💡 <strong>How it works:</strong>
              </Typography>
              <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
                1. Click "Connect MetaMask Wallet"
              </Typography>
              <Typography variant="caption" color="text.secondary" display="block">
                2. Approve connection in MetaMask
              </Typography>
              <Typography variant="caption" color="text.secondary" display="block">
                3. Sign authentication message
              </Typography>
              <Typography variant="caption" color="text.secondary" display="block">
                4. Access granted based on your wallet role
              </Typography>
            </Box>

            <Box sx={{ mt: 3, p: 2, bgcolor: "action.hover", borderRadius: 1 }}>
              <Typography variant="caption" color="text.secondary" fontWeight="bold">
                ⚠️ Wallet Not Registered?
              </Typography>
              <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
                Contact your system administrator to assign a role to your wallet address. Roles: Judge, Investigator, Viewer.
              </Typography>
            </Box>
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
}
