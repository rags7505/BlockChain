import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Alert,
  Snackbar,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  OutlinedInput,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
} from '@mui/material';
import {
  PersonAdd,
  Delete,
  CheckCircle,
} from '@mui/icons-material';
import { evidenceApi } from '../services/api';

const BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

const ITEM_HEIGHT = 48;
const ITEM_PADDING_TOP = 8;
const MenuProps = {
  PaperProps: {
    style: {
      maxHeight: ITEM_HEIGHT * 4.5 + ITEM_PADDING_TOP,
      width: 250,
    },
  },
};

export default function AddWalletComponent() {
  const { role } = useAuth();
  const [walletAddress, setWalletAddress] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [selectedEvidence, setSelectedEvidence] = useState<string[]>([]);
  const [evidences, setEvidences] = useState([]);
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });
  const [addedUsers, setAddedUsers] = useState<any[]>([]);

  useEffect(() => {
    loadEvidences();
    loadUsers();
  }, []);

  const loadEvidences = async () => {
    try {
      const result = await evidenceApi.getAllEvidence(role, '');
      if (result.success) {
        setEvidences(result.data);
      }
    } catch (err) {
      console.error('Failed to load evidences:', err);
    }
  };

  const loadUsers = async () => {
    try {
      const response = await axios.get(`${BASE_URL}/api/admin/users`);
      if (response.data.success) {
        // Filter to show only viewer and investigator roles
        const filtered = response.data.data.filter((u: any) => 
          ['viewer', 'investigator'].includes(u.role)
        );
        setAddedUsers(filtered);
      }
    } catch (err) {
      console.error('Failed to load users:', err);
    }
  };

  const handleAddWallet = async () => {
    if (!walletAddress.trim()) {
      setSnackbar({
        open: true,
        message: 'Please enter a wallet address',
        severity: 'error',
      });
      return;
    }

    // Basic Ethereum address validation
    if (!/^0x[a-fA-F0-9]{40}$/.test(walletAddress.trim())) {
      setSnackbar({
        open: true,
        message: 'Invalid Ethereum wallet address format',
        severity: 'error',
      });
      return;
    }

    setLoading(true);

    try {
      const response = await axios.post(`${BASE_URL}/api/admin/add-wallet`, {
        walletAddress: walletAddress.trim(),
        displayName: displayName.trim() || undefined,
        allowedEvidenceIds: selectedEvidence,
      });

      if (response.data.success) {
        setSnackbar({
          open: true,
          message: `Wallet added successfully with viewer role${selectedEvidence.length > 0 ? ` and access to ${selectedEvidence.length} evidence(s)` : ''}`,
          severity: 'success',
        });

        // Reset form
        setWalletAddress('');
        setDisplayName('');
        setSelectedEvidence([]);

        // Reload users list
        loadUsers();
      }
    } catch (err: any) {
      console.error('Add wallet error:', err);
      const errorMessage = err.response?.data?.error || 'Failed to add wallet address';
      setSnackbar({
        open: true,
        message: errorMessage,
        severity: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEvidenceChange = (event: any) => {
    const {
      target: { value },
    } = event;
    setSelectedEvidence(
      typeof value === 'string' ? value.split(',') : value,
    );
  };

  return (
    <Box>
      <Card>
        <CardContent>
          <Box display="flex" alignItems="center" mb={2}>
            <PersonAdd sx={{ mr: 1, color: 'primary.main' }} />
            <Typography variant="h6">Add New Wallet Address</Typography>
          </Box>

          <Alert severity="info" sx={{ mb: 3 }}>
            <Typography variant="body2">
              <strong>Add a new wallet address with viewer role by default.</strong>
              <br />
              Select which evidence they can view, or leave blank for no access.
              <br />
              Investigators can later transfer custody and grant investigator role.
            </Typography>
          </Alert>

          <TextField
            fullWidth
            label="Wallet Address"
            placeholder="0x..."
            value={walletAddress}
            onChange={(e) => setWalletAddress(e.target.value)}
            sx={{ mb: 2 }}
            helperText="Enter the Ethereum wallet address (e.g., 0x1234...)"
          />

          <TextField
            fullWidth
            label="Display Name (Optional)"
            placeholder="John Doe"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            sx={{ mb: 2 }}
            helperText="Optional: A friendly name for this wallet"
          />

          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Evidence Access (Optional)</InputLabel>
            <Select
              multiple
              value={selectedEvidence}
              onChange={handleEvidenceChange}
              input={<OutlinedInput label="Evidence Access (Optional)" />}
              renderValue={(selected) => (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {selected.map((value) => (
                    <Chip key={value} label={value} size="small" />
                  ))}
                </Box>
              )}
              MenuProps={MenuProps}
            >
              {evidences.length === 0 && (
                <MenuItem disabled>
                  <em>No evidence available</em>
                </MenuItem>
              )}
              {evidences.map((evidence: any) => (
                <MenuItem key={evidence.evidenceId} value={evidence.evidenceId}>
                  {evidence.evidenceId} - {evidence.evidenceType}
                </MenuItem>
              ))}
            </Select>
            <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, ml: 1.5 }}>
              {selectedEvidence.length === 0 
                ? 'Leave blank to grant no evidence access initially'
                : `Selected ${selectedEvidence.length} evidence(s)`}
            </Typography>
          </FormControl>

          <Button
            fullWidth
            variant="contained"
            startIcon={<PersonAdd />}
            onClick={handleAddWallet}
            disabled={loading}
          >
            {loading ? 'Adding...' : 'Add Wallet with Viewer Role'}
          </Button>

          <Box mt={2}>
            <Typography variant="caption" color="text.secondary">
              ✅ Default role: <strong>Viewer</strong>
              <br />
              💡 Investigators can upgrade to investigator role when transferring custody
            </Typography>
          </Box>
        </CardContent>
      </Card>

      {/* Recently Added Users */}
      {addedUsers.length > 0 && (
        <Card sx={{ mt: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Recently Added Users
            </Typography>
            <List>
              {addedUsers.slice(0, 5).map((user) => (
                <ListItem key={user.wallet_address}>
                  <ListItemText
                    primary={user.display_name || `${user.wallet_address.slice(0, 10)}...${user.wallet_address.slice(-8)}`}
                    secondary={
                      <>
                        <Typography component="span" variant="body2" color="text.secondary">
                          {user.wallet_address}
                        </Typography>
                        <br />
                        <Chip
                          label={user.role}
                          size="small"
                          color={user.role === 'investigator' ? 'primary' : 'default'}
                          sx={{ mt: 0.5 }}
                        />
                      </>
                    }
                  />
                  <ListItemSecondaryAction>
                    <CheckCircle color="success" />
                  </ListItemSecondaryAction>
                </ListItem>
              ))}
            </List>
          </CardContent>
        </Card>
      )}

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
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
