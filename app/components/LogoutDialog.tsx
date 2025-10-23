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
  Radio,
  FormControlLabel,
  FormControl,
  CircularProgress,
} from '@mui/material';
import { softLogout, hardLogout } from '@/lib/multi-account';
import { account } from '@/lib/appwrite';

interface LogoutDialogProps {
  open: boolean;
  onClose: () => void;
  onLogoutComplete: () => void;
}

export function LogoutDialog({ open, onClose, onLogoutComplete }: LogoutDialogProps) {
  const [logoutType, setLogoutType] = useState<'soft' | 'hard'>('soft');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogout = async () => {
    setLoading(true);
    setError(null);
    try {
      if (logoutType === 'soft') {
        await softLogout();
      } else {
        await hardLogout();
      }
      // If there are other accounts, go to login. Otherwise also clear everything.
      onLogoutComplete();
    } catch (err) {
      setError((err as Error).message);
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ backgroundColor: '#231f0f', color: 'white' }}>Logout</DialogTitle>
      <DialogContent sx={{ backgroundColor: '#181711', color: 'white', pt: 3 }}>
        {error && (
          <Box sx={{ mb: 2, p: 1.5, backgroundColor: '#3a2420', border: '1px solid #8b4f3f', borderRadius: '0.5rem' }}>
            <Typography sx={{ fontSize: '0.875rem', color: '#ff8a65' }}>{error}</Typography>
          </Box>
        )}

        <FormControl component="fieldset" fullWidth>
          <FormControlLabel
            control={
              <Radio
                checked={logoutType === 'soft'}
                onChange={() => setLogoutType('soft')}
                disabled={loading}
                sx={{ color: '#f9c806' }}
              />
            }
            label={
              <Box>
                <Typography sx={{ fontWeight: 600, mb: 0.5 }}>Soft Logout</Typography>
                <Typography sx={{ fontSize: '0.85rem', color: '#bbb49b' }}>
                  Sign out from this session, but keep this account saved for quick login later
                </Typography>
              </Box>
            }
            sx={{ mb: 2, alignItems: 'flex-start', mt: 1 }}
          />

          <FormControlLabel
            control={
              <Radio
                checked={logoutType === 'hard'}
                onChange={() => setLogoutType('hard')}
                disabled={loading}
                sx={{ color: '#f9c806' }}
              />
            }
            label={
              <Box>
                <Typography sx={{ fontWeight: 600, mb: 0.5 }}>Hard Logout</Typography>
                <Typography sx={{ fontSize: '0.85rem', color: '#bbb49b' }}>
                  Completely remove this account from this device. You'll need to log in again.
                </Typography>
              </Box>
            }
            sx={{ alignItems: 'flex-start', mt: 1 }}
          />
        </FormControl>
      </DialogContent>
      <DialogActions sx={{ backgroundColor: '#231f0f', p: 2 }}>
        <Button onClick={onClose} disabled={loading} sx={{ color: '#bbb49b' }}>
          Cancel
        </Button>
        <Button
          onClick={handleLogout}
          disabled={loading}
          variant="contained"
          sx={{
            backgroundColor: '#c91d1d',
            color: 'white',
            '&:hover:not(:disabled)': { backgroundColor: '#a01515' },
            '&:disabled': { opacity: 0.6 },
          }}
        >
          {loading ? <CircularProgress size={20} sx={{ color: 'white' }} /> : 'Logout'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
