'use client';

import { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Stack,
  Button,
  Avatar,
  CircularProgress,
  Alert,
  IconButton,
} from '@mui/material';
import { Delete, SwapHoriz } from '@mui/icons-material';
import { getAccountsList, switchAccount, hardLogout, StoredAccount } from '@/lib/multi-account';

interface AccountsManagerProps {
  currentUserId: string;
  onAccountSwitch?: () => void;
}

export function AccountsManager({ currentUserId, onAccountSwitch }: AccountsManagerProps) {
  const [accounts, setAccounts] = useState<StoredAccount[]>([]);
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const allAccounts = getAccountsList();
    setAccounts(allAccounts);
    setIsInitialized(true);
  }, []);

  if (!isInitialized) {
    return null;
  }

  const otherAccounts = accounts.filter((acc) => acc.userId !== currentUserId);

  if (otherAccounts.length === 0) {
    return null;
  }

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

  const handleRemoveAccount = async (userId: string) => {
    setLoading(userId);
    setError(null);
    try {
      await hardLogout(userId);
      const updated = getAccountsList();
      setAccounts(updated);
    } catch (err) {
      setError((err as Error).message);
      setLoading(null);
    }
  };

  return (
    <Box>
      <Typography sx={{ fontSize: '1.1rem', fontWeight: 600, mb: 2 }}>Other Accounts</Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Stack spacing={2}>
        {otherAccounts.map((acc) => (
          <Box
            key={acc.userId}
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              p: 2,
              backgroundColor: '#27251b',
              border: '1px solid #55503a',
              borderRadius: '0.5rem',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1, minWidth: 0 }}>
              <Avatar
                sx={{
                  width: 40,
                  height: 40,
                  backgroundColor: '#f9c806',
                  color: '#231f0f',
                  fontSize: '1rem',
                  fontWeight: 600,
                  flexShrink: 0,
                }}
              >
                {acc.email[0].toUpperCase()}
              </Avatar>
              <Box sx={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
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
                <CircularProgress size={24} sx={{ color: '#f9c806' }} />
              ) : (
                <>
                  <Button
                    onClick={() => handleSwitchAccount(acc.userId)}
                    disabled={loading !== null}
                    size="small"
                    sx={{
                      textTransform: 'none',
                      color: '#f9c806',
                      border: '1px solid #f9c806',
                      padding: '0.4rem 0.8rem',
                      fontSize: '0.75rem',
                      '&:hover': { backgroundColor: 'rgba(249, 200, 6, 0.1)' },
                    }}
                  >
                    <SwapHoriz sx={{ fontSize: '0.9rem', mr: 0.5 }} />
                    Switch
                  </Button>
                  <IconButton
                    onClick={() => handleRemoveAccount(acc.userId)}
                    disabled={loading !== null}
                    size="small"
                    sx={{
                      color: '#8b6f47',
                      '&:hover': { color: '#c91d1d' },
                    }}
                  >
                    <Delete sx={{ fontSize: '1rem' }} />
                  </IconButton>
                </>
              )}
            </Box>
          </Box>
        ))}
      </Stack>
    </Box>
  );
}
