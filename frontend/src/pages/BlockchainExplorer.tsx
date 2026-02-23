/**
 * Blockchain Explorer Page
 * View transaction details, block information, and verify transaction hashes
 */

import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  TextField,
  Button,
  Chip,
  Divider,
  Alert,
  CircularProgress,
  Grid,
  Table,
  TableBody,
  TableRow,
  TableCell,
} from '@mui/material';
import {
  ArrowBack,
  Search,
  CheckCircle,
  AccessTime,
  LocalGasStation,
  Layers,
  ContentCopy,
  Link as LinkIcon,
} from '@mui/icons-material';
import { ethers } from 'ethers';
import { toast } from '@/hooks/use-toast';

interface TransactionDetails {
  transactionHash: string;
  blockNumber: number;
  blockHash: string;
  from: string;
  to: string | null;
  gasUsed: string;
  gasPrice: string;
  transactionFee: string;
  value: string;
  timestamp: number;
  status: number;
  confirmations: number;
  data: string;
  executionTime?: number;
}

const BlockchainExplorer: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const txHashParam = searchParams.get('tx');

  const [txHash, setTxHash] = useState(txHashParam || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [txDetails, setTxDetails] = useState<TransactionDetails | null>(null);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: 'Copied to clipboard' });
  };

  const formatAddress = (address: string) => {
    if (!address) return 'N/A';
    return `${address.slice(0, 10)}...${address.slice(-8)}`;
  };

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleString();
  };

  const handleSearch = async () => {
    const cleanHash = txHash.trim();
    if (!cleanHash) {
      setError('Please enter a transaction hash');
      return;
    }

    setLoading(true);
    setError(null);
    setTxDetails(null);

    try {
      // Connect to blockchain - use env variable or default to localhost
      const rpcUrl = import.meta.env.VITE_RPC_URL || 'http://127.0.0.1:8545';
      const provider = new ethers.JsonRpcProvider(rpcUrl);
      
      // Get transaction receipt
      const receipt = await provider.getTransactionReceipt(cleanHash);
      
      if (!receipt) {
        throw new Error('Transaction not found. Make sure you are connected to the correct blockchain network.');
      }

      // Get transaction details
      const tx = await provider.getTransaction(cleanHash);
      
      if (!tx) {
        throw new Error('Transaction details not found');
      }

      // Get block details for timestamp
      const block = await provider.getBlock(receipt.blockNumber);
      const currentBlock = await provider.getBlockNumber();

      // Calculate transaction fee (gasUsed * gasPrice)
      const gasPrice = tx.gasPrice || BigInt(0);
      const transactionFee = receipt.gasUsed * gasPrice;

      // Calculate execution time if possible
      let executionTime;
      if (block?.timestamp && tx.blockNumber) {
        const txBlock = await provider.getBlock(tx.blockNumber);
        if (txBlock?.timestamp) {
          executionTime = block.timestamp - txBlock.timestamp;
        }
      }

      const details: TransactionDetails = {
        transactionHash: receipt.hash,
        blockNumber: receipt.blockNumber,
        blockHash: receipt.blockHash,
        from: receipt.from,
        to: receipt.to,
        gasUsed: receipt.gasUsed.toString(),
        gasPrice: gasPrice.toString(),
        transactionFee: ethers.formatEther(transactionFee),
        value: ethers.formatEther(tx.value || 0),
        timestamp: block?.timestamp || 0,
        status: receipt.status || 0,
        confirmations: currentBlock - receipt.blockNumber,
        data: tx.data,
        executionTime,
      };

      setTxDetails(details);
    } catch (err) {
      console.error('Error fetching transaction:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch transaction details');
    } finally {
      setLoading(false);
    }
  };

  // Auto-search if tx hash provided in URL
  React.useEffect(() => {
    if (txHashParam && !txDetails && !loading) {
      handleSearch();
    }
  }, [txHashParam]);

  return (
    <Container maxWidth="lg" className="animate-fade-in" sx={{ py: 4 }}>
      {/* Header */}
      <Box className="flex items-center gap-4 mb-8">
        <Button
          startIcon={<ArrowBack />}
          onClick={() => navigate('/dashboard')}
          sx={{
            color: 'hsl(var(--muted-foreground))',
            '&:hover': {
              color: 'hsl(var(--foreground))',
              backgroundColor: 'hsl(var(--muted))',
            },
          }}
        >
          Back
        </Button>
        <Box>
          <Typography variant="h4" className="font-bold text-foreground">
            Blockchain Explorer
          </Typography>
          <Typography variant="body2" className="text-muted-foreground">
            View transaction details from local blockchain
          </Typography>
        </Box>
      </Box>

      {/* Search Section */}
      <Card
        sx={{
          backgroundColor: 'hsl(var(--card))',
          border: '1px solid hsl(var(--border))',
          borderRadius: '1rem',
          mb: 4,
        }}
      >
        <CardContent className="p-6">
          <Box className="flex items-center gap-3 mb-4">
            <Search sx={{ color: 'hsl(var(--primary))' }} />
            <Typography variant="h6" className="font-semibold text-foreground">
              Transaction Lookup
            </Typography>
          </Box>

          <Box className="flex gap-3">
            <TextField
              fullWidth
              value={txHash}
              onChange={(e) => setTxHash(e.target.value)}
              placeholder="Enter transaction hash (e.g., 0x...)"
              disabled={loading}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              sx={{
                '& .MuiOutlinedInput-root': {
                  backgroundColor: 'hsl(var(--input))',
                  borderRadius: '0.75rem',
                  '& fieldset': { borderColor: 'hsl(var(--border))' },
                  '&:hover fieldset': { borderColor: 'hsl(var(--primary) / 0.5)' },
                  '&.Mui-focused fieldset': { borderColor: 'hsl(var(--primary))' },
                },
                '& .MuiInputBase-input': { 
                  color: 'hsl(var(--foreground))',
                  fontFamily: 'monospace',
                  fontSize: '0.9rem',
                },
              }}
            />
            <Button
              variant="contained"
              onClick={handleSearch}
              disabled={loading || !txHash.trim()}
              startIcon={loading ? <CircularProgress size={20} /> : <Search />}
              sx={{
                px: 4,
                py: 1.5,
                borderRadius: '0.75rem',
                backgroundColor: 'hsl(var(--primary))',
                color: 'hsl(var(--primary-foreground))',
                fontWeight: 600,
                textTransform: 'none',
                whiteSpace: 'nowrap',
                '&:hover': {
                  backgroundColor: 'hsl(var(--primary))',
                },
                '&:disabled': {
                  backgroundColor: 'hsl(var(--muted))',
                  color: 'hsl(var(--muted-foreground))',
                },
              }}
            >
              {loading ? 'Searching...' : 'Search'}
            </Button>
          </Box>

          <Typography variant="caption" className="text-muted-foreground block mt-2">
            💡 Connected to local blockchain (http://localhost:8545)
          </Typography>
        </CardContent>
      </Card>

      {/* Error Alert */}
      {error && (
        <Alert
          severity="error"
          className="mb-4"
          sx={{
            backgroundColor: 'hsl(var(--destructive) / 0.1)',
            color: 'hsl(var(--destructive))',
            border: '1px solid hsl(var(--destructive) / 0.3)',
            borderRadius: '0.75rem',
          }}
        >
          {error}
        </Alert>
      )}

      {/* Transaction Details */}
      {txDetails && (
        <Box className="space-y-4">
          {/* Status Card */}
          <Card
            sx={{
              backgroundColor: txDetails.status === 1 
                ? 'hsl(var(--success) / 0.05)' 
                : 'hsl(var(--destructive) / 0.05)',
              border: txDetails.status === 1
                ? '2px solid hsl(var(--success) / 0.3)'
                : '2px solid hsl(var(--destructive) / 0.3)',
              borderRadius: '1rem',
            }}
          >
            <CardContent className="p-6 text-center">
              <Box
                className="w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center"
                sx={{
                  backgroundColor: txDetails.status === 1
                    ? 'hsl(var(--success) / 0.15)'
                    : 'hsl(var(--destructive) / 0.15)',
                  border: '2px solid',
                  borderColor: txDetails.status === 1
                    ? 'hsl(var(--success))'
                    : 'hsl(var(--destructive))',
                }}
              >
                <CheckCircle 
                  sx={{ 
                    fontSize: 40, 
                    color: txDetails.status === 1
                      ? 'hsl(var(--success))'
                      : 'hsl(var(--destructive))',
                  }} 
                />
              </Box>
              <Typography variant="h5" className="font-bold text-foreground mb-2">
                {txDetails.status === 1 ? 'Transaction Successful' : 'Transaction Failed'}
              </Typography>
              <Chip
                label={`${txDetails.confirmations} Confirmations`}
                size="small"
                sx={{
                  backgroundColor: 'hsl(var(--primary) / 0.15)',
                  color: 'hsl(var(--primary))',
                  fontWeight: 600,
                }}
              />
            </CardContent>
          </Card>

          {/* Details Cards */}
          <Grid container spacing={3}>
            {/* Transaction Hash */}
            <Grid item xs={12}>
              <Card
                sx={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '1rem',
                }}
              >
                <CardContent className="p-6">
                  <Box className="flex items-center justify-between mb-4">
                    <Box className="flex items-center gap-2">
                      <LinkIcon sx={{ color: 'hsl(var(--primary))' }} />
                      <Typography variant="h6" className="font-semibold text-foreground">
                        Transaction Hash
                      </Typography>
                    </Box>
                    <Button
                      size="small"
                      startIcon={<ContentCopy />}
                      onClick={() => copyToClipboard(txDetails.transactionHash)}
                      sx={{ 
                        color: 'hsl(var(--muted-foreground))',
                        textTransform: 'none',
                      }}
                    >
                      Copy
                    </Button>
                  </Box>
                  <Typography
                    variant="body2"
                    className="font-mono break-all text-foreground p-3 rounded"
                    sx={{ backgroundColor: 'hsl(var(--muted) / 0.3)' }}
                  >
                    {txDetails.transactionHash}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            {/* Block Information */}
            <Grid item xs={12} md={6}>
              <Card
                sx={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '1rem',
                }}
              >
                <CardContent className="p-6">
                  <Box className="flex items-center gap-2 mb-4">
                    <Layers sx={{ color: 'hsl(var(--primary))' }} />
                    <Typography variant="h6" className="font-semibold text-foreground">
                      Block Information
                    </Typography>
                  </Box>

                  <Table size="small">
                    <TableBody>
                      <TableRow>
                        <TableCell sx={{ border: 'none', color: 'hsl(var(--muted-foreground))' }}>
                          Block Number
                        </TableCell>
                        <TableCell sx={{ border: 'none', fontWeight: 600, color: 'hsl(var(--foreground))' }}>
                          {txDetails.blockNumber.toLocaleString()}
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell sx={{ border: 'none', color: 'hsl(var(--muted-foreground))' }}>
                          Block Hash
                        </TableCell>
                        <TableCell sx={{ border: 'none', fontFamily: 'monospace', fontSize: '0.85rem', color: 'hsl(var(--foreground))' }}>
                          {formatAddress(txDetails.blockHash)}
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell sx={{ border: 'none', color: 'hsl(var(--muted-foreground))' }}>
                          Confirmations
                        </TableCell>
                        <TableCell sx={{ border: 'none', fontWeight: 600, color: 'hsl(var(--success))' }}>
                          {txDetails.confirmations}
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </Grid>

            {/* Transaction Details */}
            <Grid item xs={12} md={6}>
              <Card
                sx={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '1rem',
                }}
              >
                <CardContent className="p-6">
                  <Box className="flex items-center gap-2 mb-4">
                    <LocalGasStation sx={{ color: 'hsl(var(--primary))' }} />
                    <Typography variant="h6" className="font-semibold text-foreground">
                      Transaction Details
                    </Typography>
                  </Box>

                  <Table size="small">
                    <TableBody>
                      <TableRow>
                        <TableCell sx={{ border: 'none', color: 'hsl(var(--muted-foreground))' }}>
                          Gas Used
                        </TableCell>
                        <TableCell sx={{ border: 'none', fontWeight: 600, color: 'hsl(var(--foreground))' }}>
                          {parseInt(txDetails.gasUsed).toLocaleString()}
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell sx={{ border: 'none', color: 'hsl(var(--muted-foreground))' }}>
                          Gas Price
                        </TableCell>
                        <TableCell sx={{ border: 'none', fontWeight: 600, color: 'hsl(var(--foreground))' }}>
                          {(parseInt(txDetails.gasPrice) / 1e9).toFixed(2)} Gwei
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell sx={{ border: 'none', color: 'hsl(var(--muted-foreground))' }}>
                          Transaction Fee
                        </TableCell>
                        <TableCell sx={{ border: 'none', fontWeight: 600, color: 'hsl(var(--primary))' }}>
                          {parseFloat(txDetails.transactionFee).toFixed(6)} ETH
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell sx={{ border: 'none', color: 'hsl(var(--muted-foreground))' }}>
                          Value Transferred
                        </TableCell>
                        <TableCell sx={{ border: 'none', fontWeight: 600, color: 'hsl(var(--success))' }}>
                          {parseFloat(txDetails.value).toFixed(6)} ETH
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell sx={{ border: 'none', color: 'hsl(var(--muted-foreground))' }}>
                          Timestamp
                        </TableCell>
                        <TableCell sx={{ border: 'none', fontSize: '0.85rem', color: 'hsl(var(--foreground))' }}>
                          {formatTimestamp(txDetails.timestamp)}
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell sx={{ border: 'none', color: 'hsl(var(--muted-foreground))' }}>
                          Status
                        </TableCell>
                        <TableCell sx={{ border: 'none' }}>
                          <Chip
                            label={txDetails.status === 1 ? 'Success' : 'Failed'}
                            size="small"
                            sx={{
                              backgroundColor: txDetails.status === 1
                                ? 'hsl(var(--success) / 0.15)'
                                : 'hsl(var(--destructive) / 0.15)',
                              color: txDetails.status === 1
                                ? 'hsl(var(--success))'
                                : 'hsl(var(--destructive))',
                            }}
                          />
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </Grid>

            {/* Addresses */}
            <Grid item xs={12}>
              <Card
                sx={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '1rem',
                }}
              >
                <CardContent className="p-6">
                  <Typography variant="h6" className="font-semibold text-foreground mb-4">
                    Addresses
                  </Typography>

                  <Box className="space-y-3">
                    <Box>
                      <Typography variant="caption" className="text-muted-foreground uppercase tracking-wider">
                        From
                      </Typography>
                      <Box className="flex items-center justify-between p-3 rounded mt-1" sx={{ backgroundColor: 'hsl(var(--muted) / 0.3)' }}>
                        <Typography variant="body2" className="font-mono text-foreground">
                          {txDetails.from}
                        </Typography>
                        <Button
                          size="small"
                          onClick={() => copyToClipboard(txDetails.from)}
                          sx={{ minWidth: 'auto', p: 0.5 }}
                        >
                          <ContentCopy fontSize="small" />
                        </Button>
                      </Box>
                    </Box>

                    {txDetails.to && (
                      <Box>
                        <Typography variant="caption" className="text-muted-foreground uppercase tracking-wider">
                          To (Contract)
                        </Typography>
                        <Box className="flex items-center justify-between p-3 rounded mt-1" sx={{ backgroundColor: 'hsl(var(--muted) / 0.3)' }}>
                          <Typography variant="body2" className="font-mono text-foreground">
                            {txDetails.to}
                          </Typography>
                          <Button
                            size="small"
                            onClick={() => copyToClipboard(txDetails.to!)}
                            sx={{ minWidth: 'auto', p: 0.5 }}
                          >
                            <ContentCopy fontSize="small" />
                          </Button>
                        </Box>
                      </Box>
                    )}
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            {/* Transaction Data */}
            {txDetails.data && txDetails.data !== '0x' && (
              <Grid item xs={12}>
                <Card
                  sx={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '1rem',
                  }}
                >
                  <CardContent className="p-6">
                    <Box className="flex items-center justify-between mb-4">
                      <Typography variant="h6" className="font-semibold text-foreground">
                        Transaction Data
                      </Typography>
                      <Button
                        size="small"
                        startIcon={<ContentCopy />}
                        onClick={() => copyToClipboard(txDetails.data)}
                        sx={{ 
                          color: 'hsl(var(--muted-foreground))',
                          textTransform: 'none',
                        }}
                      >
                        Copy
                      </Button>
                    </Box>
                    <Box
                      className="p-4 rounded overflow-auto"
                      sx={{
                        backgroundColor: 'hsl(var(--muted) / 0.3)',
                        maxHeight: '200px',
                      }}
                    >
                      <Typography
                        variant="body2"
                        className="font-mono break-all text-foreground"
                        sx={{ fontSize: '0.75rem', lineHeight: 1.6 }}
                      >
                        {txDetails.data}
                      </Typography>
                    </Box>
                    <Typography variant="caption" className="text-muted-foreground mt-2 block">
                      Data Size: {(txDetails.data.length / 2 - 1).toLocaleString()} bytes
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            )}
          </Grid>
        </Box>
      )}

      {/* Info Card */}
      {!txDetails && !loading && (
        <Card
          sx={{
            backgroundColor: 'hsl(var(--muted) / 0.3)',
            border: '1px solid hsl(var(--border))',
            borderRadius: '1rem',
          }}
        >
          <CardContent className="p-6 text-center">
            <Typography variant="body2" className="text-muted-foreground">
              Enter a transaction hash above to view its details on the local blockchain.
              <br />
              You can find transaction hashes in the success screen after uploading evidence.
            </Typography>
          </CardContent>
        </Card>
      )}
    </Container>
  );
};

export default BlockchainExplorer;
