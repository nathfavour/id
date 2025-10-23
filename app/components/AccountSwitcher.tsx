'use client';

import { useEffect, useState } from 'react';
import { Box, Button, Stack, Typography, Avatar, CircularProgress, Alert } from '@mui/material';
import { ExitToApp, Delete } from '@mui/icons-material';
import { getAccountsList, switchAccount, hardLogout, StoredAccount } from '@/lib/multi-account';

interface AccountSwitcherProps {
  onAccountSwitch?: () => void;
  onAccountRemove?: () => void;
}

export function AccountSwitcher({ onAccountSwitch, onAccountRemove }: AccountSwitcherProps) {
  const [accounts, setAccounts] = useState<StoredAccount[]>([]);
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const stored = getAccountsList();
    setAccounts(stored);
  }, []);

  const handleSwitchAccount = async (userId: string) => {
    setLoading(userId);
    setError(null);
    try {
      await switchAccount(userId);
      onAccountSwitch?.();
    } catch (err) {
      setError((err as Error).message);
      setLoading(null);
    }
  };

  const handleRemoveAccount = async (e: React.MouseEvent, userId: string) => {
    e.stopPropagation();
    setLoading(userId);
    setError(null);
    try {
      await hardLogout(userId);
      const updated = getAccountsList();
      setAccounts(updated);
      onAccountRemove?.();
    } catch (err) {
      setError((err as Error).message);
      setLoading(null);
    }
  };

  if (accounts.length === 0) {
    return null;
  }

  return (
    <Box sx={{ mb: 5 }}>
      <Typography sx={{ fontSize: '0.875rem', color: '#bbb49b', mb: 2, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        Your Accounts
      </Typography>
      
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      
      <Stack spacing={2}>
        {accounts.map((acc) => (
          <Button
            key={acc.userId}
            onClick={() => handleSwitchAccount(acc.userId)}
            disabled={loading !== null}
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              p: 2,
              backgroundColor: '#27251b',
              border: '1px solid #55503a',
              borderRadius: '0.5rem',
              color: 'white',
              textTransform: 'none',
              textAlign: 'left',
              '&:hover:not(:disabled)': {
                borderColor: '#6b6551',
                backgroundColor: '#2d2b21',
              },
              '&:disabled': {
                opacity: 0.6,
                cursor: 'not-allowed',
              },
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1 }}>
              <Avatar
                sx={{
                  width: 32,
                  height: 32,
                  backgroundColor: '#f9c806',
                  color: '#231f0f',
                  fontSize: '0.9rem',
                  fontWeight: 600,
                }}
              >
                {acc.email[0].toUpperCase()}
              </Avatar>
              <Box sx={{ flex: 1, overflow: 'hidden' }}>
                <Typography sx={{ fontSize: '0.9rem', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {acc.email}
                </Typography>
                {acc.name && (
                  <Typography sx={{ fontSize: '0.75rem', color: '#8b8671', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {acc.name}
                  </Typography>
                )}
              </Box>
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {loading === acc.userId ? (
                <CircularProgress size={20} sx={{ color: '#f9c806' }} />
              ) : (
                <>
                  <ExitToApp sx={{ fontSize: '1rem', color: '#bbb49b' }} />
                  <Button
                    onClick={(e) => handleRemoveAccount(e, acc.userId)}
                    disabled={loading !== null}
                    sx={{
                      minWidth: 'auto',
                      p: 0.5,
                      color: '#8b6f47',
                      '&:hover': { color: '#c91d1d' },
                    }}
                  >
                    <Delete sx={{ fontSize: '1rem' }} />
                  </Button>
                </>
              )}
            </Box>
          </Button>
        ))}
      </Stack>

      <Box sx={{ display: 'flex', alignItems: 'center', my: 4, gap: 2 }}>
        <Box sx={{ flex: 1, height: '1px', backgroundColor: '#3a3627' }} />
        <Typography sx={{ fontSize: '0.875rem', color: '#bbb49b', whiteSpace: 'nowrap' }}>or add new account</Typography>
        <Box sx={{ flex: 1, height: '1px', backgroundColor: '#3a3627' }} />
      </Box>
    </Box>
  );
}
