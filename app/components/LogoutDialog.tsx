'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  CircularProgress,
} from '@mui/material';
import { account } from '@/lib/appwrite';

interface LogoutDialogProps {
  open: boolean;
  onClose: () => void;
  onLogoutComplete: () => void;
}

export function LogoutDialog({ open, onClose, onLogoutComplete }: LogoutDialogProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogout = async () => {
    setLoading(true);
    setError(null);
    try {
      await account.deleteSession('current');
      onLogoutComplete();
    } catch (err) {
      setError((err as Error).message);
      setLoading(false);
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="sm" 
      fullWidth
      PaperProps={{
        sx: {
          backgroundColor: '#231f0f',
          borderRadius: '1rem',
          boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.3), 0 8px 10px -6px rgb(0 0 0 / 0.3)',
        }
      }}
    >
      <DialogTitle sx={{ backgroundColor: '#231f0f', color: 'white', pb: 1 }}>Logout</DialogTitle>
      <DialogContent sx={{ backgroundColor: '#181711', color: 'white', pt: 3 }}>
        {error && (
          <Box sx={{ 
            mb: 2, 
            p: 1.5, 
            backgroundColor: '#3a2420', 
            border: '1px solid #8b4f3f', 
            borderRadius: '0.5rem',
            boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.3)',
          }}>
            <Typography sx={{ fontSize: '0.875rem', color: '#ff8a65' }}>{error}</Typography>
          </Box>
        )}

        <Typography sx={{ fontSize: '0.95rem', color: '#bbb49b' }}>
          Are you sure you want to logout? You will need to log in again to access your account.
        </Typography>
      </DialogContent>
      <DialogActions sx={{ backgroundColor: '#231f0f', p: 2, gap: 1 }}>
        <Button 
          onClick={onClose} 
          disabled={loading} 
          sx={{ 
            color: '#bbb49b',
            borderRadius: '0.5rem',
            textTransform: 'none',
            fontWeight: 600,
          }}
        >
          Cancel
        </Button>
        <Button
          onClick={handleLogout}
          disabled={loading}
          variant="contained"
          sx={{
            backgroundColor: '#c91d1d',
            color: 'white',
            borderRadius: '0.5rem',
            textTransform: 'none',
            fontWeight: 600,
            boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.3), 0 1px 2px -1px rgb(0 0 0 / 0.3)',
            '&:hover:not(:disabled)': { 
              backgroundColor: '#a01515',
              boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.3), 0 2px 4px -2px rgb(0 0 0 / 0.3)',
            },
            '&:disabled': { opacity: 0.6 },
          }}
        >
          {loading ? <CircularProgress size={20} sx={{ color: 'white' }} /> : 'Logout'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
