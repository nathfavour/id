'use client';

import { useEffect, useState, Suspense } from 'react';
import { account } from '@/lib/appwrite';
import { safeDeleteCurrentSession } from '@/lib/safe-session';
import { useRouter, useSearchParams } from 'next/navigation';
import Topbar from '@/app/components/Topbar';
import { colors } from '@/lib/colors';
import {
  Box,
  Typography,
  Button,
  CircularProgress,
  Stack,
  Avatar,
} from '@mui/material';

interface CurrentUser {
  email: string;
  name: string;
  userId: string;
}

const SOURCE_STORAGE_KEY = 'id_redirect_source';

export default function Home() {
  return (
    <Suspense fallback={
      <Box sx={{ minHeight: '100vh', backgroundColor: colors.background, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <CircularProgress sx={{ color: colors.primary }} />
      </Box>
    }>
      <HomeContent />
    </Suspense>
  );
}

function HomeContent() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<CurrentUser | null>(null);
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

          // Check for source parameter and store it
          const source = searchParams.get('source');
          if (source) {
            localStorage.setItem(SOURCE_STORAGE_KEY, source);
          }
          
          setLoading(false);
        }
      } catch (err) {
        if (mounted) {
          setLoading(false);
          router.replace('/login');
        }
      }
    }

    init();
    return () => { mounted = false; };
  }, [router, searchParams]);

  const handleAddAccount = () => {
    router.push('/login');
  };

  const handleSignOut = async () => {
    try {
      await safeDeleteCurrentSession();
    } catch (e) {
      // Ignore
    }
    localStorage.removeItem(SOURCE_STORAGE_KEY);
    router.replace('/login');
  };

  if (loading || !user) {
    return (
      <Box sx={{ minHeight: '100vh', backgroundColor: colors.background, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Box sx={{ textAlign: 'center' }}>
          <CircularProgress size={60} sx={{ color: colors.primary }} />
          <Typography sx={{ mt: 2, color: colors.foreground }}>Loading...</Typography>
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
    <Box sx={{ minHeight: '100vh', backgroundColor: colors.background, color: 'white', display: 'flex', flexDirection: 'column' }}>
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
              <Typography sx={{ fontSize: '0.875rem', color: colors.foreground }}>
                {user.email}
              </Typography>
            </Box>
            <Button
              href="/settings"
              component="a"
              variant="contained"
              sx={{
                backgroundColor: colors.primary,
                color: colors.secondary,
                fontWeight: 700,
                textTransform: 'none',
                borderRadius: '0.5rem',
                px: 3,
                '&:hover': { backgroundColor: colors.primary, opacity: 0.9 },
              }}
            >
              Manage Settings
            </Button>
          </Stack>
        </Box>
      </Box>
    </Box>
  );
}
