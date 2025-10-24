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
  Stack,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TextField,
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import { Models } from 'appwrite';

interface Log extends Models.Log {
  eventType?: string;
}

interface ActivityLogsProps {
  onLogsLoaded?: (count: number) => void;
}

const EVENT_ICONS: Record<string, string> = {
  'account.create': '✨',
  'account.update': '✏️',
  'account.sessions.create': '🔐',
  'account.sessions.delete': '🚪',
  'account.password.update': '🔑',
  'account.email.update': '📧',
  'account.phone.update': '📱',
  'account.prefs.update': '⚙️',
  'passkey.create': '🔓',
  'passkey.update': '🔓',
  'passkey.delete': '🗑️',
  'oauth.create': '🔗',
  'wallet.create': '💰',
  'wallet.update': '💰',
  'mfa.create': '🔐',
  'mfa.delete': '🚪',
};

const EVENT_COLORS: Record<string, string> = {
  'account.sessions.create': '#22c55e',
  'account.sessions.delete': '#f97316',
  'account.password.update': '#3b82f6',
  'account.email.update': '#8b5cf6',
  'passkey.create': '#ec4899',
  'passkey.delete': '#ef4444',
  'wallet.create': '#f59e0b',
  'oauth.create': '#06b6d4',
};

export default function ActivityLogs({ onLogsLoaded }: ActivityLogsProps) {
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState<Log[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadLogs();
  }, []);

  const loadLogs = async () => {
    try {
      setLoading(true);
      setError(null);
      const logList = await account.listLogs();
      const formattedLogs = (logList.logs || []).map((log) => ({
        ...log,
        eventType: log.event,
      }));
      setLogs(formattedLogs);
      onLogsLoaded?.(formattedLogs.length);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleString();
  };

  const getEventLabel = (event: string): string => {
    return event.split('.').map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  const getEventColor = (event: string): string => {
    return EVENT_COLORS[event] || '#f9c806';
  };

  const filteredLogs = logs.filter((log) =>
    log.event?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.ip?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const paginatedLogs = filteredLogs.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  if (loading && logs.length === 0) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
        <CircularProgress size={40} sx={{ color: '#f9c806' }} />
      </Box>
    );
  }

  return (
    <Box>
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          <AlertTitle>Error</AlertTitle>
          {error}
        </Alert>
      )}

      {logs.length === 0 ? (
        <Box
          sx={{
            backgroundColor: '#1f1e18',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '0.75rem',
            p: 3,
            textAlign: 'center',
          }}
        >
          <Typography sx={{ color: '#bbb49b' }}>No activity logs found.</Typography>
        </Box>
      ) : (
        <Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, gap: 2 }}>
            <TextField
              placeholder="Search logs..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(0);
              }}
              size="small"
              sx={{
                flex: 1,
                '& .MuiOutlinedInput-root': {
                  backgroundColor: '#1f1e18',
                  color: 'white',
                  '& fieldset': {
                    borderColor: 'rgba(255, 255, 255, 0.2)',
                  },
                  '&:hover fieldset': {
                    borderColor: 'rgba(255, 255, 255, 0.3)',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#f9c806',
                  },
                },
                '& .MuiOutlinedInput-input::placeholder': {
                  color: '#bbb49b',
                  opacity: 0.7,
                },
              }}
            />
            <Button
              onClick={loadLogs}
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
                '&:hover': { borderColor: 'rgba(255, 255, 255, 0.3)' },
              }}
            >
              Refresh
            </Button>
          </Box>

          <TableContainer
            sx={{
              backgroundColor: '#1f1e18',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '0.75rem',
              overflow: 'hidden',
            }}
          >
            <Table size="small">
              <TableHead>
                <TableRow sx={{ backgroundColor: '#231f0f' }}>
                  <TableCell sx={{ color: '#bbb49b', fontSize: '0.75rem', fontWeight: 600 }}>Event</TableCell>
                  <TableCell sx={{ color: '#bbb49b', fontSize: '0.75rem', fontWeight: 600 }}>IP Address</TableCell>
                  <TableCell sx={{ color: '#bbb49b', fontSize: '0.75rem', fontWeight: 600 }}>Location</TableCell>
                  <TableCell sx={{ color: '#bbb49b', fontSize: '0.75rem', fontWeight: 600 }}>Timestamp</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {paginatedLogs.map((log) => (
                  <TableRow
                    key={log.$id}
                    sx={{
                      borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                      '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.02)' },
                    }}
                  >
                    <TableCell sx={{ py: 1.5 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography sx={{ fontSize: '1.25rem' }}>
                          {EVENT_ICONS[log.event || ''] || '📋'}
                        </Typography>
                        <Box>
                          <Typography sx={{ fontSize: '0.875rem', color: 'white', fontWeight: 500 }}>
                            {getEventLabel(log.event || 'Unknown')}
                          </Typography>
                          <Chip
                            label={log.event || 'unknown'}
                            size="small"
                            sx={{
                              backgroundColor: `${getEventColor(log.event || '')}20`,
                              color: getEventColor(log.event || ''),
                              fontSize: '0.65rem',
                              height: 18,
                              mt: 0.5,
                            }}
                          />
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell sx={{ color: '#bbb49b', fontSize: '0.875rem', fontFamily: 'monospace' }}>
                      {log.ip}
                    </TableCell>
                    <TableCell sx={{ color: '#bbb49b', fontSize: '0.875rem' }}>
                      {log.countryCode || '—'}
                    </TableCell>
                    <TableCell sx={{ color: '#bbb49b', fontSize: '0.875rem', whiteSpace: 'nowrap' }}>
                      {formatDate(log.createdAt)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          <TablePagination
            rowsPerPageOptions={[5, 10, 25]}
            component="div"
            count={filteredLogs.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            sx={{
              backgroundColor: '#1f1e18',
              borderTop: '1px solid rgba(255, 255, 255, 0.1)',
              '& .MuiTablePagination-toolbar': {
                color: '#bbb49b',
              },
              '& .MuiIconButton-root': {
                color: '#bbb49b',
              },
              '& .MuiIconButton-root:hover': {
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
              },
            }}
          />
        </Box>
      )}
    </Box>
  );
}
