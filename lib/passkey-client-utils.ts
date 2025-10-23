'use client';

import { base64UrlToBuffer, publicKeyCredentialToJSON } from '@/lib/webauthn-utils';
import { account } from '@/lib/appwrite';

export async function addPasskeyToAccount(email: string) {
  if (!('credentials' in navigator)) {
    throw new Error('WebAuthn is not supported in this browser');
  }

  // Get current user to verify email matches
  const user = await account.get();
  if (user.email?.toLowerCase() !== email.toLowerCase()) {
    throw new Error('Email mismatch. You can only add passkeys to your own account.');
  }

  // Step 1: Get registration options (no auth needed)
  const res = await fetch('/api/connect/passkey/options', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: email }),
  });

  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error || 'Failed to get registration options');
  }

  const options = await res.json();

  // Step 2: Create passkey (browser handles biometric)
  const publicKey: Record<string, unknown> = { ...options };
  publicKey.challenge = base64UrlToBuffer(options.challenge as string);
  if (publicKey.user?.id) publicKey.user.id = base64UrlToBuffer(options.user.id as string);
  if (publicKey.excludeCredentials) {
    publicKey.excludeCredentials = publicKey.excludeCredentials.map((c: Record<string, unknown>) => ({
      ...c,
      id: base64UrlToBuffer(c.id as string),
    }));
  }

  const cred = await navigator.credentials.create({ publicKey });
  if (!cred) throw new Error('Credential creation returned null');

  const json = publicKeyCredentialToJSON(cred);

  // Step 3: Verify attestation server-side
  const verifyRes = await fetch('/api/connect/passkey/verify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ 
      email: email, 
      attestation: json, 
      challenge: options.challenge, 
      challengeToken: options.challengeToken 
    }),
  });

  if (!verifyRes.ok) {
    const data = await verifyRes.json();
    throw new Error(data.error || 'Failed to verify passkey');
  }

  const verifyData = await verifyRes.json();

  // Step 4: Store passkey in account prefs (client SDK)
  const user_data = await account.get();
  const currentPrefs = user_data.prefs || {};
  
  // Parse existing credentials
  const credentialsStr = (currentPrefs.passkey_credentials || '') as string;
  const countersStr = (currentPrefs.passkey_counter || '') as string;
  const metadataStr = (currentPrefs.passkey_metadata || '') as string;

  const credObj: Record<string, string> = credentialsStr ? JSON.parse(credentialsStr) : {};
  const counterObj: Record<string, number> = countersStr ? JSON.parse(countersStr) : {};
  let metadataObj: Record<string, any> = metadataStr ? JSON.parse(metadataStr) : {};

  // Add new passkey
  const cred_data = verifyData.credential;
  credObj[cred_data.id] = cred_data.publicKey;
  counterObj[cred_data.id] = cred_data.counter;

  // Initialize metadata for new passkey
  const now = Date.now();
  const timeStr = new Date(now).toISOString().split('T')[0];
  metadataObj[cred_data.id] = {
    name: `Passkey ${timeStr}`,
    createdAt: now,
    lastUsedAt: null,
    status: 'active'
  };

  // Update prefs with new passkey
  await account.updatePrefs({
    ...currentPrefs,
    passkey_credentials: JSON.stringify(credObj),
    passkey_counter: JSON.stringify(counterObj),
    passkey_metadata: JSON.stringify(metadataObj),
  });

  return { success: true, message: 'Passkey connected successfully. You can now sign in with it.' };
}

export async function listPasskeys(email: string) {
  const res = await fetch(`/api/webauthn/passkeys/list?email=${encodeURIComponent(email)}`, {
    credentials: 'include',
  });
  
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error || 'Failed to list passkeys');
  }

  const data = await res.json();
  return data.passkeys || [];
}

export async function deletePasskey(email: string, credentialId: string) {
  const res = await fetch('/api/webauthn/passkeys/delete', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, credentialId }),
    credentials: 'include',
  });

  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error || 'Failed to delete passkey');
  }

  return res.json();
}

export async function renamePasskey(email: string, credentialId: string, name: string) {
  const res = await fetch('/api/webauthn/passkeys/rename', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, credentialId, name }),
    credentials: 'include',
  });

  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error || 'Failed to rename passkey');
  }

  return res.json();
}

export async function disablePasskey(email: string, credentialId: string) {
  const res = await fetch('/api/webauthn/passkeys/disable', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, credentialId }),
    credentials: 'include',
  });

  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error || 'Failed to disable passkey');
  }

  return res.json();
}

export async function enablePasskey(email: string, credentialId: string) {
  const res = await fetch('/api/webauthn/passkeys/enable', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, credentialId }),
    credentials: 'include',
  });

  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error || 'Failed to enable passkey');
  }

  return res.json();
}

export async function signOut() {
  try {
    await account.deleteSession('current');
  } catch (err) {
    console.error('Sign out error:', err);
  }
}
