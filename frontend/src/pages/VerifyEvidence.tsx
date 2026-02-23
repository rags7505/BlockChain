/**
 * Verify Evidence Page
 * Verify evidence integrity by comparing file hashes with blockchain records
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Card,
  CardContent,
  TextField,
  Button,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  ArrowBack,
  Search,
  VerifiedUser,
} from '@mui/icons-material';
import FileUpload from '@/components/FileUpload';
import VerificationBadge from '@/components/VerificationBadge';
import { computeFileHash, compareHashes } from '@/services/hash';
import { getStoredHash } from '@/services/blockchain';
import { evidenceApi } from '@/services/api';
import { toast } from '@/hooks/use-toast';
import { EvidenceType } from '@/types';

type VerificationStatus = 'idle' | 'verifying' | 'verified' | 'tampered' | 'error';

const VerifyEvidence: React.FC = () => {
  const navigate = useNavigate();
  
  // Form state
  const [evidenceId, setEvidenceId] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileUploadKey, setFileUploadKey] = useState(0); // Key to force FileUpload reset
  const [detectedEvidenceType, setDetectedEvidenceType] = useState<EvidenceType | null>(null);
  const [evidenceExists, setEvidenceExists] = useState<boolean | null>(null);
  
  // Verification state
  const [status, setStatus] = useState<VerificationStatus>('idle');
  const [storedHash, setStoredHash] = useState<string | null>(null);
  const [computedHash, setComputedHash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Detect evidence type when Evidence ID changes
  const handleEvidenceIdChange = async (value: string) => {
    setEvidenceId(value);
    setDetectedEvidenceType(null);
    setEvidenceExists(null);
    
    // Only fetch if ID is at least 3 characters
    if (value.trim().length >= 3) {
      try {
        const result = await evidenceApi.getEvidenceByEvidenceId(value.trim());
        if (result.success && result.data) {
          // Found evidence, set its type
          setDetectedEvidenceType(result.data.evidenceType as EvidenceType);
          setEvidenceExists(true);
        } else {
          // Evidence not found
          setDetectedEvidenceType(null);
          setEvidenceExists(false);
        }
      } catch (err) {
        // Error fetching
        setDetectedEvidenceType(null);
        setEvidenceExists(false);
      }
    }
  };

  const handleFileSelect = async (file: File) => {
    setSelectedFile(file);
    setError(null);
    
    // Compute hash immediately
    try {
      const hash = await computeFileHash(file);
      setComputedHash(hash);
    } catch (err) {
      console.error('Failed to compute hash:', err);
      setError('Failed to compute file hash');
    }
  };

  const handleVerify = async () => {
    if (!evidenceId.trim()) {
      setError('Please enter an Evidence ID');
      return;
    }
    if (!selectedFile || !computedHash) {
      setError('Please select a file to verify');
      return;
    }

    setError(null);
    setStatus('verifying');

    try {
      // Try to fetch from backend first as fallback
      let hashToCompare = null;
      
      try {
        const evidenceData = await evidenceApi.getEvidenceById(evidenceId.trim());
        if (evidenceData.success && evidenceData.data) {
          hashToCompare = evidenceData.data.fileHash;
          console.log('Using backend hash:', hashToCompare);
        }
      } catch (backendErr) {
        console.log('Backend fetch failed, trying blockchain:', backendErr);
      }

      // If backend doesn't have it, try blockchain
      if (!hashToCompare) {
        try {
          hashToCompare = await getStoredHash(evidenceId.trim());
          console.log('Using blockchain hash:', hashToCompare);
        } catch (blockchainErr) {
          throw new Error('Evidence not found in system. Please check the Evidence ID.');
        }
      }

      setStoredHash(hashToCompare);

      // Compare hashes
      const isMatch = compareHashes(computedHash, hashToCompare);
      
      if (isMatch) {
        setStatus('verified');
        // Don't use toast/alert - show on screen only
      } else {
        setStatus('tampered');
        // Don't use toast/alert - show on screen only
      }

    } catch (err) {
      console.error('Verification error:', err);
      setStatus('error');
      setError(err instanceof Error ? err.message : 'Failed to verify evidence');
    }
  };

  const handleReset = () => {
    setEvidenceId('');
    setSelectedFile(null);
    setStatus('idle');
    setStoredHash(null);
    setComputedHash(null);
    setError(null);
    setDetectedEvidenceType(null);
    setEvidenceExists(null);
    setFileUploadKey(prev => prev + 1); // Force FileUpload component to reset
  };

  const showResult = status === 'verified' || status === 'tampered' || status === 'error';

  return (
    <Box className="animate-fade-in">
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
            Verify Evidence
          </Typography>
          <Typography variant="body2" className="text-muted-foreground">
            Check evidence integrity against blockchain records
          </Typography>
        </Box>
      </Box>

      {error && (
        <Alert
          severity="error"
          className="mb-6"
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

      <Box className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Section */}
        <Box className="space-y-6">
          {/* Evidence ID Card */}
          <Card
            sx={{
              backgroundColor: 'hsl(var(--card))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '1rem',
            }}
          >
            <CardContent className="p-6">
              <Box className="flex items-center gap-3 mb-6">
                <Box
                  className="w-10 h-10 rounded-lg flex items-center justify-center"
                  sx={{ backgroundColor: 'hsl(var(--primary) / 0.15)' }}
                >
                  <Search sx={{ color: 'hsl(var(--primary))' }} />
                </Box>
                <Typography variant="h6" className="font-semibold text-foreground">
                  Evidence Lookup
                </Typography>
              </Box>

              <Box>
                <Typography variant="caption" className="text-muted-foreground uppercase tracking-wider mb-2 block">
                  Evidence ID
                </Typography>
                <TextField
                  fullWidth
                  value={evidenceId}
                  onChange={(e) => handleEvidenceIdChange(e.target.value)}
                  placeholder="Enter the evidence ID to verify"
                  disabled={status === 'verifying'}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      backgroundColor: 'hsl(var(--input))',
                      borderRadius: '0.75rem',
                      '& fieldset': { borderColor: 'hsl(var(--border))' },
                      '&:hover fieldset': { borderColor: 'hsl(var(--primary) / 0.5)' },
                      '&.Mui-focused fieldset': { borderColor: 'hsl(var(--primary))' },
                    },
                    '& .MuiInputBase-input': { color: 'hsl(var(--foreground))' },
                  }}
                />
              </Box>
            </CardContent>
          </Card>

          {/* File Upload Card */}
          <Card
            sx={{
              backgroundColor: 'hsl(var(--card))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '1rem',
            }}
          >
            <CardContent className="p-6">
              <Box className="flex items-center gap-3 mb-6">
                <Box
                  className="w-10 h-10 rounded-lg flex items-center justify-center"
                  sx={{ backgroundColor: 'hsl(var(--success) / 0.15)' }}
                >
                  <VerifiedUser sx={{ color: 'hsl(var(--success))' }} />
                </Box>
                <Typography variant="h6" className="font-semibold text-foreground">
                  Evidence File
                </Typography>
              </Box>

              <FileUpload
                key={fileUploadKey}
                onFileSelect={handleFileSelect}
                disabled={status === 'verifying'}
                evidenceType={detectedEvidenceType || undefined}
              />

              {detectedEvidenceType && (
                <Alert
                  severity="success"
                  className="mt-2"
                  sx={{
                    backgroundColor: 'hsl(var(--success) / 0.1)',
                    color: 'hsl(var(--success))',
                    border: '1px solid hsl(var(--success) / 0.3)',
                    borderRadius: '0.75rem',
                    fontSize: '0.75rem',
                    py: 0.5,
                  }}
                >
                  ✓ Evidence found - Type: <strong>{detectedEvidenceType.toUpperCase()}</strong> (only {detectedEvidenceType} files accepted)
                </Alert>
              )}
              {evidenceExists === false && evidenceId.length >= 3 && (
                <Alert
                  severity="warning"
                  className="mt-2"
                  sx={{
                    backgroundColor: 'hsl(var(--warning) / 0.1)',
                    color: 'hsl(var(--warning))',
                    border: '1px solid hsl(var(--warning) / 0.3)',
                    borderRadius: '0.75rem',
                    fontSize: '0.75rem',
                    py: 0.5,
                  }}
                >
                  ⚠ Evidence ID not found in system
                </Alert>
              )}

              {computedHash && (
                <Box
                  className="mt-4 p-4 rounded-xl"
                  sx={{
                    backgroundColor: 'hsl(var(--muted) / 0.3)',
                    border: '1px solid hsl(var(--border))',
                  }}
                >
                  <Typography variant="caption" className="text-muted-foreground uppercase tracking-wider mb-2 block">
                    Computed Hash (SHA-256)
                  </Typography>
                  <Typography variant="body2" className="font-mono text-foreground break-all text-xs">
                    {computedHash}
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>

          {/* Verify Button */}
          <Button
            fullWidth
            variant="contained"
            size="large"
            onClick={showResult ? handleReset : handleVerify}
            disabled={status === 'verifying' || (!showResult && (!selectedFile || !evidenceId.trim()))}
            startIcon={
              status === 'verifying' ? (
                <CircularProgress size={20} color="inherit" />
              ) : (
                <VerifiedUser />
              )
            }
            sx={{
              py: 2,
              borderRadius: '0.75rem',
              backgroundColor: showResult ? 'hsl(var(--secondary))' : 'hsl(var(--success))',
              color: showResult ? 'hsl(var(--secondary-foreground))' : 'hsl(var(--success-foreground))',
              fontWeight: 600,
              fontSize: '1rem',
              textTransform: 'none',
              '&:hover': {
                backgroundColor: showResult ? 'hsl(var(--secondary))' : 'hsl(var(--success))',
                transform: 'translateY(-2px)',
              },
              '&:disabled': {
                backgroundColor: 'hsl(var(--muted))',
                color: 'hsl(var(--muted-foreground))',
              },
              transition: 'all 0.2s ease',
            }}
          >
            {status === 'verifying'
              ? 'Verifying...'
              : showResult
              ? 'Verify Another'
              : 'Verify Evidence Integrity'}
          </Button>
        </Box>

        {/* Result Section */}
        <Box>
          {status === 'idle' && (
            <Card
              sx={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '1rem',
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <CardContent className="text-center py-16">
                <Box
                  className="w-20 h-20 rounded-full mx-auto mb-6 flex items-center justify-center"
                  sx={{
                    backgroundColor: 'hsl(var(--muted))',
                  }}
                >
                  <VerifiedUser sx={{ fontSize: 40, color: 'hsl(var(--muted-foreground))' }} />
                </Box>
                <Typography variant="h6" className="text-foreground mb-2">
                  Ready to Verify
                </Typography>
                <Typography variant="body2" className="text-muted-foreground max-w-xs mx-auto">
                  Enter an Evidence ID and upload the file to verify its integrity against the blockchain record
                </Typography>
              </CardContent>
            </Card>
          )}

          {status === 'verifying' && (
            <Card
              sx={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '1rem',
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <CardContent className="text-center py-16">
                <Box className="blockchain-loading">
                  <Box
                    className="w-20 h-20 rounded-full mx-auto mb-6 flex items-center justify-center"
                    sx={{
                      backgroundColor: 'hsl(var(--primary) / 0.15)',
                      border: '2px solid hsl(var(--primary))',
                    }}
                  >
                    <CircularProgress size={32} sx={{ color: 'hsl(var(--primary))' }} />
                  </Box>
                </Box>
                <Typography variant="h6" className="text-foreground mb-2">
                  Verifying Evidence
                </Typography>
                <Typography variant="body2" className="text-muted-foreground">
                  Fetching blockchain records and comparing hashes...
                </Typography>
              </CardContent>
            </Card>
          )}

          {showResult && (
            <VerificationBadge
              status={status === 'error' ? 'error' : status as 'verified' | 'tampered'}
              storedHash={storedHash || undefined}
              computedHash={computedHash || undefined}
              message={error || undefined}
            />
          )}
        </Box>
      </Box>

      {/* Info Box */}
      <Card
        className="mt-8"
        sx={{
          backgroundColor: 'hsl(var(--card))',
          border: '1px solid hsl(var(--border))',
          borderRadius: '1rem',
        }}
      >
        <CardContent className="p-6">
          <Typography variant="subtitle2" className="text-foreground font-semibold mb-4">
            How Verification Works
          </Typography>
          <Box className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Box className="flex items-start gap-3">
              <Box
                className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                sx={{ backgroundColor: 'hsl(var(--primary) / 0.15)' }}
              >
                <Typography variant="body2" className="font-bold text-primary">1</Typography>
              </Box>
              <Box>
                <Typography variant="body2" className="font-medium text-foreground">
                  Compute File Hash
                </Typography>
                <Typography variant="caption" className="text-muted-foreground">
                  SHA-256 hash is computed locally from your uploaded file
                </Typography>
              </Box>
            </Box>
            <Box className="flex items-start gap-3">
              <Box
                className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                sx={{ backgroundColor: 'hsl(var(--primary) / 0.15)' }}
              >
                <Typography variant="body2" className="font-bold text-primary">2</Typography>
              </Box>
              <Box>
                <Typography variant="body2" className="font-medium text-foreground">
                  Fetch Blockchain Record
                </Typography>
                <Typography variant="caption" className="text-muted-foreground">
                  The original hash is retrieved from the smart contract
                </Typography>
              </Box>
            </Box>
            <Box className="flex items-start gap-3">
              <Box
                className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                sx={{ backgroundColor: 'hsl(var(--primary) / 0.15)' }}
              >
                <Typography variant="body2" className="font-bold text-primary">3</Typography>
              </Box>
              <Box>
                <Typography variant="body2" className="font-medium text-foreground">
                  Compare Hashes
                </Typography>
                <Typography variant="caption" className="text-muted-foreground">
                  Matching hashes confirm evidence integrity
                </Typography>
              </Box>
            </Box>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default VerifyEvidence;