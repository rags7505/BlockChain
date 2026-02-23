import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useThemeMode } from "../context/ThemeContext";
import { useEffect, useState } from "react";
import { evidenceApi } from "../services/api";
import { transferCustody } from "../services/blockchain";
import { formatDate, formatRelativeTime } from "../utils/formatters";
import AddWalletComponent from "../components/AddWalletComponent";
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
  Tabs,
  Tab,
  Alert,
  Snackbar,
  TextField,
  MenuItem,
  IconButton,
  Tooltip,
} from "@mui/material";
import {
  CloudUpload,
  VerifiedUser,
  AdminPanelSettings,
  ExitToApp,
  Visibility,
  Timeline,
  Brightness4,
  Brightness7,
  Delete,
  SwapHoriz,
  ContentCopy,
} from "@mui/icons-material";

export default function AdminDashboard() {
  const { displayName, walletAddress, logout, role } = useAuth();
  const { mode, toggleTheme } = useThemeMode();
  const [evidences, setEvidences] = useState([]);
  const [accessLogs, setAccessLogs] = useState([]);
  const [tamperedEvidence, setTamperedEvidence] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState(0);
  const [selectedEvidence, setSelectedEvidence] = useState(null);
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
    
    // Return shortened wallet address as fallback
    return `${uploadedBy.slice(0, 6)}...${uploadedBy.slice(-4)}`;
  };
  const [showLogsDialog, setShowLogsDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showTransferDialog, setShowTransferDialog] = useState(false);
  const [evidenceToDelete, setEvidenceToDelete] = useState(null);
  const [evidenceToTransfer, setEvidenceToTransfer] = useState(null);
  const [newHolderAddress, setNewHolderAddress] = useState('');
  const [newHolderRole, setNewHolderRole] = useState('viewer');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  // Get available roles based on current user's role
  const getAvailableRoles = () => {
    if (role === 'superadmin') {
      return ['judge', 'investigator', 'viewer'];
    } else if (role === 'judge') {
      return ['investigator', 'viewer'];
    } else if (role === 'investigator') {
      return ['investigator', 'viewer'];
    }
    return ['viewer'];
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

  // Check if user can transfer specific evidence
  const canTransferEvidence = (evidence) => {
    if (role === 'superadmin') return true; // Superadmin can transfer anything
    if (role === 'judge') return true; // Judge can transfer anything
    
    // Investigators/viewers can only transfer what they currently hold
    // UNLESS they uploaded it and judge transferred it away (then they keep transfer rights)
    if (!evidence.currentHolder) return false;
    
    const currentHolderLower = evidence.currentHolder.toLowerCase();
    const uploadedByLower = evidence.uploadedBy?.toLowerCase();
    const userWalletLower = walletAddress?.toLowerCase();
    
    // Can transfer if: (1) current holder, OR (2) original uploader whose evidence was transferred by judge
    return currentHolderLower === userWalletLower || uploadedByLower === userWalletLower;
  };

  // Check if user can view evidence based on hierarchy
  const canViewEvidence = (evidence) => {
    if (role === 'judge') return true; // Judge can view everything
    
    // Others can only view what they currently hold
    if (!evidence.currentHolder) return false;
    
    const currentHolderLower = evidence.currentHolder.toLowerCase();
    const userWalletLower = walletAddress?.toLowerCase();
    
    return currentHolderLower === userWalletLower;
  };

  // Check if user can see evidence based on role hierarchy
  const canSeeEvidence = (evidence) => {
    // Role hierarchy: superadmin > judge > investigator > viewer
    if (role === 'superadmin' || role === 'judge') return true; // Superadmin and Judge see all
    
    // Investigators and viewers can only see what they currently hold or have uploaded
    if (!evidence.currentHolder && !evidence.uploadedBy) return false;
    
    const currentHolderLower = evidence.currentHolder?.toLowerCase();
    const uploadedByLower = evidence.uploadedBy?.toLowerCase();
    const userWalletLower = walletAddress?.toLowerCase();
    
    return currentHolderLower === userWalletLower || uploadedByLower === userWalletLower;
  };

  const loadData = async () => {
    try {
      console.log("AdminDashboard: Loading evidence data...");
      // Pass role and userId for server-side filtering
      const evidenceResult = await evidenceApi.getAllEvidence(role, walletAddress);
      console.log("AdminDashboard: Evidence result:", evidenceResult);
      
      if (evidenceResult.success) {
        console.log("AdminDashboard: Setting evidences:", evidenceResult.data);
        setEvidences(evidenceResult.data);
        
        // Check integrity of all evidence files
        const tampered = [];
        for (const evidence of evidenceResult.data) {
          try {
            const integrityCheck = await evidenceApi.verifyIntegrity(evidence.evidenceId);
            if (integrityCheck.success && !integrityCheck.intact) {
              tampered.push(evidence.evidenceId);
            }
          } catch (err) {
            console.error(`Failed to check integrity for ${evidence.evidenceId}:`, err);
          }
        }
        setTamperedEvidence(tampered);
      } else {
        console.error("AdminDashboard: Evidence result not successful:", evidenceResult);
      }

      const logsResult = await evidenceApi.getAccessLogs();
      if (logsResult.success) {
        setAccessLogs(logsResult.data);
      }
    } catch (err) {
      console.error("AdminDashboard: Failed to load data:", err);
      setSnackbar({
        open: true,
        message: `Failed to load data: ${err.message}`,
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    loadWallets();
  }, []);

  const handleViewFile = (evidence) => {
    window.open(
      evidenceApi.viewEvidence(evidence.evidenceId, displayName || walletAddress),
      "_blank"
    );
  };

  const handleViewLogs = async (evidence) => {
    try {
      const result = await evidenceApi.getAccessLogs(evidence.evidenceId);
      if (result.success) {
        setSelectedEvidence({ ...evidence, logs: result.data });
        setShowLogsDialog(true);
      }
    } catch (err) {
      console.error("Failed to load logs:", err);
    }
  };

  const handleDeleteClick = (evidence) => {
    setEvidenceToDelete(evidence);
    setShowDeleteDialog(true);
  };

  const handleConfirmDelete = async () => {
    if (!evidenceToDelete) return;

    try {
      const result = await evidenceApi.deleteEvidence(
        evidenceToDelete.evidenceId,
        displayName || walletAddress,
        role
      );

      if (result.success) {
        setSnackbar({
          open: true,
          message: `Evidence "${evidenceToDelete.evidenceId}" deleted successfully`,
          severity: 'success'
        });
        loadData(); // Reload the data
      } else {
        setSnackbar({
          open: true,
          message: result.error || 'Failed to delete evidence',
          severity: 'error'
        });
      }
    } catch (err) {
      console.error("Delete error:", err);
      setSnackbar({
        open: true,
        message: err.response?.data?.error || 'An error occurred while deleting evidence',
        severity: 'error'
      });
    } finally {
      setShowDeleteDialog(false);
      setEvidenceToDelete(null);
    }
  };

  const handleTransferClick = (evidence) => {
    // Check if user has permission to transfer this evidence
    if (!canTransferEvidence(evidence)) {
      setSnackbar({
        open: true,
        message: 'You can only transfer evidence that you currently hold or uploaded',
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
      // Call blockchain transfer
      const txResult = await transferCustody(evidenceToTransfer.evidenceId, newHolderAddress);
      
      // Record in backend
      await evidenceApi.transferCustody(
        evidenceToTransfer.evidenceId,
        newHolderAddress,
        displayName || walletAddress,
        txResult.transactionHash,
        newHolderRole
      );

      setSnackbar({
        open: true,
        message: `Custody transferred to ${newHolderAddress}`,
        severity: 'success'
      });
      loadData();
    } catch (err) {
      console.error("Transfer error:", err);
      
      let errorMessage = "Failed to transfer custody";
      
      // Parse blockchain error messages
      if (err?.message) {
        if (err.message.includes("Not current holder")) {
          errorMessage = "You are not the current holder of this evidence. Only the evidence owner or judge can transfer custody.";
        } else if (err.message.includes("Evidence not found")) {
          errorMessage = "Evidence not found on blockchain. Please ensure it was properly registered.";
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
    }
  };

  return (
    <Box sx={{ minHeight: "100vh" }}>
      {/* Header */}
      <AppBar position="static" sx={{ backgroundColor: "#d32f2f" }}>
        <Toolbar>
          <AdminPanelSettings sx={{ mr: 2 }} />
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            Forensic Chain of Custody - Judge
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
        {/* Tampering Alert */}
        {tamperedEvidence.length > 0 && (
          <Alert severity="error" sx={{ mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              ⚠️ TAMPERING DETECTED!
            </Typography>
            <Typography variant="body2">
              {tamperedEvidence.length} evidence file(s) have been modified after upload:
            </Typography>
            <Box component="ul" sx={{ mt: 1, pl: 3 }}>
              {tamperedEvidence.map(id => (
                <li key={id}><strong>{id}</strong></li>
              ))}
            </Box>
            <Typography variant="body2" sx={{ mt: 1 }}>
              File hashes do not match blockchain records. Evidence integrity compromised!
            </Typography>
          </Alert>
        )}

        {/* Welcome Section */}
        <Box sx={{ mb: 4 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box>
              <Typography variant="h4" gutterBottom>
                Judge Dashboard
              </Typography>
            </Box>
            {role === 'judge' && (
              <Button
                component={Link}
                to="/manage-wallets"
                variant="outlined"
                startIcon={<AdminPanelSettings />}
                sx={{ textTransform: 'none' }}
              >
                Manage Wallet Roles
              </Button>
            )}
          </Box>
        </Box>

        {/* Action Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} md={3}>
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
                    Register new evidence
                  </Typography>
                </CardContent>
              </Card>
            </Link>
          </Grid>

          <Grid item xs={12} md={3}>
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
                  <VerifiedUser
                    sx={{ fontSize: 50, color: "#2e7d32", mb: 1 }}
                  />
                  <Typography variant="h6" gutterBottom>
                    Verify Evidence
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Check integrity
                  </Typography>
                </CardContent>
              </Card>
            </Link>
          </Grid>

          <Grid item xs={12} md={3}>
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

          <Grid item xs={12} md={3}>
            <Link to="/monitoring" style={{ textDecoration: "none" }}>
              <Card
                sx={{
                  height: "100%",
                  cursor: "pointer",
                  transition: "transform 0.2s",
                  "&:hover": { transform: "translateY(-4px)", boxShadow: 6 },
                }}
              >
                <CardContent sx={{ textAlign: "center", py: 3 }}>
                  <Timeline sx={{ fontSize: 50, color: "#ff9800", mb: 1 }} />
                  <Typography variant="h6" gutterBottom>
                    Live Monitoring
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Real-time activity feed
                  </Typography>
                </CardContent>
              </Card>
            </Link>
          </Grid>
        </Grid>

        {/* Tabs */}
        <Card>
          <Tabs
            value={selectedTab}
            onChange={(e, newValue) => setSelectedTab(newValue)}
            sx={{ borderBottom: 1, borderColor: "divider" }}
          >
            <Tab label="All Evidence" />
            <Tab label="Access Logs" />
            <Tab label="Add Wallet Address" />
          </Tabs>

          <CardContent>
            {selectedTab === 0 && (
              <>
                <Typography variant="h5" gutterBottom>
                  All Evidence Files
                </Typography>
                {loading ? (
                  <Typography>Loading...</Typography>
                ) : evidences.length === 0 ? (
                  <Box sx={{ textAlign: "center", py: 4 }}>
                    <Typography color="text.secondary">
                      No evidence uploaded yet.
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
                          <TableCell>
                            {evidence.currentHolder ? 
                              `${evidence.currentHolder.slice(0, 6)}...${evidence.currentHolder.slice(-4)}` : 
                              'Unknown'}
                          </TableCell>
                          <TableCell>
                            {formatDate(evidence.uploadedAt)}
                          </TableCell>
                          <TableCell>
                            {evidence.blockchainTxHash ? (
                              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <Typography variant="body2" fontFamily="monospace" sx={{ mr: 1 }}>
                                  {evidence.blockchainTxHash.slice(0, 10)}...{evidence.blockchainTxHash.slice(-8)}
                                </Typography>
                                <Button
                                  size="small"
                                  startIcon={<ContentCopy />}
                                  onClick={() => {
                                    navigator.clipboard.writeText(evidence.blockchainTxHash);
                                    setSnackbar({
                                      open: true,
                                      message: 'Transaction hash copied to clipboard',
                                      severity: 'success'
                                    });
                                  }}
                                  sx={{ minWidth: 'auto', p: 0.5 }}
                                >
                                </Button>
                              </Box>
                            ) : (
                              <Typography variant="body2" color="text.secondary">-</Typography>
                            )}
                          </TableCell>
                          <TableCell>
                            <Button
                              startIcon={<Visibility />}
                              variant="outlined"
                              size="small"
                              onClick={() => handleViewFile(evidence)}
                              sx={{ mr: 1 }}
                            >
                              View
                            </Button>
                            <Button
                              startIcon={<Timeline />}
                              variant="outlined"
                              size="small"
                              onClick={() => handleViewLogs(evidence)}
                              sx={{ mr: 1 }}
                            >
                              Logs
                            </Button>
                            {(role === 'superadmin' || role === 'judge') && canTransferEvidence(evidence) && (
                              <Button
                                startIcon={<SwapHoriz />}
                                variant="outlined"
                                color="primary"
                                size="small"
                                onClick={() => handleTransferClick(evidence)}
                                sx={{ mr: 1 }}
                              >
                                Transfer
                              </Button>
                            )}
                            {role === 'superadmin' && (
                              <Button
                                startIcon={<Delete />}
                                variant="outlined"
                                color="error"
                                size="small"
                                onClick={() => handleDeleteClick(evidence)}
                              >
                                Delete
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </>
            )}

            {selectedTab === 1 && (
              <>
                <Typography variant="h5" gutterBottom>
                  Access Log History
                </Typography>
                {accessLogs.length === 0 ? (
                  <Box sx={{ textAlign: "center", py: 4 }}>
                    <Typography color="text.secondary">
                      No access logs yet.
                    </Typography>
                  </Box>
                ) : (
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Evidence ID</TableCell>
                        <TableCell>Action</TableCell>
                        <TableCell>Accessed By</TableCell>
                        <TableCell>Access Time</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {accessLogs
                        .sort(
                          (a, b) =>
                            new Date(b.accessedAt) - new Date(a.accessedAt)
                        )
                        .map((log) => (
                          <TableRow key={log.id}>
                            <TableCell>
                              <Typography variant="body2" fontWeight="bold">
                                {log.evidenceId}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Chip
                                label={log.action}
                                size="small"
                                color={
                                  log.action === "uploaded"
                                    ? "primary"
                                    : log.action === "viewed"
                                    ? "secondary"
                                    : "default"
                                }
                              />
                            </TableCell>
                            <TableCell>{log.accessedBy}</TableCell>
                            <TableCell>
                              {formatDate(log.accessedAt)}
                            </TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                )}
              </>
            )}

            {selectedTab === 2 && (
              <>
                <AddWalletComponent />
              </>
            )}
          </CardContent>
        </Card>
      </Box>

      {/* Logs Dialog */}
      <Dialog
        open={showLogsDialog}
        onClose={() => setShowLogsDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Evidence Audit Trail: {selectedEvidence?.evidenceId}
        </DialogTitle>
        <DialogContent>
          {selectedEvidence?.logs && selectedEvidence.logs.length > 0 ? (
            <>
              {/* Timeline View */}
              <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                📜 Lifecycle Timeline
              </Typography>
              <Box sx={{ position: 'relative', pl: 4, pb: 2 }}>
                {/* Vertical line */}
                <Box
                  sx={{
                    position: 'absolute',
                    left: 15,
                    top: 0,
                    bottom: 0,
                    width: 2,
                    bgcolor: 'primary.main',
                  }}
                />
                {/* Timeline items */}
                {selectedEvidence.logs
                  .sort((a, b) => new Date(a.accessedAt).getTime() - new Date(b.accessedAt).getTime())
                  .map((log, index) => (
                    <Box key={log.id} sx={{ mb: 3, position: 'relative' }}>
                      {/* Dot */}
                      <Box
                        sx={{
                          position: 'absolute',
                          left: -28,
                          top: 4,
                          width: 12,
                          height: 12,
                          borderRadius: '50%',
                          bgcolor: log.action === 'DELETE' ? 'error.main' : 
                                   log.action === 'CUSTODY_TRANSFER' ? 'warning.main' : 'info.main',
                          border: '2px solid white',
                        }}
                      />
                      {/* Content */}
                      <Card variant="outlined">
                        <CardContent sx={{ py: 1.5 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                            <Chip 
                              label={log.action} 
                              size="small" 
                              color={log.action === 'DELETE' ? 'error' : 
                                     log.action === 'CUSTODY_TRANSFER' ? 'warning' : 'info'}
                              sx={{ mr: 1 }}
                            />
                            <Typography variant="body2" color="text.secondary">
                              by <strong>{log.accessedBy}</strong>
                            </Typography>
                          </Box>
                          <Typography variant="caption" color="text.secondary">
                            {formatDate(log.accessedAt)} ({formatRelativeTime(log.accessedAt)})
                          </Typography>
                        </CardContent>
                      </Card>
                    </Box>
                  ))}
              </Box>

              {/* Table View */}
              <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
                📊 Detailed Log Table
              </Typography>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Action</TableCell>
                    <TableCell>User</TableCell>
                    <TableCell>Time</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {selectedEvidence.logs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell>
                        <Chip label={log.action} size="small" />
                      </TableCell>
                      <TableCell>{log.accessedBy}</TableCell>
                      <TableCell>
                        {formatDate(log.accessedAt)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </>
          ) : (
            <Typography>No access logs for this evidence.</Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowLogsDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        maxWidth="sm"
      >
        <DialogTitle sx={{ color: 'error.main' }}>
          ⚠️ Confirm Permanent Deletion
        </DialogTitle>
        <DialogContent>
          <Alert severity="error" sx={{ mb: 2 }}>
            This action CANNOT be undone!
          </Alert>
          <Typography gutterBottom>
            Are you sure you want to permanently delete this evidence?
          </Typography>
          {evidenceToDelete && (
            <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
              <Typography variant="body2"><strong>Evidence ID:</strong> {evidenceToDelete.evidenceId}</Typography>
              <Typography variant="body2"><strong>File:</strong> {evidenceToDelete.fileName}</Typography>
              <Typography variant="body2"><strong>Type:</strong> {evidenceToDelete.evidenceType}</Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowDeleteDialog(false)}>Cancel</Button>
          <Button 
            onClick={handleConfirmDelete} 
            color="error" 
            variant="contained"
            startIcon={<Delete />}
          >
            Delete Permanently
          </Button>
        </DialogActions>
      </Dialog>

      {/* Transfer Custody Dialog */}
      <Dialog
        open={showTransferDialog}
        onClose={() => setShowTransferDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Transfer Evidence Custody</DialogTitle>
        <DialogContent>
          <Alert severity="info" sx={{ mb: 2 }}>
            This will transfer custody on the blockchain. MetaMask approval required.
          </Alert>
          {evidenceToTransfer && (
            <Box sx={{ mb: 3, p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
              <Typography variant="body2"><strong>Evidence ID:</strong> {evidenceToTransfer.evidenceId}</Typography>
              <Typography variant="body2"><strong>File:</strong> {evidenceToTransfer.fileName}</Typography>
            </Box>
          )}
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
        <Alert 
          onClose={() => setSnackbar({ ...snackbar, open: false })} 
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
