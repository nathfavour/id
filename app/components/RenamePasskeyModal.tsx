'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
  CircularProgress,
  Stack,
  Alert,
} from '@mui/material';
import { renamePasskey } from '@/lib/passkey-client-utils';

interface Passkey {
  id: string;
  name: string;
  createdAt: number;
  lastUsedAt: number | null;
  status: 'active' | 'disabled' | 'compromised';
}

interface RenamePasskeyModalProps {
  isOpen: boolean;
  passkey: Passkey | null;
  email: string;
  onClose: () => void;
  onSuccess: () => Promise<void>;
}

export default function RenamePasskeyModal({
  isOpen,
  passkey,
  email,
  onClose,
  onSuccess,
}: RenamePasskeyModalProps) {
  const [newName, setNewName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!passkey) return null;

  const handleRename = async () => {
    if (!newName.trim()) {
      setError('Please enter a name');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await renamePasskey(email, passkey.id, newName.trim());
      await onSuccess();
      setNewName('');
      onClose();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setNewName('');
    setError(null);
    onClose();
  };

  return (
    <Dialog 
      open={isOpen} 
      onClose={handleClose} 
      maxWidth="sm" 
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: '1rem',
          boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
          backgroundColor: '#231f0f',
          color: 'white',
        }
      }}
    >
      <DialogTitle sx={{ fontWeight: 700, pb: 1, color: 'white' }}>Rename Passkey</DialogTitle>
      <DialogContent sx={{ pt: 2, backgroundColor: '#181711' }}>
        <Stack spacing={2}>
          <Typography sx={{ color: '#bbb49b' }}>Give your passkey a memorable name</Typography>

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

          <Box>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1, color: 'white' }}>
              Passkey Name
            </Typography>
            <TextField
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder={passkey.name}
              maxLength={50}
              disabled={loading}
              fullWidth
              variant="outlined"
              size="small"
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: '0.5rem',
                  backgroundColor: '#1f1e18',
                  color: 'white',
                  '& fieldset': {
                    borderColor: 'rgba(255, 255, 255, 0.2)',
                  },
                  '&:hover fieldset': {
                    borderColor: 'rgba(255, 255, 255, 0.3)',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#2563eb',
                  },
                },
                '& .MuiOutlinedInput-input': {
                  color: 'white',
                  '&::placeholder': {
                    color: '#7dd3fc',
                    opacity: 0.7,
                  },
                },
              }}
            />
            <Typography variant="caption" sx={{ color: '#bbb49b', mt: 0.5, display: 'block' }}>
              {newName.length}/50 characters
            </Typography>
          </Box>
        </Stack>
      </DialogContent>
      <DialogActions sx={{ p: 2, gap: 1, backgroundColor: '#231f0f' }}>
        <Button 
          onClick={handleClose} 
          disabled={loading}
          sx={{
            borderRadius: '0.5rem',
            textTransform: 'none',
            fontWeight: 600,
            color: '#bbb49b',
            '&:hover': {
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
            }
          }}
        >
          Cancel
        </Button>
        <Button
          onClick={handleRename}
          disabled={loading || !newName.trim()}
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
              Renaming...
            </>
          ) : (
            'Rename'
          )}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
