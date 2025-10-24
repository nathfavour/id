'use client';

import { useState, useEffect } from 'react';
import { account } from '@/lib/appwrite';
import {
  Box,
  Typography,
  Button,
  Alert,
  AlertTitle,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Stack,
  Chip,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import RefreshIcon from '@mui/icons-material/Refresh';
import LaptopIcon from '@mui/icons-material/Laptop';
import PhoneIcon from '@mui/icons-material/Phone';
import TabletIcon from '@mui/icons-material/Tablet';
import { Models } from 'appwrite';

interface Session extends Models.Session {
  deviceType?: 'desktop' | 'mobile' | 'tablet';
}

interface SessionsManagerProps {
  onSessionsLoaded?: (count: number) => void;
}

export default function SessionsManager({ onSessionsLoaded }: SessionsManagerProps) {
  const [loading, setLoading] = useState(true);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    try {
      setLoading(true);
      setError(null);
      const sessionList = await account.listSessions();
      const formattedSessions = (sessionList.sessions || []).map((session) => ({
        ...session,
        deviceType: getDeviceType(session.userAgent),
      }));
      setSessions(formattedSessions);
      onSessionsLoaded?.(formattedSessions.length);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const getDeviceType = (userAgent: string): 'desktop' | 'mobile' | 'tablet' => {
    if (/mobile|android/i.test(userAgent)) return 'mobile';
    if (/ipad|tablet/i.test(userAgent)) return 'tablet';
    return 'desktop';
  };

  const getDeviceIcon = (deviceType: string) => {
    switch (deviceType) {
      case 'mobile':
        return <PhoneIcon sx={{ fontSize: 20 }} />;
      case 'tablet':
        return <TabletIcon sx={{ fontSize: 20 }} />;
      default:
        return <LaptopIcon sx={{ fontSize: 20 }} />;
    }
  };

  const handleDeleteClick = (session: Session) => {
    setSelectedSession(session);
    setDeleteDialogOpen(true);
  };

  const handleDeleteSession = async () => {
    if (!selectedSession) return;
    try {
      setDeleting(true);
      setError(null);
      await account.deleteSession(selectedSession.$id);
      setSessions(sessions.filter((s) => s.$id !== selectedSession.$id));
      setDeleteDialogOpen(false);
      setSelectedSession(null);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setDeleting(false);
    }
  };

  const handleDeleteAllSessions = async () => {
    try {
      setLoading(true);
      setError(null);
      await account.deleteSessions();
      setSessions([]);
      onSessionsLoaded?.(0);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleString();
  };

  const getCountryFromIP = (ip: string): string => {
    // Simple placeholder - in production, use a geolocation service
    return 'Unknown Location';
  };

  if (loading && sessions.length === 0) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
        <CircularProgress size={40} sx={{ color: '#f9c806' }} />
      </Box>
    );
  }

  return (
    <Box>
      {error && (
        <Alert 
          severity="error" 
          sx={{ 
            mb: 3,
            borderRadius: '0.75rem',
            boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.3)',
          }}
        >
          <AlertTitle>Error</AlertTitle>
          {error}
        </Alert>
      )}

      {sessions.length === 0 ? (
        <Box
          sx={{
            backgroundColor: '#1f1e18',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '0.75rem',
            boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.3), 0 1px 2px -1px rgb(0 0 0 / 0.3)',
            p: 3,
            textAlign: 'center',
          }}
        >
          <Typography sx={{ color: '#bbb49b' }}>No active sessions found.</Typography>
        </Box>
      ) : (
        <Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography sx={{ color: '#bbb49b', fontSize: '0.875rem' }}>
              {sessions.length} active {sessions.length === 1 ? 'session' : 'sessions'}
            </Typography>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button
                onClick={loadSessions}
                disabled={loading}
                startIcon={<RefreshIcon />}
                sx={{
                  color: 'white',
                  borderColor: 'rgba(255, 255, 255, 0.2)',
                  fontSize: '0.75rem',
                  fontWeight: 500,
                  textTransform: 'none',
                  borderRadius: '0.5rem',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  boxShadow: '0 1px 2px 0 rgb(0 0 0 / 0.2)',
                  '&:hover': { 
                    borderColor: 'rgba(255, 255, 255, 0.3)',
                    boxShadow: '0 2px 4px 0 rgb(0 0 0 / 0.3)',
                  },
                }}
              >
                Refresh
              </Button>
              {sessions.length > 1 && (
                <Button
                  onClick={handleDeleteAllSessions}
                  sx={{
                    color: '#ef4444',
                    borderColor: 'rgba(239, 68, 68, 0.3)',
                    backgroundColor: 'rgba(239, 68, 68, 0.1)',
                    fontSize: '0.75rem',
                    fontWeight: 500,
                    textTransform: 'none',
                    borderRadius: '0.5rem',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    boxShadow: '0 1px 2px 0 rgb(0 0 0 / 0.2)',
                    '&:hover': {
                      backgroundColor: 'rgba(239, 68, 68, 0.2)',
                      borderColor: 'rgba(239, 68, 68, 0.5)',
                      boxShadow: '0 2px 4px 0 rgb(0 0 0 / 0.3)',
                    },
                  }}
                >
                  Logout All
                </Button>
              )}
            </Box>
          </Box>

          <Stack spacing={2}>
            {sessions.map((session) => (
              <Box
                key={session.$id}
                sx={{
                  backgroundColor: '#1f1e18',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '0.75rem',
                  boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.3), 0 1px 2px -1px rgb(0 0 0 / 0.3)',
                  p: 3,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  gap: 2,
                  transition: 'box-shadow 0.2s, transform 0.2s',
                  '&:hover': {
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.3), 0 2px 4px -2px rgb(0 0 0 / 0.3)',
                    transform: 'translateY(-1px)',
                  }
                }}
              >
                <Box sx={{ flex: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: 40,
                        height: 40,
                        borderRadius: '0.5rem',
                        backgroundColor: 'rgba(249, 200, 6, 0.1)',
                        color: '#f9c806',
                      }}
                    >
                      {getDeviceIcon(session.deviceType || 'desktop')}
                    </Box>
                    <Box>
                      <Typography sx={{ fontSize: '0.875rem', fontWeight: 500, color: 'white' }}>
                        {session.clientName || 'Unknown Client'} ({session.deviceType?.toUpperCase() || 'DESKTOP'})
                      </Typography>
                      <Typography sx={{ fontSize: '0.75rem', color: '#bbb49b' }}>
                        {getCountryFromIP(session.ip)} • {session.ip}
                      </Typography>
                    </Box>
                  </Box>

                  <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mt: 2 }}>
                    <Box>
                      <Typography sx={{ fontSize: '0.65rem', color: '#bbb49b', textTransform: 'uppercase' }}>
                        Last Active
                      </Typography>
                      <Typography sx={{ fontSize: '0.75rem', color: 'white' }}>
                        {formatDate(session.updatedAt || session.createdAt)}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography sx={{ fontSize: '0.65rem', color: '#bbb49b', textTransform: 'uppercase' }}>
                        Created
                      </Typography>
                      <Typography sx={{ fontSize: '0.75rem', color: 'white' }}>
                        {formatDate(session.createdAt)}
                      </Typography>
                    </Box>
                    {session.current && (
                      <Chip
                        label="Current Session"
                        size="small"
                        sx={{
                          backgroundColor: 'rgba(34, 197, 94, 0.2)',
                          color: '#22c55e',
                          fontSize: '0.65rem',
                          fontWeight: 500,
                          height: 20,
                          mt: 1,
                          borderRadius: '0.375rem',
                        }}
                      />
                    )}
                  </Box>
                </Box>

                <Button
                  onClick={() => handleDeleteClick(session)}
                  disabled={!session.current === false} // Can only delete non-current sessions from list
                  startIcon={<DeleteIcon />}
                  sx={{
                    color: '#ef4444',
                    borderColor: 'rgba(239, 68, 68, 0.3)',
                    backgroundColor: 'rgba(239, 68, 68, 0.1)',
                    fontSize: '0.75rem',
                    fontWeight: 500,
                    textTransform: 'none',
                    borderRadius: '0.5rem',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    whiteSpace: 'nowrap',
                    boxShadow: '0 1px 2px 0 rgb(0 0 0 / 0.2)',
                    '&:hover': {
                      backgroundColor: 'rgba(239, 68, 68, 0.2)',
                      borderColor: 'rgba(239, 68, 68, 0.5)',
                      boxShadow: '0 2px 4px 0 rgb(0 0 0 / 0.3)',
                    },
                    '&:disabled': { opacity: 0.5 },
                  }}
                >
                  Logout
                </Button>
              </Box>
            ))}
          </Stack>
        </Box>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        PaperProps={{
          sx: {
            backgroundColor: '#231f0f',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '1rem',
            boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.3), 0 8px 10px -6px rgb(0 0 0 / 0.3)',
          },
        }}
      >
        <DialogTitle sx={{ color: 'white', pb: 1 }}>Logout Session</DialogTitle>
        <DialogContent>
          <Typography sx={{ color: '#bbb49b', mt: 2 }}>
            Are you sure you want to logout this session? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button 
            onClick={() => setDeleteDialogOpen(false)} 
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
            onClick={handleDeleteSession}
            disabled={deleting}
            variant="contained"
            sx={{
              backgroundColor: '#ef4444',
              color: 'white',
              borderRadius: '0.5rem',
              textTransform: 'none',
              fontWeight: 600,
              boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.3), 0 1px 2px -1px rgb(0 0 0 / 0.3)',
              '&:hover': { 
                backgroundColor: '#dc2626',
                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.3), 0 2px 4px -2px rgb(0 0 0 / 0.3)',
              },
            }}
          >
            {deleting ? 'Logging out...' : 'Logout'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
