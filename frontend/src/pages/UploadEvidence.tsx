/**
 * Upload Evidence Page
 * Form for uploading evidence files and registering them on blockchain
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
  MenuItem,
  Alert,
  Stepper,
  Step,
  StepLabel,
  CircularProgress,
  Chip,
} from '@mui/material';
import {
  CloudUpload,
  ArrowBack,
  CheckCircle,
  Tag,
  ContentCopy,
} from '@mui/icons-material';
import FileUpload from '@/components/FileUpload';
import { EvidenceType, TransactionResult } from '@/types';
import { evidenceApi } from '@/services/api';
import { registerEvidenceOnChain, formatTxHash } from '@/services/blockchain';
import { computeFileHash } from '@/services/hash';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';

const EVIDENCE_TYPES: { value: EvidenceType; label: string }[] = [
  { value: 'image', label: 'Image' },
  { value: 'pdf', label: 'PDF Document' },
  { value: 'text', label: 'Text Document (.txt)' },
];

const STEPS = ['Enter Details', 'Upload File', 'Register on Blockchain'];

const UploadEvidence: React.FC = () => {
  const navigate = useNavigate();
  const { displayName, walletAddress } = useAuth();
  
  // Form state
  const [evidenceId, setEvidenceId] = useState('');
  const [evidenceType, setEvidenceType] = useState<EvidenceType>('image');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  
  // Process state
  const [activeStep, setActiveStep] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [fileHash, setFileHash] = useState<string | null>(null);
  const [txResult, setTxResult] = useState<TransactionResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelect = async (file: File) => {
    setSelectedFile(file);
    setError(null);
    
    // Compute hash immediately for preview
    try {
      const hash = await computeFileHash(file);
      setFileHash(hash);
    } catch (err) {
      console.error('Failed to compute hash:', err);
    }
  };

  const handleSubmit = async () => {
    if (!evidenceId.trim()) {
      setError('Please enter an Evidence ID');
      return;
    }
    if (!selectedFile) {
      setError('Please select a file to upload');
      return;
    }

    setError(null);
    delete (window as any).__evidenceSuggestion;
    setIsUploading(true);
    setActiveStep(1);

    try {
      // Step 1: Compute hash locally first
      setUploadProgress(20);
      const localHash = await computeFileHash(selectedFile);
      setFileHash(localHash);

      // Step 2: Register on blockchain FIRST (user must approve)
      setActiveStep(2);
      setUploadProgress(40);
      
      let blockchainResult;
      try {
        blockchainResult = await registerEvidenceOnChain(evidenceId.trim(), localHash);
        setTxResult(blockchainResult);
      } catch (blockchainErr: any) {
        console.error('Blockchain registration failed:', blockchainErr);
        
        // Better error messages
        let message = 'Blockchain registration failed. Evidence NOT saved.';
        if (blockchainErr?.message) {
          message = blockchainErr.message;
        }
        
        throw new Error(message);
      }

      // Step 3: Upload to backend ONLY after blockchain success
      setActiveStep(1);
      setUploadProgress(70);
      
      const uploadResponse = await evidenceApi.uploadEvidence({
        evidenceId: evidenceId.trim(),
        evidenceType,
        file: selectedFile,
        uploadedBy: walletAddress || 'unknown',  // Use wallet address for permission matching
        blockchainTxHash: blockchainResult.transactionHash,
      });

      if (!uploadResponse.success || !uploadResponse.data) {
        throw new Error(uploadResponse.error || 'Backend upload failed after blockchain registration');
      }

      setUploadProgress(100);
      setActiveStep(3);
      
    } catch (err) {
      console.error('Upload error:', err);
      
      let errorMessage = 'An error occurred during upload';
      let suggestion = '';
      
      if (err instanceof Error) {
        errorMessage = err.message;
        
        const match = errorMessage.match(/Try: (.+)$/);
        if (match) {
          suggestion = match[1];
          errorMessage = errorMessage.replace(/\.\s*Try:\s*.+$/, '');
        }
      }
      
      setError(errorMessage);
      if (suggestion) {
        (window as any).__evidenceSuggestion = suggestion;
      } else {
        delete (window as any).__evidenceSuggestion;
      }
      setActiveStep(0);
    } finally {
      setIsUploading(false);
    }
  };

  const handleReset = () => {
    setEvidenceId('');
    setEvidenceType('image');
    setSelectedFile(null);
    setFileHash(null);
    setTxResult(null);
    setActiveStep(0);
    setError(null);
    setUploadProgress(0);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: 'Copied to clipboard',
    });
  };

  const isComplete = txResult !== null;

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
            Upload Evidence
          </Typography>
          <Typography variant="body2" className="text-muted-foreground">
            Register new evidence on the blockchain
          </Typography>
        </Box>
      </Box>

      {/* Stepper */}
      <Card
        sx={{
          backgroundColor: 'hsl(var(--card))',
          border: '1px solid hsl(var(--border))',
          borderRadius: '1rem',
          mb: 4,
        }}
      >
        <CardContent className="py-6">
          <Stepper
            activeStep={isComplete ? 3 : activeStep}
            alternativeLabel
            sx={{
              '& .MuiStepLabel-label': {
                color: 'hsl(var(--muted-foreground))',
                '&.Mui-active': {
                  color: 'hsl(var(--primary))',
                },
                '&.Mui-completed': {
                  color: 'hsl(var(--success))',
                },
              },
              '& .MuiStepIcon-root': {
                color: 'hsl(var(--muted))',
                '&.Mui-active': {
                  color: 'hsl(var(--primary))',
                },
                '&.Mui-completed': {
                  color: 'hsl(var(--success))',
                },
              },
            }}
          >
            {STEPS.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>
        </CardContent>
      </Card>

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
          <Typography variant="body2" fontWeight="bold" gutterBottom>
            {error}
          </Typography>
          {(window as any).__evidenceSuggestion && (
            <Box
              sx={{
                mt: 1,
                p: 1,
                backgroundColor: 'hsl(var(--success) / 0.1)',
                border: '1px solid hsl(var(--success) / 0.3)',
                borderRadius: '0.5rem',
              }}
            >
              <Typography variant="body2" sx={{ color: 'hsl(var(--success))' }}>
                💡 Suggestion: Try using "{(window as any).__evidenceSuggestion}"
              </Typography>
            </Box>
          )}
        </Alert>
      )}

      {/* Success State */}
      {isComplete ? (
        <Card
          sx={{
            backgroundColor: 'hsl(var(--success) / 0.05)',
            border: '2px solid hsl(var(--success) / 0.3)',
            borderRadius: '1.5rem',
          }}
        >
          <CardContent className="p-8 text-center">
            <Box
              className="w-20 h-20 rounded-full mx-auto mb-6 flex items-center justify-center verification-pulse"
              sx={{
                backgroundColor: 'hsl(var(--success) / 0.15)',
                border: '2px solid hsl(var(--success))',
              }}
            >
              <CheckCircle sx={{ fontSize: 40, color: 'hsl(var(--success))' }} />
            </Box>

            <Typography variant="h5" className="font-bold text-foreground mb-2">
              Evidence Registered Successfully
            </Typography>
            <Typography variant="body2" className="text-muted-foreground mb-8">
              Your evidence has been securely stored and registered on the blockchain
            </Typography>

            <Box className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto">
              <Box
                className="p-4 rounded-xl text-left"
                sx={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                }}
              >
                <Typography variant="caption" className="text-muted-foreground uppercase tracking-wider">
                  Evidence ID
                </Typography>
                <Box className="flex items-center justify-between mt-1">
                  <Typography variant="body2" className="font-mono text-foreground">
                    {evidenceId}
                  </Typography>
                  <Button
                    size="small"
                    onClick={() => copyToClipboard(evidenceId)}
                    sx={{ minWidth: 'auto', p: 0.5 }}
                  >
                    <ContentCopy fontSize="small" />
                  </Button>
                </Box>
              </Box>

              <Box
                className="p-4 rounded-xl text-left"
                sx={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                }}
              >
                <Typography variant="caption" className="text-muted-foreground uppercase tracking-wider">
                  Transaction Hash
                </Typography>
                <Box className="flex items-center justify-between mt-1">
                  <Typography variant="body2" className="font-mono text-foreground">
                    {formatTxHash(txResult.transactionHash)}
                  </Typography>
                  <Box className="flex gap-1">
                    <Button
                      size="small"
                      onClick={() => copyToClipboard(txResult.transactionHash)}
                      sx={{ minWidth: 'auto', p: 0.5 }}
                      title="Copy hash"
                    >
                      <ContentCopy fontSize="small" />
                    </Button>
                    <Button
                      size="small"
                      onClick={() => navigate(`/explorer?tx=${txResult.transactionHash}`)}
                      sx={{ minWidth: 'auto', p: 0.5 }}
                      title="View in blockchain explorer"
                    >
                      🔍
                    </Button>
                  </Box>
                </Box>
              </Box>

              <Box
                className="p-4 rounded-xl text-left md:col-span-2"
                sx={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                }}
              >
                <Typography variant="caption" className="text-muted-foreground uppercase tracking-wider">
                  File Hash (SHA-256)
                </Typography>
                <Box className="flex items-center justify-between mt-1">
                  <Typography variant="body2" className="font-mono text-foreground break-all text-xs">
                    {fileHash}
                  </Typography>
                  <Button
                    size="small"
                    onClick={() => fileHash && copyToClipboard(fileHash)}
                    sx={{ minWidth: 'auto', p: 0.5, ml: 1 }}
                  >
                    <ContentCopy fontSize="small" />
                  </Button>
                </Box>
              </Box>
            </Box>

            <Box className="flex gap-4 justify-center mt-8">
              <Button
                variant="outlined"
                onClick={handleReset}
                sx={{
                  borderColor: 'hsl(var(--border))',
                  color: 'hsl(var(--foreground))',
                  '&:hover': {
                    borderColor: 'hsl(var(--primary))',
                    backgroundColor: 'hsl(var(--primary) / 0.1)',
                  },
                }}
              >
                Upload Another
              </Button>
              <Button
                variant="contained"
                onClick={() => navigate('/verify')}
                sx={{
                  backgroundColor: 'hsl(var(--primary))',
                  color: 'hsl(var(--primary-foreground))',
                  '&:hover': {
                    backgroundColor: 'hsl(var(--primary))',
                  },
                }}
              >
                Verify Evidence
              </Button>
            </Box>
          </CardContent>
        </Card>
      ) : (
        /* Upload Form */
        <Box className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Form Card */}
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
                  <Tag sx={{ color: 'hsl(var(--primary))' }} />
                </Box>
                <Typography variant="h6" className="font-semibold text-foreground">
                  Evidence Details
                </Typography>
              </Box>

              <Box className="space-y-6">
                <Box>
                  <Typography variant="caption" className="text-muted-foreground uppercase tracking-wider mb-2 block">
                    Evidence ID
                  </Typography>
                  <TextField
                    fullWidth
                    value={evidenceId}
                    onChange={(e) => setEvidenceId(e.target.value)}
                    placeholder="e.g., CASE-2024-001-EV01"
                    disabled={isUploading}
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

                <Box>
                  <Typography variant="caption" className="text-muted-foreground uppercase tracking-wider mb-2 block">
                    Evidence Type
                  </Typography>
                  <TextField
                    fullWidth
                    select
                    value={evidenceType}
                    onChange={(e) => setEvidenceType(e.target.value as EvidenceType)}
                    disabled={isUploading}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        backgroundColor: 'hsl(var(--input))',
                        borderRadius: '0.75rem',
                        '& fieldset': { borderColor: 'hsl(var(--border))' },
                        '&:hover fieldset': { borderColor: 'hsl(var(--primary) / 0.5)' },
                        '&.Mui-focused fieldset': { borderColor: 'hsl(var(--primary))' },
                      },
                      '& .MuiInputBase-input': { color: 'hsl(var(--foreground))' },
                      '& .MuiSvgIcon-root': { color: 'hsl(var(--muted-foreground))' },
                    }}
                  >
                    {EVIDENCE_TYPES.map((type) => (
                      <MenuItem key={type.value} value={type.value}>
                        {type.label}
                      </MenuItem>
                    ))}
                  </TextField>
                </Box>

                {fileHash && (
                  <Box
                    className="p-4 rounded-xl"
                    sx={{
                      backgroundColor: 'hsl(var(--muted) / 0.3)',
                      border: '1px solid hsl(var(--border))',
                    }}
                  >
                    <Typography variant="caption" className="text-muted-foreground uppercase tracking-wider mb-2 block">
                      Computed Hash (SHA-256)
                    </Typography>
                    <Typography variant="body2" className="font-mono text-foreground break-all text-xs">
                      {fileHash}
                    </Typography>
                  </Box>
                )}
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
                  sx={{ backgroundColor: 'hsl(var(--primary) / 0.15)' }}
                >
                  <CloudUpload sx={{ color: 'hsl(var(--primary))' }} />
                </Box>
                <Typography variant="h6" className="font-semibold text-foreground">
                  File Upload
                </Typography>
              </Box>

              <FileUpload
                onFileSelect={handleFileSelect}
                evidenceType={evidenceType}
                selectedFile={selectedFile}
                error={null}
              />

              {selectedFile && (
                <Box className="mt-4">
                  <Chip
                    label={selectedFile.name}
                    size="small"
                    sx={{
                      backgroundColor: 'hsl(var(--primary) / 0.15)',
                      color: 'hsl(var(--primary))',
                    }}
                  />
                </Box>
              )}
            </CardContent>
          </Card>

          {/* Submit Button */}
          <Box className="lg:col-span-2">
            <Button
              fullWidth
              variant="contained"
              size="large"
              onClick={handleSubmit}
              disabled={isUploading || !selectedFile || !evidenceId.trim()}
              startIcon={isUploading ? <CircularProgress size={20} color="inherit" /> : <CloudUpload />}
              sx={{
                py: 2,
                borderRadius: '0.75rem',
                backgroundColor: 'hsl(var(--primary))',
                color: 'hsl(var(--primary-foreground))',
                fontWeight: 600,
                fontSize: '1rem',
                textTransform: 'none',
                '&:hover': {
                  backgroundColor: 'hsl(var(--primary))',
                  transform: 'translateY(-2px)',
                },
                '&:disabled': {
                  backgroundColor: 'hsl(var(--muted))',
                  color: 'hsl(var(--muted-foreground))',
                },
                transition: 'all 0.2s ease',
              }}
            >
              {isUploading ? 'Processing...' : 'Upload & Register on Blockchain'}
            </Button>
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default UploadEvidence;