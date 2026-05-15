import { Box, Card, CardContent, Typography, Button, Chip } from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import ErrorIcon from "@mui/icons-material/Error";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";

interface Props {
  status: 'verified' | 'tampered' | 'error';
  storedHash?: string;
  computedHash?: string;
  message?: string;
}

export default function VerificationBadge({ status, storedHash, computedHash, message }: Props) {
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  if (status === 'verified') {
    return (
      <Card
        sx={{
          backgroundColor: 'rgba(46, 125, 50, 0.05)',
          border: '2px solid #4caf50',
          borderRadius: '1rem',
          height: '100%',
        }}
      >
        <CardContent className="p-8">
          <Box className="text-center">
            <Box
              className="w-24 h-24 rounded-full mx-auto mb-4 flex items-center justify-center"
              sx={{
                backgroundColor: '#4caf50',
                animation: 'pulse 2s ease-in-out infinite',
              }}
            >
              <CheckCircleIcon sx={{ fontSize: 60, color: 'white' }} />
            </Box>
            
            <Typography variant="h4" className="font-bold mb-2" sx={{ color: '#2e7d32' }}>
              ✓ Evidence Verified
            </Typography>
            
            <Typography variant="body1" className="mb-6" sx={{ color: '#555' }}>
              The file hash matches the stored record. Evidence integrity is confirmed!
            </Typography>

            <Chip
              label="AUTHENTIC"
              sx={{
                backgroundColor: '#4caf50',
                color: 'white',
                fontWeight: 'bold',
                fontSize: '1rem',
                padding: '20px 10px',
              }}
            />

            {computedHash && storedHash && (
              <Box className="mt-6 text-left">
                <Box
                  className="p-4 rounded-lg mb-3"
                  sx={{ backgroundColor: 'rgba(76, 175, 80, 0.1)', border: '1px solid #4caf50' }}
                >
                  <Typography variant="caption" sx={{ color: '#555', fontWeight: 'bold' }}>
                    COMPUTED HASH
                  </Typography>
                  <Box className="flex items-center justify-between mt-1">
                    <Typography
                      variant="body2"
                      className="font-mono"
                      sx={{ fontSize: '0.75rem', wordBreak: 'break-all', color: '#333' }}
                    >
                      {computedHash}
                    </Typography>
                    <Button
                      size="small"
                      onClick={() => copyToClipboard(computedHash)}
                      sx={{ minWidth: 'auto', ml: 1 }}
                    >
                      <ContentCopyIcon fontSize="small" />
                    </Button>
                  </Box>
                </Box>

                <Box
                  className="p-4 rounded-lg"
                  sx={{ backgroundColor: 'rgba(76, 175, 80, 0.1)', border: '1px solid #4caf50' }}
                >
                  <Typography variant="caption" sx={{ color: '#555', fontWeight: 'bold' }}>
                    STORED HASH
                  </Typography>
                  <Box className="flex items-center justify-between mt-1">
                    <Typography
                      variant="body2"
                      className="font-mono"
                      sx={{ fontSize: '0.75rem', wordBreak: 'break-all', color: '#333' }}
                    >
                      {storedHash}
                    </Typography>
                    <Button
                      size="small"
                      onClick={() => copyToClipboard(storedHash)}
                      sx={{ minWidth: 'auto', ml: 1 }}
                    >
                      <ContentCopyIcon fontSize="small" />
                    </Button>
                  </Box>
                </Box>
              </Box>
            )}
          </Box>
        </CardContent>
      </Card>
    );
  }

  if (status === 'tampered') {
    return (
      <Card
        sx={{
          backgroundColor: 'rgba(211, 47, 47, 0.05)',
          border: '2px solid #f44336',
          borderRadius: '1rem',
          height: '100%',
        }}
      >
        <CardContent className="p-8">
          <Box className="text-center">
            <Box
              className="w-24 h-24 rounded-full mx-auto mb-4 flex items-center justify-center"
              sx={{
                backgroundColor: '#f44336',
                animation: 'shake 0.5s ease-in-out',
              }}
            >
              <CancelIcon sx={{ fontSize: 60, color: 'white' }} />
            </Box>
            
            <Typography variant="h4" className="font-bold mb-2" sx={{ color: '#d32f2f' }}>
              ✗ Verification Failed
            </Typography>
            
            <Typography variant="body1" className="mb-6" sx={{ color: '#555' }}>
              The file hash does NOT match the stored record. Evidence may have been tampered with!
            </Typography>

            <Chip
              label="TAMPERED"
              sx={{
                backgroundColor: '#f44336',
                color: 'white',
                fontWeight: 'bold',
                fontSize: '1rem',
                padding: '20px 10px',
              }}
            />

            {computedHash && storedHash && (
              <Box className="mt-6 text-left">
                <Box
                  className="p-4 rounded-lg mb-3"
                  sx={{ backgroundColor: 'rgba(244, 67, 54, 0.1)', border: '1px solid #f44336' }}
                >
                  <Typography variant="caption" sx={{ color: '#555', fontWeight: 'bold' }}>
                    COMPUTED HASH (Your File)
                  </Typography>
                  <Box className="flex items-center justify-between mt-1">
                    <Typography
                      variant="body2"
                      className="font-mono"
                      sx={{ fontSize: '0.75rem', wordBreak: 'break-all', color: '#333' }}
                    >
                      {computedHash}
                    </Typography>
                    <Button
                      size="small"
                      onClick={() => copyToClipboard(computedHash)}
                      sx={{ minWidth: 'auto', ml: 1 }}
                    >
                      <ContentCopyIcon fontSize="small" />
                    </Button>
                  </Box>
                </Box>

                <Box
                  className="p-4 rounded-lg"
                  sx={{ backgroundColor: 'rgba(244, 67, 54, 0.1)', border: '1px solid #f44336' }}
                >
                  <Typography variant="caption" sx={{ color: '#555', fontWeight: 'bold' }}>
                    STORED HASH (Original)
                  </Typography>
                  <Box className="flex items-center justify-between mt-1">
                    <Typography
                      variant="body2"
                      className="font-mono"
                      sx={{ fontSize: '0.75rem', wordBreak: 'break-all', color: '#333' }}
                    >
                      {storedHash}
                    </Typography>
                    <Button
                      size="small"
                      onClick={() => copyToClipboard(storedHash)}
                      sx={{ minWidth: 'auto', ml: 1 }}
                    >
                      <ContentCopyIcon fontSize="small" />
                    </Button>
                  </Box>
                </Box>

                <Box className="mt-4 p-3 rounded" sx={{ backgroundColor: '#fff3e0', border: '1px solid #ff9800' }}>
                  <Typography variant="caption" sx={{ color: '#e65100', fontWeight: 'bold' }}>
                    ⚠️ WARNING: Hashes do not match! This file is different from the original.
                  </Typography>
                </Box>
              </Box>
            )}
          </Box>
        </CardContent>
      </Card>
    );
  }

  // Error state
  return (
    <Card
      sx={{
        backgroundColor: 'rgba(158, 158, 158, 0.1)',
        border: '2px solid #9e9e9e',
        borderRadius: '1rem',
        height: '100%',
      }}
    >
      <CardContent className="p-8 text-center">
        <Box
          className="w-24 h-24 rounded-full mx-auto mb-4 flex items-center justify-center"
          sx={{ backgroundColor: '#9e9e9e' }}
        >
          <ErrorIcon sx={{ fontSize: 60, color: 'white' }} />
        </Box>
        
        <Typography variant="h5" className="font-bold mb-2" sx={{ color: '#616161' }}>
          Verification Error
        </Typography>
        
        <Typography variant="body2" sx={{ color: '#757575' }}>
          {message || 'An error occurred during verification. Please try again.'}
        </Typography>
      </CardContent>
    </Card>
  );
}
