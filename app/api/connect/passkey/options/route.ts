/**
 * Connect Passkey to Existing Session - Client-only flow
 * 
 * Endpoint: POST /api/connect/passkey/options
 * 
 * Purpose: Generate WebAuthn registration options for connecting a passkey
 * to an existing authenticated user session (client-side validation only).
 * 
 * Flow:
 * 1. Client sends email (user provides from settings page)
 * 2. Generate registration options without server auth check
 * 3. Client will perform user verification in browser using navigator.credentials
 * 4. Return options + challenge token
 * 
 * No server-side session validation - relies on client passing correct email
 * and subsequent verification being signed by user's authenticator.
 */

import { NextResponse } from 'next/server';
import { generateRegistrationOptions } from '@simplewebauthn/server';
import { issueChallenge } from '../../../../../lib/passkeys';
import crypto from 'crypto';

export async function POST(req: Request) {
  try {
    const { email: rawEmail } = await req.json();
    const email = String(rawEmail).trim().toLowerCase();
    if (!email) {
      return NextResponse.json(
        { error: 'email required' },
        { status: 400 }
      );
    }

    const rpName = process.env.NEXT_PUBLIC_RP_NAME || 'Appwrite Passkey';
    
    const url = new URL(req.url);
    const forwardedHost = req.headers.get('x-forwarded-host');
    const hostHeader = forwardedHost || req.headers.get('host') || url.host;
    const hostNoPort = hostHeader.split(':')[0];
    const rpID = process.env.NEXT_PUBLIC_RP_ID || hostNoPort || 'localhost';

    // User handle
    const userIdHash = crypto.createHash('sha256').update(email).digest();
    const userIdBuffer = new Uint8Array(Buffer.from(userIdHash));

    const options = await generateRegistrationOptions({
      rpName,
      rpID,
      userID: userIdBuffer,
      userName: email,
      attestationType: 'none',
      authenticatorSelection: {
        userVerification: 'preferred',
      },
    });

    // Create stateless challenge
    const issued = issueChallenge(
      email,
      parseInt(process.env.WEBAUTHN_CHALLENGE_TTL_MS || '120000', 10)
    );

    (options as any).challengeToken = issued.challengeToken;
    (options as any).challenge = issued.challenge;
    (options as any).user.id = Buffer.from(userIdHash).toString('base64url');

    return NextResponse.json(options);
  } catch (err) {
    const debug = process.env.WEBAUTHN_DEBUG === '1';
    const errorMsg = (err as Error).message || String(err);
    return NextResponse.json(
      {
        error: errorMsg,
        ...(debug ? { stack: (err as Error).stack } : {}),
      },
      { status: 500 }
    );
  }
}
