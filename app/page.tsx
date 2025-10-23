'use client';

import { useEffect, useState } from 'react';
import { account } from '@/lib/appwrite';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Box,
  Typography,
  Button,
  CircularProgress,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  AlertTitle,
} from '@mui/material';
import { Add, Logout, SwapHoriz } from '@mui/icons-material';

interface StoredAccount {
  userId: string;
  email: string;
  name: string;
  refreshToken: string;
}

interface CurrentUser {
  email: string;
  name: string;
  userId: string;
}

const ACCOUNTS_STORAGE_KEY = 'id_accounts';
const SOURCE_STORAGE_KEY = 'id_redirect_source';
const BROADCAST_CHANNEL = 'id_account_switch';

export default function Home() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [accounts, setAccounts] = useState<StoredAccount[]>([]);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    let mounted = true;

    async function init() {
      try {
        const userData = await account.get();
        if (mounted) {
          setUser({
            email: userData.email,
            name: userData.name || userData.email.split('@')[0],
            userId: userData.$id,
          });

          // Load stored accounts
          const storedAccounts = JSON.parse(localStorage.getItem(ACCOUNTS_STORAGE_KEY) || '{}');
          const accountList = Object.values(storedAccounts) as StoredAccount[];
          setAccounts(accountList);

          // Check for source parameter and store it
          const source = searchParams.get('source');
          if (source) {
            localStorage.setItem(SOURCE_STORAGE_KEY, source);
          }

          setLoading(false);
        }
      } catch {
        router.replace('/login');
      }
    }

    init();
    return () => { mounted = false; };
  }, [router, searchParams]);

  const handleAddAccount = () => {
    router.push('/login');
  };

  const handleSwitchAccount = async (accountToSwitch: StoredAccount) => {
    try {
      // Delete current session
      try {
        await account.deleteSession('current');
      } catch (e) {
        // Ignore
      }

      // Create new session with stored token
      await account.createSession(accountToSwitch.userId, accountToSwitch.refreshToken);

      // Broadcast to other tabs
      const bc = new BroadcastChannel(BROADCAST_CHANNEL);
      bc.postMessage({ activeUserId: accountToSwitch.userId });
      bc.close();

      // Reload to get new context
      window.location.reload();
    } catch (err) {
      console.error('Failed to switch account:', err);
    }
  };

  const handleRemoveAccount = async (accountId: string) => {
    const storedAccounts = JSON.parse(localStorage.getItem(ACCOUNTS_STORAGE_KEY) || '{}');
    delete storedAccounts[accountId];
    localStorage.setItem(ACCOUNTS_STORAGE_KEY, JSON.stringify(storedAccounts));

    // Remove from local state
    setAccounts(accounts.filter((acc) => acc.userId !== accountId));
    setDeleteConfirm(null);
  };

  const handleSignOut = async () => {
    try {
      await account.deleteSession('current');
    } catch (e) {
      // Ignore
    }
    localStorage.removeItem(SOURCE_STORAGE_KEY);
    router.replace('/login');
  };

  if (loading) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#181711',
        }}
      >
        <Box sx={{ textAlign: 'center' }}>
          <CircularProgress size={60} sx={{ color: '#f9c806' }} />
          <Typography sx={{ mt: 2, color: '#bbb49b' }}>Loading accounts...</Typography>
        </Box>
      </Box>
    );
  }

  if (!user) return null;

  const appName = process.env.NEXT_PUBLIC_APP_NAME || 'Auth System';

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: '#181711', color: 'white', p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 6 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography
            sx={{
              fontSize: '2.25rem',
              fontWeight: 900,
              lineHeight: 1.2,
              letterSpacing: '-0.033em',
            }}
          >
            {appName}
          </Typography>
          <Button
            onClick={handleSignOut}
            variant="outlined"
            startIcon={<Logout />}
            sx={{
              color: '#ef4444',
              borderColor: 'rgba(239, 68, 68, 0.3)',
              '&:hover': { backgroundColor: 'rgba(239, 68, 68, 0.1)' },
            }}
          >
            Sign Out
          </Button>
        </Box>
        <Typography sx={{ color: '#bbb49b', fontSize: '1rem' }}>
          Manage your accounts
        </Typography>
      </Box>

      {/* Current Account */}
      <Box sx={{ mb: 6 }}>
        <Typography sx={{ fontSize: '1.375rem', fontWeight: 700, mb: 3 }}>Active Account</Typography>
        <Box
          sx={{
            backgroundColor: '#1f1e18',
            border: '2px solid #f9c806',
            borderRadius: '0.75rem',
            p: 3,
          }}
        >
          <Stack spacing={2}>
            <Box>
              <Typography sx={{ fontSize: '0.875rem', color: '#bbb49b', mb: 0.5 }}>Name</Typography>
              <Typography sx={{ fontSize: '1.25rem', fontWeight: 600, color: 'white' }}>
                {user.name}
              </Typography>
            </Box>
            <Box>
              <Typography sx={{ fontSize: '0.875rem', color: '#bbb49b', mb: 0.5 }}>Email</Typography>
              <Typography sx={{ fontSize: '1rem', color: 'white', wordBreak: 'break-all' }}>
                {user.email}
              </Typography>
            </Box>
            <Button
              href="/settings"
              component="a"
              variant="contained"
              sx={{
                backgroundColor: '#f9c806',
                color: '#231f0f',
                fontWeight: 700,
                textTransform: 'none',
                alignSelf: 'flex-start',
                '&:hover': { backgroundColor: '#ffd633' },
              }}
            >
              Manage Settings
            </Button>
          </Stack>
        </Box>
      </Box>

      {/* Other Accounts */}
      {accounts.length > 0 && (
        <Box sx={{ mb: 6 }}>
          <Typography sx={{ fontSize: '1.375rem', fontWeight: 700, mb: 3 }}>Other Accounts</Typography>
          <Stack spacing={2}>
            {accounts.map((acc) => (
              <Box
                key={acc.userId}
                sx={{
                  backgroundColor: '#1f1e18',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '0.75rem',
                  p: 3,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <Box>
                  <Typography sx={{ fontSize: '1rem', fontWeight: 600, color: 'white' }}>
                    {acc.name}
                  </Typography>
                  <Typography sx={{ fontSize: '0.875rem', color: '#bbb49b' }}>{acc.email}</Typography>
                </Box>
                <Stack direction="row" spacing={1}>
                  <Button
                    onClick={() => handleSwitchAccount(acc)}
                    variant="contained"
                    startIcon={<SwapHoriz />}
                    sx={{
                      backgroundColor: '#3a3627',
                      color: 'white',
                      textTransform: 'none',
                      '&:hover': { backgroundColor: '#4a4637' },
                    }}
                  >
                    Switch
                  </Button>
                  <Button
                    onClick={() => setDeleteConfirm(acc.userId)}
                    variant="outlined"
                    sx={{
                      color: '#ef4444',
                      borderColor: 'rgba(239, 68, 68, 0.3)',
                      '&:hover': { backgroundColor: 'rgba(239, 68, 68, 0.1)' },
                    }}
                  >
                    Remove
                  </Button>
                </Stack>
              </Box>
            ))}
          </Stack>
        </Box>
      )}

      {/* Add Account Button */}
      <Box sx={{ mb: 6 }}>
        <Button
          onClick={handleAddAccount}
          variant="contained"
          startIcon={<Add />}
          size="large"
          sx={{
            backgroundColor: '#f9c806',
            color: '#231f0f',
            fontWeight: 700,
            fontSize: '1rem',
            textTransform: 'none',
            p: '12px 24px',
            '&:hover': { backgroundColor: '#ffd633' },
          }}
        >
          Add Another Account
        </Button>
      </Box>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)}>
        <DialogTitle>Remove Account</DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2 }}>
            <AlertTitle>Confirm Removal</AlertTitle>
            This will remove the account from your list. You can re-add it later by logging in again.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirm(null)}>Cancel</Button>
          <Button
            onClick={() => deleteConfirm && handleRemoveAccount(deleteConfirm)}
            variant="contained"
            color="error"
          >
            Remove
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
