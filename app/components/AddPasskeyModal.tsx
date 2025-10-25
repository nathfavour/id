'use client';
import { useColors } from '@/lib/theme-context';
  const dynamicColors = useColors();

import { colors } from '@/lib/colors';
import { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  CircularProgress,
  Stack,
  Alert,
} from '@mui/material';
import { addPasskeyToAccount } from '@/lib/passkey-client-utils';

interface AddPasskeyModalProps {
  isOpen: boolean;
  email: string;
  onClose: () => void;
  onSuccess: () => Promise<void>;
}

export default function AddPasskeyModal({
  isOpen,
  email,
  onClose,
  onSuccess,
}: AddPasskeyModalProps) {
  const dynamicColors = useColors();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleAddPasskey = async () => {
    setLoading(true);
    setError(null);
    try {
      await addPasskeyToAccount(email);
      setSuccess(true);
      setTimeout(() => {
        onSuccess();
        setSuccess(false);
        onClose();
      }, 1500);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog 
      open={isOpen} 
      onClose={onClose} 
      maxWidth="sm" 
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: '1rem',
          boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
          backgroundColor: dynamicColors.secondary,
          color: 'white',
        }
      }}
    >
      <DialogTitle sx={{ fontWeight: 700, pb: 1, color: 'white' }}>Add Passkey</DialogTitle>
      <DialogContent sx={{ pt: 2, backgroundColor: dynamicColors.background }}>
        {success ? (
          <Stack sx={{ textAlign: 'center', py: 3 }} spacing={2}>
            <Box sx={{ fontSize: 32 }}>✓</Box>
            <Typography variant="h6" sx={{ fontWeight: 600, color: 'white' }}>
              Success!
            </Typography>
            <Typography sx={{ color: dynamicColors.foreground }}>Passkey added successfully</Typography>
          </Stack>
        ) : (
          <Stack spacing={2}>
            {error && (
              <Alert 
                severity="error"
                sx={{
                  borderRadius: '0.75rem',
                  boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1)',
                  backgroundColor: '#3a2420',
                  color: '#ff8a65',
                  '& .MuiAlertTitle-root': {
                    color: '#ff8a65',
                  },
                  border: '1px solid #8b4f3f',
                }}
              >
                {error}
              </Alert>
            )}

            <Typography sx={{ color: dynamicColors.foreground }}>
              Register a new passkey to your account for easier authentication.
            </Typography>

            <Alert 
              severity="info"
              sx={{
                borderRadius: '0.75rem',
                boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1)',
                backgroundColor: '#1e293b',
                color: '#7dd3fc',
                '& .MuiAlertTitle-root': {
                  color: '#7dd3fc',
                },
                border: '1px solid #0369a1',
              }}
            >
              <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
                What happens next?
              </Typography>
              <Typography variant="body2">
                You&apos;ll be prompted to use your device&apos;s authentication method (Face ID, fingerprint,
                or security key) to create a new passkey.
              </Typography>
            </Alert>
          </Stack>
        )}
      </DialogContent>
      <DialogActions sx={{ p: 2, gap: 1, backgroundColor: dynamicColors.secondary }}>
        {!success && (
          <>
            <Button 
              onClick={onClose} 
              disabled={loading}
              sx={{
                borderRadius: '0.5rem',
                textTransform: 'none',
                fontWeight: 600,
                color: dynamicColors.foreground,
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                }
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAddPasskey}
              disabled={loading}
              variant="contained"
              sx={{
                borderRadius: '0.5rem',
                textTransform: 'none',
                fontWeight: 600,
                boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
                background: 'linear-gradient(135deg, #2563eb 0%, #4f46e5 100%)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #1d4ed8 0%, #4338ca 100%)',
                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
                },
              }}
            >
              {loading ? (
                <>
                  <CircularProgress size={20} sx={{ mr: 1, color: 'white' }} />
                  Adding...
                </>
              ) : (
                'Add Passkey'
              )}
            </Button>
          </>
        )}
      </DialogActions>
    </Dialog>
  );
}
