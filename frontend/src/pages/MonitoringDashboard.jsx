import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { evidenceApi } from "../services/api";
import {
  Box,
  Typography,
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
  Button,
  IconButton,
  LinearProgress,
  Paper,
} from "@mui/material";
import {
  ExitToApp,
  Refresh,
  ArrowBack,
  CheckCircle,
  Description,
  Timeline,
  Warning,
} from "@mui/icons-material";
import { formatDate } from "../utils/formatters";
import axios from "axios";

const BASE_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";

export default function MonitoringDashboard() {
  const { displayName, walletAddress, logout, role } = useAuth();
  const navigate = useNavigate();
  const [evidences, setEvidences] = useState([]);
  const [accessLogs, setAccessLogs] = useState([]);
  const [systemHealth, setSystemHealth] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      setLoading(true);
      // Load evidences
      const evidenceResult = await evidenceApi.getAllEvidence();
      if (evidenceResult.success) {
        setEvidences(evidenceResult.data);
      }

      // Load access logs
      const logsResult = await evidenceApi.getAccessLogs();
      if (logsResult.success) {
        setAccessLogs(logsResult.data.slice(0, 20)); // Latest 20
      }

      // Try to get system health (if backend supports it)
      try {
        const healthRes = await axios.get(`${BASE_URL}/api/health`);
        setSystemHealth(healthRes.data);
      } catch (err) {
        setSystemHealth({ status: "ok", message: "Health endpoint not available" });
      }

      setLastUpdate(new Date());
    } catch (err) {
      console.error("Failed to load monitoring data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 5000); // Refresh every 5 seconds
    return () => clearInterval(interval);
  }, []);

  const formatUptime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    return `${hours}h ${minutes}m ${secs}s`;
  };

  return (
    <Box sx={{ flexGrow: 1, minHeight: "100vh" }}>
      <AppBar position="static">
        <Toolbar>
          <IconButton
            edge="start"
            color="inherit"
            onClick={() => navigate("/dashboard")}
            sx={{ mr: 2 }}
          >
            <ArrowBack />
          </IconButton>
          <Timeline sx={{ mr: 1 }} />
          <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 600 }}>
            Live Monitoring Dashboard
          </Typography>
          <Chip
            label={`Role: ${role}`}
            size="small"
            color="default"
            variant="outlined"
            sx={{ mr: 2 }}
          />
          <Typography sx={{ mr: 2 }}>
            {displayName || `${walletAddress?.slice(0, 6)}...${walletAddress?.slice(-4)}`}
          </Typography>
          <IconButton color="inherit" onClick={loadData}>
            <Refresh />
          </IconButton>
          <Button color="inherit" onClick={logout} startIcon={<ExitToApp />}>
            Logout
          </Button>
        </Toolbar>
      </AppBar>

      {loading && <LinearProgress sx={{ bgcolor: "rgba(255,255,255,0.1)" }} />}

      <Box sx={{ p: 4 }}>
        <Paper
          elevation={2}
          sx={{
            p: 2,
            mb: 3,
            borderRadius: 2,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <CheckCircle sx={{ color: "success.main" }} />
              <Typography variant="body1" fontWeight={600}>
                System Status: Active
              </Typography>
            </Box>
            <Typography variant="body2" color="text.secondary">
              Last Updated: {lastUpdate.toLocaleTimeString()} • Auto-refresh every 5 seconds
            </Typography>
          </Box>
        </Paper>

        <Grid container spacing={3}>
          {/* System Health Card */}
          <Grid item xs={12} md={3}>
            <Card
              sx={{
                height: "100%",
                bgcolor: "success.main",
                color: "white",
              }}
            >
              <CardContent>
                <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                  <CheckCircle sx={{ fontSize: 40, mr: 1 }} />
                  <Typography variant="h6" fontWeight={600}>
                    System Health
                  </Typography>
                </Box>
                <Typography variant="h2" fontWeight={700} sx={{ mb: 1 }}>
                  {systemHealth?.status === "ok" ? "✓" : "⚠"}
                </Typography>
                <Typography variant="body1" sx={{ opacity: 0.9 }}>
                  Status: {systemHealth?.status?.toUpperCase() || "UNKNOWN"}
                </Typography>
                {systemHealth?.uptime && (
                  <Typography variant="body2" sx={{ opacity: 0.8, mt: 1 }}>
                    Uptime: {formatUptime(systemHealth.uptime)}
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Total Evidence Card */}
          <Grid item xs={12} md={3}>
            <Card
              sx={{
                height: "100%",
                bgcolor: "primary.main",
                color: "white",
              }}
            >
              <CardContent>
                <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                  <Description sx={{ fontSize: 40, mr: 1 }} />
                  <Typography variant="h6" fontWeight={600}>
                    Total Evidence
                  </Typography>
                </Box>
                <Typography variant="h2" fontWeight={700} sx={{ mb: 1 }}>
                  {evidences.length}
                </Typography>
                <Typography variant="body1" sx={{ opacity: 0.9 }}>
                  Records in system
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          {/* Access Logs Card */}
          <Grid item xs={12} md={3}>
            <Card
              sx={{
                height: "100%",
                bgcolor: "info.main",
                color: "white",
              }}
            >
              <CardContent>
                <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                  <Timeline sx={{ fontSize: 40, mr: 1 }} />
                  <Typography variant="h6" fontWeight={600}>
                    Access Logs
                  </Typography>
                </Box>
                <Typography variant="h2" fontWeight={700} sx={{ mb: 1 }}>
                  {accessLogs.length}
                </Typography>
                <Typography variant="body1" sx={{ opacity: 0.9 }}>
                  Recent activities
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          {/* Latest Activity Card */}
          <Grid item xs={12} md={3}>
            <Card
              sx={{
                height: "100%",
                bgcolor: "warning.main",
                color: "white",
              }}
            >
              <CardContent>
                <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                  <Warning sx={{ fontSize: 40, mr: 1 }} />
                  <Typography variant="h6" fontWeight={600}>
                    Latest Activity
                  </Typography>
                </Box>
                <Typography variant="h2" fontWeight={700} sx={{ mb: 1 }}>
                  {accessLogs.length > 0 ? "Now" : "—"}
                </Typography>
                <Typography variant="body1" sx={{ opacity: 0.9 }}>
                  {accessLogs.length > 0 ? accessLogs[0]?.action : "No activity yet"}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          {/* Recent Evidence Table */}
          <Grid item xs={12}>
            <Card elevation={3}>
              <CardContent>
                <Typography variant="h6" gutterBottom fontWeight={600} color="primary">
                  📂 Recent Evidence
                </Typography>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 600 }}>Evidence ID</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Type</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Uploaded By</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Upload Date</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {evidences.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} align="center" sx={{ py: 4 }}>
                          <Typography color="text.secondary">No evidence yet</Typography>
                        </TableCell>
                      </TableRow>
                    ) : (
                      evidences.slice(0, 10).map((evidence) => (
                        <TableRow key={evidence.id} hover>
                          <TableCell>
                            <Typography variant="body2" fontWeight={600}>
                              {evidence.evidenceId}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={evidence.evidenceType}
                              size="small"
                              color="primary"
                              variant="outlined"
                            />
                          </TableCell>
                          <TableCell>{evidence.uploadedBy}</TableCell>
                          <TableCell>{formatDate(evidence.uploadedAt)}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </Grid>

          {/* Recent Access Logs Table */}
          <Grid item xs={12}>
            <Card elevation={3}>
              <CardContent>
                <Typography variant="h6" gutterBottom fontWeight={600} color="primary">
                  📊 Recent Access Logs
                </Typography>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 600 }}>Evidence ID</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Action</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Accessed By</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Access Time</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {accessLogs.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} align="center" sx={{ py: 4 }}>
                          <Typography color="text.secondary">No access logs yet</Typography>
                        </TableCell>
                      </TableRow>
                    ) : (
                      accessLogs.map((log) => (
                        <TableRow key={log.id} hover>
                          <TableCell>
                            <Typography variant="body2" fontWeight={600}>
                              {log.evidenceId}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={log.action}
                              size="small"
                              color={
                                log.action === "uploaded"
                                  ? "success"
                                  : log.action === "viewed"
                                  ? "info"
                                  : log.action === "deleted"
                                  ? "error"
                                  : "default"
                              }
                            />
                          </TableCell>
                          <TableCell>{log.accessedBy}</TableCell>
                          <TableCell>{formatDate(log.accessedAt)}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
}
