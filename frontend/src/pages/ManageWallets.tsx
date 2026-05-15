import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  TextField,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  MenuItem,
  AppBar,
  Toolbar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  Alert,
  Snackbar,
} from '@mui/material';
import {
  AdminPanelSettings,
  Add,
  ArrowBack,
  ExitToApp,
} from '@mui/icons-material';
import axios from 'axios';

const BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

export default function ManageWallets() {
  const { role, logout } = useAuth();
  const navigate = useNavigate();
  const [wallets, setWallets] = useState<any[]>([]);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newWallet, setNewWallet] = useState('');
  const [newRole, setNewRole] = useState('viewer');
  const [newDisplayName, setNewDisplayName] = useState('');
  const [editingWallet, setEditingWallet] = useState<any>(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });

  useEffect(() => {
    if (role !== 'superadmin' && role !== 'judge') {
      navigate('/dashboard');
      return;
    }
    loadWallets();
  }, [role]);

  const availableRoles = role === 'superadmin' ? ['judge', 'investigator', 'viewer'] : ['investigator', 'viewer'];

  const loadWallets = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/api/wallet-auth/wallets`);
      if (res.data.success) {
        setWallets(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load wallets:', err);
    }
  };

  const handleEditWallet = (wallet: any) => {
    setEditingWallet(wallet);
    setNewWallet(wallet.wallet_address);
    setNewRole(wallet.role);
    setNewDisplayName(wallet.display_name || '');
    setShowAddDialog(true);
  };

  const handleDeleteWallet = async (wallet: any) => {
    if (!confirm(`Are you sure you want to delete wallet ${wallet.wallet_address}?`)) {
      return;
    }
    try {
      const res = await axios.delete(`${BASE_URL}/api/wallet-auth/wallets/${wallet.wallet_address}`);
      if (res.data.success) {
        setSnackbar({
          open: true,
          message: 'Wallet deleted successfully!',
          severity: 'success',
        });
        loadWallets();
      }
    } catch (err: any) {
      setSnackbar({
        open: true,
        message: err.response?.data?.error || 'Failed to delete wallet',
        severity: 'error',
      });
    }
  };

  const handleAssignRole = async () => {
    try {
      const res = await axios.post(`${BASE_URL}/api/wallet-auth/assign-role`, {
        walletAddress: newWallet,
        role: newRole,
        displayName: newDisplayName || null,
      });

      if (res.data.success) {
        setSnackbar({
          open: true,
          message: `Role assigned successfully!`,
          severity: 'success',
        });
        loadWallets();
        setShowAddDialog(false);
        setNewWallet('');
        setNewRole('viewer');
        setNewDisplayName('');
        setEditingWallet(null);
      }
    } catch (err: any) {
      setSnackbar({
        open: true,
        message: err.response?.data?.error || 'Failed to assign role',
        severity: 'error',
      });
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'judge':
        return 'error';
      case 'investigator':
        return 'info';
      case 'viewer':
        return 'default';
      default:
        return 'default';
    }
  };

  return (
    <Box sx={{ minHeight: '100vh' }}>
      <AppBar position="static" sx={{ backgroundColor: '#d32f2f' }}>
        <Toolbar>
          <AdminPanelSettings sx={{ mr: 2 }} />
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            Manage Wallet Roles
          </Typography>
          <Button
            startIcon={<ArrowBack />}
            color="inherit"
            onClick={() => navigate('/dashboard')}
            sx={{ mr: 2 }}
          >
            Back
          </Button>
          <Button startIcon={<ExitToApp />} color="inherit" onClick={logout}>
            Logout
          </Button>
        </Toolbar>
      </AppBar>

      <Box sx={{ p: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4">Registered Wallet Addresses</Typography>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => setShowAddDialog(true)}
          >
            Add / Update Wallet
          </Button>
        </Box>

        <Alert severity="info" sx={{ mb: 3 }}>
          <Typography variant="body2">
            <strong>Judge Panel:</strong> Assign roles to Ethereum wallet addresses. Users must own the wallet to login.
          </Typography>
        </Alert>

        <Card>
          <CardContent>
            {wallets.length === 0 ? (
              <Typography color="text.secondary">No wallets registered yet.</Typography>
            ) : (
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Wallet Address</TableCell>
                    <TableCell>Display Name</TableCell>
                    <TableCell>Role</TableCell>
                    <TableCell>Last Login</TableCell>
                    <TableCell>Created At</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {wallets.filter(wallet => wallet.role !== 'superadmin').map((wallet) => (
                    <TableRow key={wallet.id}>
                      <TableCell>
                        <Typography variant="body2" fontFamily="monospace">
                          {wallet.wallet_address}
                        </Typography>
                      </TableCell>
                      <TableCell>{wallet.display_name || '-'}</TableCell>
                      <TableCell>
                        <Chip
                          label={wallet.role}
                          color={getRoleColor(wallet.role)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        {wallet.last_login
                          ? new Date(wallet.last_login).toLocaleString()
                          : 'Never'}
                      </TableCell>
                      <TableCell>
                        {new Date(wallet.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={() => handleEditWallet(wallet)}
                          sx={{ mr: 1 }}
                        >
                          Edit
                        </Button>
                        <Button
                          size="small"
                          variant="outlined"
                          color="error"
                          onClick={() => handleDeleteWallet(wallet)}
                        >
                          Delete
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

      {/* Add/Update Wallet Dialog */}
      <Dialog open={showAddDialog} onClose={() => { setShowAddDialog(false); setEditingWallet(null); setNewWallet(''); setNewRole('viewer'); setNewDisplayName(''); }} maxWidth="sm" fullWidth>
        <DialogTitle>{editingWallet ? 'Edit Wallet' : 'Add New Wallet'}</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Wallet Address"
            placeholder="0x..."
            value={newWallet}
            onChange={(e) => setNewWallet(e.target.value)}
            disabled={!!editingWallet}
            sx={{ mt: 2, mb: 2 }}
            helperText={editingWallet ? "Wallet address cannot be changed" : "Ethereum wallet address (42 characters starting with 0x)"}
          />
          <TextField
            fullWidth
            label="Display Name (Optional)"
            placeholder="John Doe"
            value={newDisplayName}
            onChange={(e) => setNewDisplayName(e.target.value)}
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            select
            label="Role"
            value={newRole}
            onChange={(e) => setNewRole(e.target.value)}
            helperText="Select the access level for this wallet"
            sx={{ mb: 2 }}
          >
            {availableRoles.map(r => (
              <MenuItem key={r} value={r}>
                {r === 'superadmin' ? 'Superadmin (System Administrator)' :
                 r === 'judge' ? 'Judge (Full Access)' :
                 r === 'investigator' ? 'Investigator (Upload + Verify)' :
                 'Viewer (View Only)'}
              </MenuItem>
            ))}
          </TextField>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setShowAddDialog(false); setEditingWallet(null); setNewWallet(''); setNewRole('viewer'); setNewDisplayName(''); }}>Cancel</Button>
          <Button
            onClick={handleAssignRole}
            variant="contained"
            disabled={!newWallet || !newWallet.startsWith('0x')}
          >
            {editingWallet ? 'Update' : 'Add Wallet'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert severity={snackbar.severity}>{snackbar.message}</Alert>
      </Snackbar>
    </Box>
  );
}
