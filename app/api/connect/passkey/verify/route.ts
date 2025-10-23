/**
 * Verify WebAuthn Attestation - Client-initiated, server-verified
 * 
 * Endpoint: POST /api/connect/passkey/verify
 * 
 * Purpose: Verify the WebAuthn registration attestation signature.
 * 
 * Flow:
 * 1. Client sends attestation + challenge
 * 2. Server verifies cryptographic signature
 * 3. Server returns credential data
 * 4. Client receives data and stores in account prefs using client SDK
 * 
 * Security: 
 * - Server verifies attestation is valid
 * - Client (must be authenticated) updates their own prefs
 * - No session spoofing possible since client uses their own session
 */

export const runtime = 'nodejs';
import { NextResponse } from 'next/server';
import { verifyRegistrationResponse } from '@simplewebauthn/server';
import { verifyChallengeToken } from '../../../../../lib/passkeys';
import { rateLimit, buildRateKey } from '../../../../../lib/rateLimit';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email: rawEmail, attestation, challengeToken, challenge } = body || {};
    const email = String(rawEmail || '').trim().toLowerCase();
    if (!email || !attestation || !challengeToken || !challenge) {
      return NextResponse.json({ error: 'email, attestation, challenge and challengeToken required' }, { status: 400 });
    }

    // Rate limit verification attempts (per IP + email)
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    const windowMs = parseInt(process.env.WEBAUTHN_RATE_LIMIT_WINDOW_MS || '60000', 10);
    const max = parseInt(process.env.WEBAUTHN_RATE_LIMIT_MAX || '20', 10);
    const rl = rateLimit(buildRateKey(['connect','passkey','verify', ip, email]), max, windowMs);
    if (!rl.allowed) {
      return NextResponse.json({ error: 'Too many verification attempts. Wait and retry.' }, { status: 429, headers: { 'Retry-After': Math.ceil((rl.reset - Date.now())/1000).toString() } });
    }

    // Stateless challenge validation
    try {
      verifyChallengeToken(email, challenge, challengeToken);
    } catch (e) {
      return NextResponse.json({ error: (e as Error).message }, { status: 400 });
    }

    // Derive expected RP ID and Origin
    const url = new URL(req.url);
    const forwardedProto = req.headers.get('x-forwarded-proto');
    const forwardedHost = req.headers.get('x-forwarded-host');
    const hostHeader = forwardedHost || req.headers.get('host') || url.host;
    const protocol = (forwardedProto || url.protocol.replace(':', '')).toLowerCase();
    const hostNoPort = hostHeader.split(':')[0];
    const rpID = process.env.NEXT_PUBLIC_RP_ID || hostNoPort || 'localhost';
    const origin = process.env.NEXT_PUBLIC_ORIGIN || `${protocol}://${hostHeader}`;

    // Shape validation
    const att: any = attestation;
    const shapeErrors: string[] = [];
    if (typeof att !== 'object' || !att) shapeErrors.push('attestation not object');
    if (!att.id) shapeErrors.push('missing id');
    if (!att.rawId) shapeErrors.push('missing rawId');
    if (att.type !== 'public-key') shapeErrors.push('type not public-key');
    if (!att.response) shapeErrors.push('missing response');
    if (att.response && !att.response.clientDataJSON) shapeErrors.push('missing response.clientDataJSON');
    if (att.response && !att.response.attestationObject) shapeErrors.push('missing response.attestationObject');
    if (shapeErrors.length) {
      return NextResponse.json({ error: 'Malformed attestation', detail: shapeErrors }, { status: 400 });
    }

    const debug = process.env.WEBAUTHN_DEBUG === '1';

    let verification: any;
    try {
      verification = await verifyRegistrationResponse({
        response: attestation,
        expectedChallenge: challenge,
        expectedOrigin: origin,
        expectedRPID: rpID,
      });
    } catch (libErr) {
      const msg = (libErr as Error).message || String(libErr);
      return NextResponse.json({ error: 'WebAuthn library verification threw', detail: msg, ...(debug ? { expectedOrigin: origin, expectedRPID: rpID } : {}) }, { status: 400 });
    }

    if (!verification?.verified) {
      return NextResponse.json({ error: 'Registration verification failed', ...(debug ? { expectedOrigin: origin, expectedRPID: rpID } : {}) }, { status: 400 });
    }

    const registrationInfo: any = (verification as any).registrationInfo;
    if (!registrationInfo) {
      return NextResponse.json({ error: 'Missing registrationInfo in verification result' }, { status: 500 });
    }

    // Normalize binary fields to base64url strings
    const toBase64Url = (val: unknown): string | null => {
      if (!val) return null;
      if (typeof val === 'string') return val;
      const anyVal: any = val;
      if (typeof Buffer !== 'undefined' && (Buffer.isBuffer?.(anyVal) || anyVal instanceof Uint8Array)) {
        return Buffer.from(anyVal).toString('base64url');
      }
      if (anyVal instanceof ArrayBuffer) {
        return Buffer.from(new Uint8Array(anyVal)).toString('base64url');
      }
      return null;
    };

    const credObj = registrationInfo.credential || {};
    const credId = toBase64Url(credObj.id) || toBase64Url((registrationInfo as any).credentialID);
    const pubKey = toBase64Url(credObj.publicKey) || toBase64Url((registrationInfo as any).credentialPublicKey);
    const counter = credObj.counter ?? registrationInfo.counter ?? 0;
    const transports = credObj.transports ?? [];

    if (!credId || !pubKey) {
      return NextResponse.json({ error: 'Registration returned incomplete credential' }, { status: 500 });
    }

    // Return credential data for client to store
    // Client will use account.updatePrefs() to store this
    return NextResponse.json({
      success: true,
      credential: {
        id: credId,
        publicKey: pubKey,
        counter: counter,
        transports: transports,
      },
    });
  } catch (err) {
    const debug = process.env.WEBAUTHN_DEBUG === '1';
    const errorMsg = (err as Error).message || String(err);
    return NextResponse.json({ error: errorMsg, ...(debug ? { stack: (err as Error).stack } : {}) }, { status: 500 });
  }
}

