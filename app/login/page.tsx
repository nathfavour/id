'use client';

import { useState, useEffect, Suspense, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Client, Account, OAuthProvider } from 'appwrite';
import { Box, Typography, Stack, TextField, Button, Alert, CircularProgress, IconButton, Grid, Fade, useMediaQuery, useTheme } from '@mui/material';
import { Visibility, VisibilityOff, Close } from '@mui/icons-material';

const client = new Client();
if (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT) client.setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT);
if (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_APPWRITE_PROJECT) client.setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT);
const account = new Account(client);

export default function LoginPage() {
  return (
    <Suspense fallback={
      <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#181711' }}>
        <CircularProgress sx={{ color: '#f9c806' }} />
      </Box>
    }>
      <LoginContent />
    </Suspense>
  );
}

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'));
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [emailValid, setEmailValid] = useState(false);
  const [emailTouched, setEmailTouched] = useState(false);
  const [typingTimeout, setTypingTimeout] = useState<NodeJS.Timeout | null>(null);
  
  const appName = process.env.NEXT_PUBLIC_APP_NAME || 'ID';

  // Email validation regex
  const isValidEmail = useCallback((email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }, []);

  // Handle email input with dynamic typing detection
  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newEmail = e.target.value;
    setEmail(newEmail);
    setEmailTouched(true);

    if (typingTimeout) clearTimeout(typingTimeout);

    const isValid = isValidEmail(newEmail);
    const delay = isValid ? 200 : 500;

    const timeout = setTimeout(() => {
      setEmailValid(isValid);
    }, delay);

    setTypingTimeout(timeout);
  };

  // Check for OAuth error from URL
  useEffect(() => {
    if (searchParams.get('error') === 'oauth_failed' && !message) {
      setMessage('OAuth login failed. Please try again.');
    }
  }, [searchParams, message]);

  // Handle OAuth login
  const handleOAuthLogin = async (provider: OAuthProvider) => {
    setLoading(true);
    setMessage(null);
    try {
      const success = `${window.location.origin}/`;
      const failure = `${window.location.origin}/login?error=oauth_failed`;
      await account.createOAuth2Session({
        provider,
        success,
        failure,
      });
    } catch (err: any) {
      setMessage(err.message || 'OAuth login failed');
      setLoading(false);
    }
  };

  // Handle password login
  const handlePasswordLogin = async () => {
    if (!emailValid || !password.trim()) {
      setMessage('Please enter a valid email and password');
      return;
    }
    setLoading(true);
    setMessage(null);
    try {
      // TODO: Implement password auth endpoint
      setMessage('Password login not yet implemented');
      setLoading(false);
    } catch (err: any) {
      setMessage(err.message || 'Login failed');
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(0, 0, 0, 0.5)',
        backdropFilter: 'blur(4px)',
        p: 2,
      }}
    >
      {/* Modal */}
      <Box
        sx={{
          width: '100%',
          maxWidth: isDesktop ? 560 : 448,
          borderRadius: '0.75rem',
          backgroundColor: '#231f0f',
          p: 4,
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8)',
          position: 'relative',
        }}
      >
        {/* Close Button */}
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 3 }}>
          <IconButton
            onClick={() => router.push('/')}
            sx={{
              color: '#bbb49b',
              '&:hover': { color: 'white' },
            }}
          >
            <Close />
          </IconButton>
        </Box>

        {/* Title */}
        <Box sx={{ mb: 5, textAlign: 'center' }}>
          <Typography
            sx={{
              color: 'white',
              fontSize: { xs: '1.75rem', md: '2rem' },
              fontWeight: 900,
              lineHeight: 1.2,
              letterSpacing: '-0.033em',
            }}
          >
            Continue with:
          </Typography>
        </Box>

        {/* OAuth Buttons - Side by side on desktop */}
        <Stack spacing={isDesktop ? 0 : 2} sx={{ mb: 5 }}>
          <Grid container spacing={isDesktop ? 2 : 0}>
            {/* Google */}
            <Grid item xs={12} md={6}>
              <Button
                onClick={() => handleOAuthLogin(OAuthProvider.Google)}
                disabled={loading}
                fullWidth
                sx={{
                  backgroundColor: '#fff',
                  color: '#1f2937',
                  height: 48,
                  borderRadius: '0.5rem',
                  fontWeight: 600,
                  textTransform: 'none',
                  border: '1px solid #d1d5db',
                  '&:hover': { backgroundColor: '#f3f4f6' },
                  '&:disabled': { opacity: 0.5 },
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1.5,
                }}
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                Google
              </Button>
            </Grid>

            {/* GitHub */}
            <Grid item xs={12} md={6}>
              <Button
                onClick={() => handleOAuthLogin(OAuthProvider.Github)}
                disabled={loading}
                fullWidth
                sx={{
                  backgroundColor: '#1f2937',
                  color: '#fff',
                  height: 48,
                  borderRadius: '0.5rem',
                  fontWeight: 600,
                  textTransform: 'none',
                  border: '1px solid #111827',
                  '&:hover': { backgroundColor: '#111827' },
                  '&:disabled': { opacity: 0.5 },
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1.5,
                }}
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                </svg>
                GitHub
              </Button>
            </Grid>
          </Grid>
        </Stack>

        {/* Divider */}
        <Box sx={{ display: 'flex', alignItems: 'center', my: 4, gap: 2 }}>
          <Box sx={{ flex: 1, height: '1px', backgroundColor: '#3a3627' }} />
          <Typography sx={{ fontSize: '0.875rem', color: '#bbb49b', whiteSpace: 'nowrap' }}>or enter email</Typography>
          <Box sx={{ flex: 1, height: '1px', backgroundColor: '#3a3627' }} />
        </Box>

        {/* Email Field */}
        <Stack spacing={3} sx={{ mb: 5 }}>
          <Box>
            <TextField
              type="email"
              value={email}
              onChange={handleEmailChange}
              placeholder="your@email.com"
              fullWidth
              sx={{
                '& .MuiOutlinedInput-root': {
                  color: 'white',
                  height: '3rem',
                  borderRadius: '0.5rem',
                  backgroundColor: '#27251b',
                  border: '1px solid #55503a',
                  '&:hover': { borderColor: '#6b6551' },
                  '&.Mui-focused': { borderColor: '#f9c806' },
                  '& fieldset': { border: 'none' },
                },
                '& .MuiOutlinedInput-input::placeholder': {
                  color: '#8b8671',
                  opacity: 1,
                },
              }}
            />
          </Box>

          {/* Blurred Passkey Option */}
          <Fade in={emailTouched}>
            <Box sx={{ opacity: emailValid ? 1 : 0.4, pointerEvents: emailValid ? 'auto' : 'none', transition: 'all 0.3s' }}>
              <Button
                onClick={() => {}}
                disabled={!emailValid || loading}
                fullWidth
                sx={{
                  backgroundColor: '#3a3627',
                  color: emailValid ? '#f9c806' : '#bbb49b',
                  height: 48,
                  borderRadius: '0.5rem',
                  fontWeight: 600,
                  textTransform: 'none',
                  border: '1px solid #55503a',
                  '&:hover:not(:disabled)': { backgroundColor: '#4a4637' },
                  filter: emailValid ? 'none' : 'blur(2px)',
                }}
              >
                Passkey
              </Button>
            </Box>
          </Fade>

          {/* Blurred Wallet Option */}
          <Fade in={emailTouched}>
            <Box sx={{ opacity: emailValid ? 1 : 0.4, pointerEvents: emailValid ? 'auto' : 'none', transition: 'all 0.3s' }}>
              <Button
                onClick={() => {}}
                disabled={!emailValid || loading}
                fullWidth
                sx={{
                  backgroundColor: '#3a3627',
                  color: emailValid ? '#f9c806' : '#bbb49b',
                  height: 48,
                  borderRadius: '0.5rem',
                  fontWeight: 600,
                  textTransform: 'none',
                  border: '1px solid #55503a',
                  '&:hover:not(:disabled)': { backgroundColor: '#4a4637' },
                  filter: emailValid ? 'none' : 'blur(2px)',
                }}
              >
                Wallet
              </Button>
            </Box>
          </Fade>

          {/* Blurred Password Option */}
          <Fade in={emailValid && emailTouched}>
            <Box>
              <Box sx={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <TextField
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  fullWidth
                  disabled={!emailValid}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      color: 'white',
                      height: '3rem',
                      borderRadius: '0.5rem',
                      backgroundColor: '#27251b',
                      border: '1px solid #55503a',
                      '&:hover': { borderColor: '#6b6551' },
                      '&.Mui-focused': { borderColor: '#f9c806' },
                      '& fieldset': { border: 'none' },
                    },
                    '& .MuiOutlinedInput-input::placeholder': {
                      color: '#8b8671',
                      opacity: 1,
                    },
                    '& .Mui-disabled': {
                      backgroundColor: '#27251b',
                      color: '#8b8671',
                    },
                  }}
                />
                {emailValid && (
                  <IconButton
                    onClick={() => setShowPassword(!showPassword)}
                    sx={{
                      position: 'absolute',
                      right: 12,
                      color: '#bbb49b',
                      '&:hover': { color: 'white' },
                    }}
                  >
                    {showPassword ? <Visibility fontSize="small" /> : <VisibilityOff fontSize="small" />}
                  </IconButton>
                )}
              </Box>
              {emailValid && (
                <Button
                  onClick={handlePasswordLogin}
                  disabled={!password.trim() || loading}
                  fullWidth
                  sx={{
                    backgroundColor: '#f9c806',
                    color: '#231f0f',
                    height: 48,
                    borderRadius: '0.5rem',
                    fontWeight: 700,
                    textTransform: 'none',
                    mt: 2,
                    '&:hover:not(:disabled)': { backgroundColor: '#ffd633' },
                    '&:disabled': { opacity: 0.5 },
                  }}
                >
                  Sign in
                </Button>
              )}
            </Box>
          </Fade>
        </Stack>

        {/* Message Alert */}
        {message && (
          <Alert severity={message.toLowerCase().includes('error') ? 'error' : 'warning'} sx={{ mt: 3 }}>
            {message}
          </Alert>
        )}
      </Box>
    </Box>
  );
}
