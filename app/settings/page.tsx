'use client';

import { useEffect, useState } from 'react';
import { account } from '@/lib/appwrite';
import { useRouter } from 'next/navigation';
import Topbar from '@/app/components/Topbar';
import { LogoutDialog } from '@/app/components/LogoutDialog';
import PasskeyList from '@/app/components/PasskeyList';
import AddPasskeyModal from '@/app/components/AddPasskeyModal';
import RenamePasskeyModal from '@/app/components/RenamePasskeyModal';
import WalletManager from '@/app/components/WalletManager';
import PreferencesManager from '@/app/components/PreferencesManager';
import SessionsManager from '@/app/components/SessionsManager';
import ActivityLogs from '@/app/components/ActivityLogs';
import ConnectedIdentities from '@/app/components/ConnectedIdentities';
import { listPasskeys } from '@/lib/passkey-client-utils';
import {
  Container,
  Box,
  Typography,
  Button,
  CircularProgress,
  Stack,
  Grid,
  Alert,
  AlertTitle,
  Switch,
  Divider,
  IconButton,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { Person, Lock, Settings as SettingsIcon, AccountBalanceWallet, Fingerprint, History, Link } from '@mui/icons-material';

interface UserData {
  email: string;
  name: string;
  userId: string;
}

interface Passkey {
  id: string;
  name: string;
  createdAt: number;
  lastUsedAt: number | null;
  status: 'active' | 'disabled' | 'compromised';
}

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [loadingPasskeys, setLoadingPasskeys] = useState(false);
  const [user, setUser] = useState<UserData | null>(null);
  const [passkeys, setPasskeys] = useState<Passkey[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [renameModalOpen, setRenameModalOpen] = useState(false);
  const [selectedPasskey, setSelectedPasskey] = useState<Passkey | null>(null);
  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'sessions' | 'activity' | 'identities' | 'preferences' | 'account'>('profile');
  const [mfaEnabled, setMfaEnabled] = useState(true);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);
  const router = useRouter();
  const appName = process.env.NEXT_PUBLIC_APP_NAME || 'Auth System';

  const loadPasskeys = async (email: string) => {
    setLoadingPasskeys(true);
    setError(null);
    try {
      const data = await listPasskeys(email);
      setPasskeys(data);
    } catch (err) {
      setError((err as Error).message);
      setPasskeys([]);
    } finally {
      setLoadingPasskeys(false);
    }
  };

  useEffect(() => {
    let mounted = true;
    async function initializeSettings() {
      try {
        const userData = await account.get();
        if (mounted) {
          setUser({
            email: userData.email,
            name: userData.name || userData.email.split('@')[0],
            userId: userData.$id,
          });
          
          // Load wallet address from prefs
          setWalletAddress(userData.prefs?.walletEth || null);
          
          await loadPasskeys(userData.email);
          setLoading(false);
        }
      } catch (err) {
        if (mounted) {
          setLoading(false);
          router.replace('/login');
        }
      }
    }
    initializeSettings();
    return () => { mounted = false; };
  }, [router]);

  const handleAddPasskeySuccess = async () => {
    if (user) {
      await loadPasskeys(user.email);
    }
  };

  const handleRenameClick = (passkey: Passkey) => {
    setSelectedPasskey(passkey);
    setRenameModalOpen(true);
  };

  const handleRenameSuccess = async () => {
    if (user) {
      await loadPasskeys(user.email);
    }
  };

  const handleSignOut = async () => {
    setLogoutDialogOpen(true);
  };

  const handleLogoutComplete = () => {
    localStorage.removeItem('id_redirect_source');
    router.replace('/login');
  };

  if (loading || !user) {
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
          <Typography sx={{ mt: 2, color: '#bbb49b' }}>Loading settings...</Typography>
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: '#181711', color: 'white', display: 'flex', flexDirection: 'column' }}>
      <Topbar
        userName={user.name}
        userEmail={user.email}
        onAddAccount={() => router.push('/login')}
        onManageAccount={() => {}}
        onSignOut={handleSignOut}
      />
      {/* Main Container */}
      <Box sx={{ display: 'flex', flex: 1 }}>
        {/* Sidebar */}
        <Box
          sx={{
            width: { xs: '0', md: '25%' },
            display: { xs: 'none', md: 'flex' },
            flexDirection: 'column',
            borderRight: '1px solid rgba(255, 255, 255, 0.1)',
            p: 3,
            backgroundColor: '#181711',
            maxHeight: '100vh',
            overflowY: 'auto',
          }}
        >
          {/* User Profile Card */}
          <Box
            sx={{
              p: 2,
              borderRadius: '0.75rem',
              backgroundColor: '#231f0f',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              mb: 4,
            }}
          >
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
              <Box
                sx={{
                  width: 40,
                  height: 40,
                  borderRadius: '50%',
                  backgroundColor: '#3a3627',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#f9c806',
                  fontSize: '20px',
                  flexShrink: 0,
                }}
              >
                👤
              </Box>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography sx={{ fontSize: '1rem', fontWeight: 500, color: 'white' }}>
                  {user.name}
                </Typography>
                <Typography
                  sx={{
                    fontSize: '0.875rem',
                    color: '#bbb49b',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {user.email}
                </Typography>
              </Box>
            </Box>

            {/* Navigation Items */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mt: 3 }}>
              {[
                { id: 'profile', label: 'Profile', icon: Person },
                { id: 'security', label: 'Security', icon: Lock },
                { id: 'sessions', label: 'Sessions', icon: Fingerprint },
                { id: 'activity', label: 'Activity', icon: History },
                { id: 'identities', label: 'Identities', icon: Link },
                { id: 'preferences', label: 'Preferences', icon: SettingsIcon },
                { id: 'account', label: 'Account', icon: AccountBalanceWallet },
              ].map(({ id, label, icon: Icon }) => (
                <Box
                  key={id}
                  onClick={() => setActiveTab(id as any)}
                  sx={{
                    display: 'flex',
                    gap: 2,
                    alignItems: 'center',
                    p: '0.5rem 0.75rem',
                    borderRadius: '0.5rem',
                    cursor: 'pointer',
                    backgroundColor: activeTab === id ? 'rgba(249, 200, 6, 0.2)' : 'transparent',
                    '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.05)' },
                    transition: 'background-color 0.2s',
                  }}
                >
                  <Icon sx={{ color: activeTab === id ? '#f9c806' : 'white', fontSize: 20 }} />
                  <Typography
                    sx={{
                      fontSize: '0.875rem',
                      fontWeight: 500,
                      color: activeTab === id ? '#f9c806' : 'white',
                    }}
                  >
                    {label}
                  </Typography>
                </Box>
              ))}
            </Box>
          </Box>
        </Box>

        {/* Main Content */}
        <Box sx={{ flex: 1, p: { xs: 2, md: 4 }, backgroundColor: '#181711' }}>
          {/* Header */}
          <Box sx={{ mb: 6 }}>
            <Typography
              sx={{
                fontSize: '2.25rem',
                fontWeight: 900,
                color: 'white',
                lineHeight: 1.2,
                letterSpacing: '-0.033em',
              }}
            >
              Account Settings
            </Typography>
          </Box>

          {/* Profile Section */}
          {activeTab === 'profile' && (
            <Box>
              <Typography sx={{ fontSize: '1.375rem', fontWeight: 700, mb: 3 }}>Username</Typography>
              <Box
                sx={{
                  backgroundColor: '#1f1e18',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '0.75rem',
                  overflow: 'hidden',
                }}
              >
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    p: '1rem',
                    minHeight: '3.5rem',
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1 }}>
                    <Typography sx={{ fontSize: '1rem', color: 'white', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {user.name || user.email.split('@')[0]}
                    </Typography>
                  </Box>
                  <Button
                    sx={{
                      color: '#f9c806',
                      fontSize: '1rem',
                      fontWeight: 500,
                      textTransform: 'none',
                      '&:hover': { backgroundColor: 'transparent', textDecoration: 'underline' },
                    }}
                  >
                    Edit
                  </Button>
                </Box>
              </Box>

              <Typography sx={{ fontSize: '1.375rem', fontWeight: 700, mb: 3, mt: 6 }}>Email</Typography>
              <Box
                sx={{
                  backgroundColor: '#1f1e18',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '0.75rem',
                  overflow: 'hidden',
                  p: 2,
                }}
              >
                <Typography sx={{ fontSize: '1rem', color: 'white' }}>
                  {user.email}
                </Typography>
              </Box>

              <Typography sx={{ fontSize: '1.375rem', fontWeight: 700, mb: 3, mt: 6 }}>User ID</Typography>
              <Box
                sx={{
                  backgroundColor: '#1f1e18',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '0.75rem',
                  overflow: 'hidden',
                  p: 2,
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2 }}>
                  <Typography
                    sx={{
                      fontSize: '0.875rem',
                      color: '#bbb49b',
                      fontFamily: 'monospace',
                      flex: 1,
                      wordBreak: 'break-all',
                    }}
                  >
                    {user.userId}
                  </Typography>
                  <Button
                    onClick={() => {
                      navigator.clipboard.writeText(user.userId);
                    }}
                    variant="contained"
                    sx={{
                      backgroundColor: '#f9c806',
                      color: '#231f0f',
                      fontWeight: 700,
                      fontSize: '0.875rem',
                      textTransform: 'none',
                      borderRadius: '0.5rem',
                      whiteSpace: 'nowrap',
                      '&:hover': { backgroundColor: '#ffd633' },
                    }}
                  >
                    Copy
                  </Button>
                </Box>
              </Box>
            </Box>
          )}

          {/* Security Section */}
          {activeTab === 'security' && (
            <Box sx={{ space: 4 }}>
              {/* Passkeys */}
              <Box sx={{ mb: 6 }}>
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    mb: 3,
                  }}
                >
                  <Typography sx={{ fontSize: '1.375rem', fontWeight: 700 }}>Passkeys</Typography>
                  <Button
                    onClick={() => setAddModalOpen(true)}
                    variant="contained"
                    startIcon={<AddIcon />}
                    sx={{
                      backgroundColor: '#f9c806',
                      color: '#231f0f',
                      fontWeight: 700,
                      fontSize: '0.875rem',
                      textTransform: 'none',
                      borderRadius: '0.5rem',
                      '&:hover': { backgroundColor: '#ffd633' },
                    }}
                  >
                    Add Passkey
                  </Button>
                </Box>

                {loadingPasskeys && (
                  <Box sx={{ textAlign: 'center', py: 3 }}>
                    <CircularProgress size={40} sx={{ color: '#f9c806' }} />
                    <Typography sx={{ mt: 2, color: '#bbb49b' }}>Loading passkeys...</Typography>
                  </Box>
                )}

                {!loadingPasskeys && passkeys.length === 0 && !error && (
                  <Box
                    sx={{
                      backgroundColor: '#1f1e18',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '0.75rem',
                      p: 3,
                      textAlign: 'center',
                    }}
                  >
                    <Typography sx={{ color: '#bbb49b' }}>No passkeys yet. Add one to get started.</Typography>
                  </Box>
                )}

                {passkeys.length > 0 && (
                  <Box sx={{ mt: 2 }}>
                    <PasskeyList
                      passkeys={passkeys}
                      email={user.email}
                      onUpdate={() => loadPasskeys(user.email)}
                      onRenameClick={handleRenameClick}
                    />
                  </Box>
                )}

                {error && (
                  <Alert severity="error" sx={{ mt: 2 }}>
                    <AlertTitle>Error</AlertTitle>
                    {error}
                  </Alert>
                )}
              </Box>

              {/* Wallets */}
              <Box sx={{ mb: 6 }}>
                <Typography sx={{ fontSize: '1.375rem', fontWeight: 700, mb: 3 }}>
                  Connected Wallet
                </Typography>
                <Box
                  sx={{
                    backgroundColor: '#1f1e18',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '0.75rem',
                    p: 3,
                  }}
                >
                  {user && (
                    <WalletManager
                      userId={user.userId}
                      connectedWallet={walletAddress || undefined}
                      onWalletConnected={(address) => {
                        setWalletAddress(address);
                      }}
                      onWalletDisconnected={() => {
                        setWalletAddress(null);
                      }}
                    />
                  )}
                </Box>
              </Box>

              {/* MFA */}
              <Box>
                <Typography sx={{ fontSize: '1.375rem', fontWeight: 700, mb: 3 }}>Multi-Factor Authentication (MFA)</Typography>
                <Box
                  sx={{
                    backgroundColor: '#1f1e18',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '0.75rem',
                    p: 2,
                  }}
                >
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <Box>
                      <Typography sx={{ fontSize: '1rem', fontWeight: 500, color: 'white' }}>
                        Multi-Factor Authentication (MFA)
                      </Typography>
                      <Typography sx={{ fontSize: '0.875rem', color: '#bbb49b', mt: 0.5 }}>
                        Add an extra layer of security to your account.
                      </Typography>
                    </Box>
                    <Switch
                      checked={mfaEnabled}
                      onChange={(e) => setMfaEnabled(e.target.checked)}
                      sx={{
                        '& .MuiSwitch-switchBase.Mui-checked': {
                          color: '#f9c806',
                        },
                        '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                          backgroundColor: '#f9c806',
                        },
                      }}
                    />
                  </Box>
                </Box>
              </Box>
            </Box>
          )}

          {/* Sessions Section */}
          {activeTab === 'sessions' && (
            <Box sx={{ space: 4 }}>
              <Box sx={{ mb: 6 }}>
                <Typography sx={{ fontSize: '1.375rem', fontWeight: 700, mb: 3 }}>
                  Active Sessions
                </Typography>
                <Box
                  sx={{
                    backgroundColor: '#1f1e18',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '0.75rem',
                    p: 3,
                  }}
                >
                  <SessionsManager />
                </Box>
              </Box>
            </Box>
          )}

          {/* Activity Section */}
          {activeTab === 'activity' && (
            <Box sx={{ space: 4 }}>
              <Box sx={{ mb: 6 }}>
                <Typography sx={{ fontSize: '1.375rem', fontWeight: 700, mb: 3 }}>
                  Activity Logs
                </Typography>
                <Box
                  sx={{
                    backgroundColor: '#1f1e18',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '0.75rem',
                    p: 3,
                  }}
                >
                  <ActivityLogs />
                </Box>
              </Box>
            </Box>
          )}

          {/* Connected Identities Section */}
          {activeTab === 'identities' && (
            <Box sx={{ space: 4 }}>
              <Box sx={{ mb: 6 }}>
                <Typography sx={{ fontSize: '1.375rem', fontWeight: 700, mb: 3 }}>
                  Connected Identities
                </Typography>
                <Box
                  sx={{
                    backgroundColor: '#1f1e18',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '0.75rem',
                    p: 3,
                  }}
                >
                  <ConnectedIdentities />
                </Box>
              </Box>
            </Box>
          )}

          {/* Preferences Section */}
          {activeTab === 'preferences' && (
            <Box sx={{ space: 4 }}>
              <Box sx={{ mb: 6 }}>
                <Typography sx={{ fontSize: '1.375rem', fontWeight: 700, mb: 3 }}>
                  Preferences
                </Typography>
                <Box
                  sx={{
                    backgroundColor: '#1f1e18',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '0.75rem',
                    p: 3,
                  }}
                >
                  <PreferencesManager />
                </Box>
              </Box>
            </Box>
          )}

          {/* Account Section */}
          {activeTab === 'account' && (
            <Box>
              <Typography sx={{ fontSize: '1.375rem', fontWeight: 700, mb: 3 }}>Account</Typography>
              
              <Box
                sx={{
                  backgroundColor: '#1f1e18',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '0.75rem',
                  overflow: 'hidden',
                  divide: '1px solid rgba(255, 255, 255, 0.1)',
                }}
              >
                <Box sx={{ p: 2, borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box>
                      <Typography sx={{ fontSize: '1rem', fontWeight: 500, color: 'white' }}>
                        Export Data
                      </Typography>
                      <Typography sx={{ fontSize: '0.875rem', color: '#bbb49b', mt: 0.5 }}>
                        Download a copy of your account data.
                      </Typography>
                    </Box>
                    <Button
                      variant="outlined"
                      sx={{
                        color: 'white',
                        borderColor: 'rgba(255, 255, 255, 0.2)',
                        fontSize: '0.875rem',
                        fontWeight: 500,
                        textTransform: 'none',
                        borderRadius: '0.5rem',
                        '&:hover': { borderColor: 'rgba(255, 255, 255, 0.3)' },
                      }}
                    >
                      Export
                    </Button>
                  </Box>
                </Box>

                <Box sx={{ p: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box>
                      <Typography sx={{ fontSize: '1rem', fontWeight: 500, color: 'white' }}>
                        Delete Account
                      </Typography>
                      <Typography sx={{ fontSize: '0.875rem', color: '#bbb49b', mt: 0.5 }}>
                        Permanently delete your account and all associated data.
                      </Typography>
                    </Box>
                    <Button
                      variant="outlined"
                      sx={{
                        color: '#ef4444',
                        borderColor: 'rgba(239, 68, 68, 0.3)',
                        backgroundColor: 'rgba(239, 68, 68, 0.1)',
                        fontSize: '0.875rem',
                        fontWeight: 500,
                        textTransform: 'none',
                        borderRadius: '0.5rem',
                        '&:hover': {
                          backgroundColor: 'rgba(239, 68, 68, 0.2)',
                          borderColor: 'rgba(239, 68, 68, 0.5)',
                        },
                      }}
                    >
                      Delete Account
                    </Button>
                  </Box>
                </Box>
              </Box>
            </Box>
          )}
        </Box>
      </Box>

      {/* Modals */}
      <AddPasskeyModal
        isOpen={addModalOpen}
        email={user?.email || ''}
        onClose={() => setAddModalOpen(false)}
        onSuccess={handleAddPasskeySuccess}
      />

      <RenamePasskeyModal
        isOpen={renameModalOpen}
        passkey={selectedPasskey}
        email={user?.email || ''}
        onClose={() => {
          setRenameModalOpen(false);
          setSelectedPasskey(null);
        }}
        onSuccess={handleRenameSuccess}
      />

      <LogoutDialog
        open={logoutDialogOpen}
        onClose={() => setLogoutDialogOpen(false)}
        onLogoutComplete={handleLogoutComplete}
      />
    </Box>
  );
}
