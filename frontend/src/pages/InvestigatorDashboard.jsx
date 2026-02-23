import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useThemeMode } from "../context/ThemeContext";
import { useEffect, useState } from "react";
import { evidenceApi } from "../services/api";
import { transferCustody } from "../services/blockchain";
import axios from "axios";
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Grid,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Chip,
  AppBar,
  Toolbar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Snackbar,
  Alert,
  IconButton,
  Tooltip,
} from "@mui/material";
import {
  CloudUpload,
  VerifiedUser,
  Assignment,
  ExitToApp,
  SwapHoriz,
  Visibility,
  ContentCopy,
  Brightness4,
  Brightness7,
} from "@mui/icons-material";

export default function InvestigatorDashboard() {
  const { displayName, walletAddress, role, logout } = useAuth();
  const { mode, toggleTheme } = useThemeMode();
  const [evidences, setEvidences] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showTransferDialog, setShowTransferDialog] = useState(false);
  const [evidenceToTransfer, setEvidenceToTransfer] = useState(null);
  const [newHolderAddress, setNewHolderAddress] = useState('');
  const [newHolderRole, setNewHolderRole] = useState('viewer');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [wallets, setWallets] = useState([]);

  // Helper function to format wallet address to readable name
  const formatUploader = (uploadedBy) => {
    if (!uploadedBy) return 'Unknown';
    
    // If it's already a name (not starting with 0x), return as-is
    if (!uploadedBy.startsWith('0x')) return uploadedBy;
    
    // Look up wallet in wallets list
    const wallet = wallets.find(w => w.wallet_address?.toLowerCase() === uploadedBy.toLowerCase());
    if (wallet && wallet.display_name) {
      return wallet.display_name;
    }
    
    // Return shortened wallet address
    return `${uploadedBy.slice(0, 6)}...${uploadedBy.slice(-4)}`;
  };

  // Get available roles (investigator can only assign investigator or viewer)
  const getAvailableRoles = () => {
    return ['investigator', 'viewer'];
  };

  // Check if user can transfer
  const canTransferEvidence = (evidence) => {
    // Investigators can ONLY transfer if they are the current holder
    // After transferring, they lose transfer rights (but keep view rights)
    if (!evidence.currentHolder) return false;
    
    const currentHolderLower = evidence.currentHolder.toLowerCase();
    const userWalletLower = walletAddress?.toLowerCase();
    
    return currentHolderLower === userWalletLower;
  };

  // Check if user can view evidence
  const canViewEvidence = (evidence) => {
    // Investigators can view if: (1) current holder, OR (2) original uploader
    // Even after transferring, original uploader keeps view rights
    if (!evidence.currentHolder && !evidence.uploadedBy) return false;
    
    const currentHolderLower = evidence.currentHolder?.toLowerCase();
    const uploadedByLower = evidence.uploadedBy?.toLowerCase();
    const userWalletLower = walletAddress?.toLowerCase();
    
    // Can view if currently holding OR if you uploaded it
    return currentHolderLower === userWalletLower || uploadedByLower === userWalletLower;
  };

  const loadWallets = async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000'}/api/wallet-auth/wallets`);
      if (res.data.success) {
        setWallets(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load wallets:', err);
    }
  };

  const handleViewEvidence = (evidence) => {
    const viewUrl = evidenceApi.viewEvidence(evidence.evidenceId, displayName || walletAddress);
    window.open(viewUrl, '_blank');
  };

  const loadEvidences = async () => {
    try {
      // Pass wallet address as userId for filtering
      // Backend will match against both wallet and display name
      const result = await evidenceApi.getAllEvidence(role, walletAddress || displayName);
      if (result.success) {
        // Server already filtered based on role
        setEvidences(result.data);
      }
    } catch (err) {
      console.error("Failed to load evidences:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEvidences();
    loadWallets();
  }, []);

  const handleTransferClick = (evidence) => {
    if (!canTransferEvidence(evidence)) {
      setSnackbar({
        open: true,
        message: 'You can only transfer evidence that you currently hold',
        severity: 'error'
      });
      return;
    }
    setEvidenceToTransfer(evidence);
    setNewHolderAddress('');
    setNewHolderRole('viewer');
    setShowTransferDialog(true);
  };

  const handleConfirmTransfer = async () => {
    if (!evidenceToTransfer || !newHolderAddress) return;

    try {
      const txResult = await transferCustody(evidenceToTransfer.evidenceId, newHolderAddress);
      
      await evidenceApi.transferCustody(
        evidenceToTransfer.evidenceId,
        newHolderAddress,
        displayName || walletAddress,
        txResult.transactionHash,
        newHolderRole
      );

      setSnackbar({
        open: true,
        message: `Custody transferred to ${newHolderAddress} with role: ${newHolderRole}`,
        severity: 'success'
      });
      loadEvidences();
    } catch (err) {
      console.error("Transfer error:", err);
      
      let errorMessage = "Failed to transfer custody";
      
      if (err?.message) {
        if (err.message.includes("Not current holder")) {
          errorMessage = "You are not the current holder of this evidence. Only the evidence owner can transfer custody.";
        } else if (err.message.includes("Evidence not found")) {
          errorMessage = "Evidence not found on blockchain.";
        } else if (err.message.includes("user rejected")) {
          errorMessage = "Transaction rejected by user";
        } else {
          errorMessage = err.message;
        }
      }
      
      setSnackbar({
        open: true,
        message: errorMessage,
        severity: 'error'
      });
    } finally {
      setShowTransferDialog(false);
      setEvidenceToTransfer(null);
      setNewHolderAddress('');
      setNewHolderRole('viewer');
    }
  };

  return (
    <Box sx={{ minHeight: "100vh" }}>
      {/* Header */}
      <AppBar position="static" sx={{ backgroundColor: "#1976d2" }}>
        <Toolbar>
          <Assignment sx={{ mr: 2 }} />
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            Forensic Chain of Custody - Investigator
          </Typography>
          <Typography variant="body2" sx={{ mr: 2 }}>
            {displayName || `${walletAddress?.slice(0, 6)}...${walletAddress?.slice(-4)}`} ({role})
          </Typography>
          <Tooltip title={mode === 'light' ? 'Dark mode' : 'Light mode'}>
            <IconButton color="inherit" onClick={toggleTheme} sx={{ mr: 1 }}>
              {mode === 'light' ? <Brightness4 /> : <Brightness7 />}
            </IconButton>
          </Tooltip>
          <Button color="inherit" startIcon={<ExitToApp />} onClick={logout}>
            Logout
          </Button>
        </Toolbar>
      </AppBar>

      <Box sx={{ p: 4 }}>
        {/* Welcome Section */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" gutterBottom>
            Investigator Dashboard
          </Typography>
          <Typography variant="body1" color="text.secondary">
            As an Investigator, you can upload evidence, verify files, and view your uploaded evidence.
          </Typography>
        </Box>

        {/* Action Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} md={4}>
            <Link to="/upload" style={{ textDecoration: "none" }}>
              <Card
                sx={{
                  height: "100%",
                  cursor: "pointer",
                  transition: "transform 0.2s",
                  "&:hover": { transform: "translateY(-4px)", boxShadow: 6 },
                }}
              >
                <CardContent sx={{ textAlign: "center", py: 3 }}>
                  <CloudUpload sx={{ fontSize: 50, color: "#1976d2", mb: 1 }} />
                  <Typography variant="h6" gutterBottom>
                    Upload Evidence
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Register new evidence on the blockchain
                  </Typography>
                </CardContent>
              </Card>
            </Link>
          </Grid>

          <Grid item xs={12} md={4}>
            <Link to="/verify" style={{ textDecoration: "none" }}>
              <Card
                sx={{
                  height: "100%",
                  cursor: "pointer",
                  transition: "transform 0.2s",
                  "&:hover": { transform: "translateY(-4px)", boxShadow: 6 },
                }}
              >
                <CardContent sx={{ textAlign: "center", py: 3 }}>
                  <VerifiedUser sx={{ fontSize: 50, color: "#2e7d32", mb: 1 }} />
                  <Typography variant="h6" gutterBottom>
                    Verify Evidence
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Check evidence integrity against blockchain
                  </Typography>
                </CardContent>
              </Card>
            </Link>
          </Grid>

          <Grid item xs={12} md={4}>
            <Link to="/explorer" style={{ textDecoration: "none" }}>
              <Card
                sx={{
                  height: "100%",
                  cursor: "pointer",
                  transition: "transform 0.2s",
                  "&:hover": { transform: "translateY(-4px)", boxShadow: 6 },
                }}
              >
                <CardContent sx={{ textAlign: "center", py: 3 }}>
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#4caf50" width="50" height="50" style={{ marginBottom: 8 }}>
                    <path d="M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5z"/>
                  </svg>
                  <Typography variant="h6" gutterBottom>
                    Blockchain Explorer
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    View transaction details
                  </Typography>
                </CardContent>
              </Card>
            </Link>
          </Grid>
        </Grid>

        {/* My Evidence Section */}
        <Card>
          <CardContent>
            <Typography variant="h5" gutterBottom>
              My Evidence
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Evidence you uploaded or currently hold
            </Typography>
            {loading ? (
              <Typography>Loading...</Typography>
            ) : evidences.length === 0 ? (
              <Box sx={{ textAlign: "center", py: 4 }}>
                <Typography color="text.secondary">
                  No evidence found. Upload your first evidence file.
                </Typography>
              </Box>
            ) : (
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Evidence ID</TableCell>
                    <TableCell>File Name</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>Uploaded By</TableCell>
                    <TableCell>Current Holder</TableCell>
                    <TableCell>Upload Date</TableCell>
                    <TableCell>Transaction Hash</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {evidences.map((evidence) => (
                    <TableRow key={evidence.id}>
                      <TableCell>
                        <Typography variant="body2" fontWeight="bold">
                          {evidence.evidenceId}
                        </Typography>
                      </TableCell>
                      <TableCell>{evidence.fileName}</TableCell>
                      <TableCell>
                        <Chip label={evidence.evidenceType} size="small" />
                      </TableCell>
                      <TableCell>{formatUploader(evidence.uploadedBy)}</TableCell>
                      <TableCell>{formatUploader(evidence.currentHolder)}</TableCell>
                      <TableCell>
                        {new Date(evidence.uploadedAt).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        {evidence.blockchainTxHash ? (
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Typography variant="body2" fontFamily="monospace" sx={{ mr: 1 }}>
                              {evidence.blockchainTxHash.slice(0, 10)}...{evidence.blockchainTxHash.slice(-8)}
                            </Typography>
                            <IconButton
                              size="small"
                              onClick={() => {
                                navigator.clipboard.writeText(evidence.blockchainTxHash);
                                setSnackbar({
                                  open: true,
                                  message: 'Transaction hash copied to clipboard',
                                  severity: 'success'
                                });
                              }}
                              sx={{ p: 0.5 }}
                            >
                              <ContentCopy fontSize="small" />
                            </IconButton>
                          </Box>
                        ) : (
                          <Typography variant="body2" color="text.secondary">-</Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          {canViewEvidence(evidence) && (
                            <Tooltip title="View Evidence">
                              <IconButton
                                color="primary"
                                size="small"
                                onClick={() => handleViewEvidence(evidence)}
                              >
                                <Visibility />
                              </IconButton>
                            </Tooltip>
                          )}
                          {canTransferEvidence(evidence) && (
                            <Button
                              startIcon={<SwapHoriz />}
                              variant="outlined"
                              color="primary"
                              size="small"
                              onClick={() => handleTransferClick(evidence)}
                            >
                              Transfer
                            </Button>
                          )}
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </Box>

      {/* Transfer Custody Dialog */}
      <Dialog
        open={showTransferDialog}
        onClose={() => setShowTransferDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Transfer Evidence Custody</DialogTitle>
        <DialogContent>
          {evidenceToTransfer && (
            <Box sx={{ mb: 3, p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
              <Typography variant="body2"><strong>Evidence ID:</strong> {evidenceToTransfer.evidenceId}</Typography>
              <Typography variant="body2"><strong>File:</strong> {evidenceToTransfer.fileName}</Typography>
            </Box>
          )}
          <Alert severity="warning" sx={{ mb: 2 }}>
            <Typography variant="body2">
              <strong>Important:</strong> After transferring, you will lose transfer rights but can still view this evidence.
              The recipient must already be added in Manage Wallets by a judge or superadmin.
            </Typography>
          </Alert>
          <TextField
            fullWidth
            label="New Holder Address (Ethereum)"
            placeholder="0x..."
            value={newHolderAddress}
            onChange={(e) => setNewHolderAddress(e.target.value)}
            helperText="Enter the Ethereum wallet address of the new evidence holder"
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            select
            label="Assign Role to Recipient"
            value={newHolderRole}
            onChange={(e) => setNewHolderRole(e.target.value)}
            helperText="The recipient will be registered with this role"
          >
            {getAvailableRoles().map((roleOption) => (
              <MenuItem key={roleOption} value={roleOption}>
                {roleOption.charAt(0).toUpperCase() + roleOption.slice(1)}
              </MenuItem>
            ))}
          </TextField>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowTransferDialog(false)}>Cancel</Button>
          <Button 
            onClick={handleConfirmTransfer} 
            color="primary" 
            variant="contained"
            startIcon={<SwapHoriz />}
            disabled={!newHolderAddress || !newHolderAddress.startsWith('0x')}
          >
            Transfer Custody
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
