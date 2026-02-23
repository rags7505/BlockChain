import { useAuth } from "../context/AuthContext";
import { useEffect, useState } from "react";
import { evidenceApi } from "../services/api";
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
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
} from "@mui/material";
import {
  Visibility,
  ExitToApp,
  RemoveRedEye,
} from "@mui/icons-material";

export default function ViewerDashboard() {
  const { displayName, walletAddress, role, logout } = useAuth();
  const [evidences, setEvidences] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewingEvidence, setViewingEvidence] = useState(null);

  // Helper function to format wallet address to readable name
  const formatUploader = (uploadedBy) => {
    if (!uploadedBy) return 'Unknown';
    
    // If it's already a name (not starting with 0x), return as-is
    if (!uploadedBy.startsWith('0x')) return uploadedBy;
    
    // Return shortened wallet address (display names come from database)
    return `${uploadedBy.slice(0, 6)}...${uploadedBy.slice(-4)}`;
  };

  const loadEvidences = async () => {
    try {
      // Pass role and userId - viewer sees ALL evidence
      const result = await evidenceApi.getAllEvidence(role, walletAddress);
      if (result.success) {
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
  }, []);

  const handleViewFile = (evidence) => {
    setViewingEvidence(evidence);
    // Open file in new window
    window.open(
      evidenceApi.viewEvidence(evidence.evidenceId, displayName || walletAddress),
      "_blank"
    );
  };

  const handleCloseDialog = () => {
    setViewingEvidence(null);
  };

  return (
    <Box sx={{ minHeight: "100vh" }}>
      {/* Header */}
      <AppBar position="static" sx={{ backgroundColor: "#7b1fa2" }}>
        <Toolbar>
          <RemoveRedEye sx={{ mr: 2 }} />
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            Forensic Chain of Custody - Viewer
          </Typography>
          <Typography variant="body2" sx={{ mr: 2 }}>
            {displayName || `${walletAddress?.slice(0, 6)}...${walletAddress?.slice(-4)}`} ({role})
          </Typography>
          <Button color="inherit" startIcon={<ExitToApp />} onClick={logout}>
            Logout
          </Button>
        </Toolbar>
      </AppBar>

      <Box sx={{ p: 4 }}>
        {/* Welcome Section */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" gutterBottom>
            Evidence Viewer
          </Typography>
          <Typography variant="body1" color="text.secondary">
            As a Viewer, you can view all evidence files. Your access is logged
            and tracked by administrators.
          </Typography>
        </Box>

        {/* Evidence List */}
        <Card>
          <CardContent>
            <Typography variant="h5" gutterBottom>
              All Evidence Files
            </Typography>
            {loading ? (
              <Typography>Loading...</Typography>
            ) : evidences.length === 0 ? (
              <Box sx={{ textAlign: "center", py: 4 }}>
                <Typography color="text.secondary">
                  No evidence files available.
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
                    <TableCell>Upload Date</TableCell>
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
                        {new Date(evidence.uploadedAt).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <Button
                          startIcon={<Visibility />}
                          variant="outlined"
                          size="small"
                          onClick={() => handleViewFile(evidence)}
                        >
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </Box>

      {/* View Confirmation Dialog */}
      <Dialog open={viewingEvidence !== null} onClose={handleCloseDialog}>
        <DialogTitle>File Opened</DialogTitle>
        <DialogContent>
          <Typography>
            The evidence file has been opened in a new tab. Your access has been
            logged for audit purposes.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
