'use client';

import { useEffect, Suspense } from 'react';
import { account } from '@/lib/appwrite';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSource } from '@/lib/source-context';
import { Box, CircularProgress } from '@mui/material';
import { colors } from '@/lib/colors';
import { useColors } from '@/lib/theme-context';
import { getAppOrigin } from '@/lib/app-origin';

function HomeContent() {
  const dynamicColors = useColors();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setSource } = useSource();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const source = searchParams.get('source');
        if (source) {
          setSource(source);
        }

        const userData = await account.get();
        if (userData && source) {
          router.replace(source);
        } else if (userData) {
          router.replace(getAppOrigin());
        } else {
          router.replace('/login');
        }
      } catch {
        router.replace('/login');
      }
    };

    checkAuth();
  }, [router, searchParams, setSource]);

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: dynamicColors.background, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <CircularProgress sx={{ color: dynamicColors.primary }} />
    </Box>
  );
}

export default function Home() {
  return (
    <Suspense fallback={
      <Box sx={{ minHeight: '100vh', backgroundColor: '#181711', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <CircularProgress sx={{ color: '#f9c806' }} />
      </Box>
    }>
      <HomeContent />
    </Suspense>
  );
}
