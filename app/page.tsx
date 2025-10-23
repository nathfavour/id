'use client';

import { useEffect, useState } from 'react';
import { account } from '@/lib/appwrite';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAccountSync } from '@/lib/use-account-sync';
import Topbar from '@/app/components/Topbar';
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
  Avatar,
} from '@mui/material';
import { Add, SwapHoriz } from '@mui/icons-material';

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

  // Listen for account switches from other tabs
  useAccountSync();

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
        }
      } catch (err) {
        if (mounted) {
          setLoading(false);
          router.replace('/login');
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
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

  if (loading || !user) {
    return (
      <Box sx={{ minHeight: '100vh', backgroundColor: '#181711', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Box sx={{ textAlign: 'center' }}>
          <CircularProgress size={60} sx={{ color: '#f9c806' }} />
          <Typography sx={{ mt: 2, color: '#bbb49b' }}>Loading accounts...</Typography>
        </Box>
      </Box>
    );
  }

  const getInitials = () => {
    return user.name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase();
  };

  const avatarColor = (email: string) => {
    const colors = ['#f9c806', '#4f46e5', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6'];
    let hash = 0;
    for (let i = 0; i < email.length; i++) {
      hash = email.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  };

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: '#181711', color: 'white', display: 'flex', flexDirection: 'column' }}>
      <Topbar
        userName={user.name}
        userEmail={user.email}
        onAddAccount={handleAddAccount}
        onManageAccount={() => router.push('/settings')}
        onSignOut={handleSignOut}
      />

      {/* Main Content - Centered */}
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', p: 3 }}>
        <Box sx={{ textAlign: 'center', maxWidth: 400 }}>
          {/* Current Account */}
          <Stack spacing={3} sx={{ alignItems: 'center', mb: 6 }}>
            <Avatar
              sx={{
                width: 80,
                height: 80,
                backgroundColor: avatarColor(user.email),
                fontSize: '2rem',
                fontWeight: 600,
              }}
            >
              {getInitials()}
            </Avatar>
            <Box>
              <Typography sx={{ fontSize: '1.5rem', fontWeight: 600, color: 'white', mb: 0.5 }}>
                {user.name}
              </Typography>
              <Typography sx={{ fontSize: '0.875rem', color: '#bbb49b' }}>
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
                borderRadius: '0.5rem',
                px: 3,
                '&:hover': { backgroundColor: '#ffd633' },
              }}
            >
              Manage Settings
            </Button>
          </Stack>

          {/* Other Accounts */}
          {accounts.length > 0 && (
            <Box sx={{ borderTop: '1px solid rgba(255, 255, 255, 0.1)', pt: 4 }}>
              <Typography sx={{ fontSize: '0.75rem', fontWeight: 600, color: '#bbb49b', textTransform: 'uppercase', mb: 2 }}>
                Other Accounts
              </Typography>
              <Stack spacing={2}>
                {accounts.map((acc) => (
                  <Box
                    key={acc.userId}
                    sx={{
                      display: 'flex',
                      gap: 2,
                      alignItems: 'center',
                      p: 2,
                      borderRadius: '0.5rem',
                      backgroundColor: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      '&:hover': {
                        backgroundColor: 'rgba(249, 200, 6, 0.1)',
                        borderColor: '#f9c806',
                      },
                    }}
                    onClick={() => handleSwitchAccount(acc)}
                  >
                    <Avatar
                      sx={{
                        width: 40,
                        height: 40,
                        backgroundColor: avatarColor(acc.email),
                        fontSize: '0.875rem',
                        fontWeight: 600,
                        flexShrink: 0,
                      }}
                    >
                      {acc.name
                        .split(' ')
                        .map((n) => n[0])
                        .join('')
                        .toUpperCase()}
                    </Avatar>
                    <Box sx={{ flex: 1, textAlign: 'left', minWidth: 0 }}>
                      <Typography sx={{ fontSize: '0.875rem', fontWeight: 600, color: 'white', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {acc.name}
                      </Typography>
                      <Typography sx={{ fontSize: '0.75rem', color: '#bbb49b', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {acc.email}
                      </Typography>
                    </Box>
                    <Button
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteConfirm(acc.userId);
                      }}
                      sx={{
                        color: '#ef4444',
                        fontSize: '0.75rem',
                        fontWeight: 500,
                        textTransform: 'none',
                        '&:hover': { backgroundColor: 'rgba(239, 68, 68, 0.1)' },
                      }}
                    >
                      Remove
                    </Button>
                  </Box>
                ))}
              </Stack>
            </Box>
          )}

          {/* Add Account */}
          <Box sx={{ borderTop: '1px solid rgba(255, 255, 255, 0.1)', pt: 4, mt: 4 }}>
            <Button
              onClick={handleAddAccount}
              startIcon={<Add />}
              sx={{
                color: '#f9c806',
                fontSize: '0.875rem',
                fontWeight: 600,
                textTransform: 'none',
                '&:hover': { backgroundColor: 'rgba(249, 200, 6, 0.1)' },
              }}
            >
              Add Another Account
            </Button>
          </Box>
        </Box>
      </Box>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)}>
        <DialogTitle sx={{ backgroundColor: '#1f1e18', color: 'white' }}>Remove Account</DialogTitle>
        <DialogContent sx={{ backgroundColor: '#1f1e18', color: 'white' }}>
          <Alert severity="warning" sx={{ mb: 2, mt: 2 }}>
            <AlertTitle>Confirm Removal</AlertTitle>
            This will remove the account from your list. You can re-add it later by logging in again.
          </Alert>
        </DialogContent>
        <DialogActions sx={{ backgroundColor: '#1f1e18' }}>
          <Button onClick={() => setDeleteConfirm(null)} sx={{ color: '#bbb49b' }}>
            Cancel
          </Button>
          <Button
            onClick={() => deleteConfirm && handleRemoveAccount(deleteConfirm)}
            variant="contained"
            sx={{
              backgroundColor: '#ef4444',
              '&:hover': { backgroundColor: '#dc2626' },
            }}
          >
            Remove
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
