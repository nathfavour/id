# Multi-Account Implementation Guide

## Overview

This system implements **account switching** similar to Google's multi-account support in browsers. Users can:
1. Log in with multiple accounts
2. Switch between them instantly
3. Remove accounts (soft or hard logout)
4. Auto-fill login form with previous accounts

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                      Browser (Same Domain)                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────────────┐         ┌──────────────────┐              │
│  │  Login Page      │         │  Settings Page   │              │
│  │  /login          │         │  /settings       │              │
│  │                  │         │                  │              │
│  │ ┌──────────────┐ │         │ ┌──────────────┐ │              │
│  │ │AccountSwitc  │ │         │ │AccountsMan   │ │              │
│  │ │ler           │ │         │ │ager          │ │              │
│  │ └──────────────┘ │         │ │LogoutDialog  │ │              │
│  └──────┬───────────┘         └──────┬─────────┘ │              │
│         │                            │           │              │
│         └────────────────┬───────────┘           │              │
│                          │                       │              │
│              ┌───────────▼──────────┐            │              │
│              │  useMultiAccount()   │            │              │
│              │  React Hook          │            │              │
│              └───────────┬──────────┘            │              │
│                          │                       │              │
│          ┌───────────────▼────────────────┐      │              │
│          │  lib/multi-account.ts          │      │              │
│          │  ┌──────────────────────────┐  │      │              │
│          │  │ addAccountToList()       │  │      │              │
│          │  │ switchAccount()          │  │      │              │
│          │  │ softLogout()             │  │      │              │
│          │  │ hardLogout()             │  │      │              │
│          │  │ getAccountsList()        │  │      │              │
│          │  └──────────────────────────┘  │      │              │
│          │                                │      │              │
│          │        Appwrite SDK            │      │              │
│          │  account.createSession()       │      │              │
│          │  account.deleteSession()       │      │              │
│          └───────────────┬────────────────┘      │              │
│                          │                       │              │
│        ┌─────────────────▼─────────────────┐    │              │
│        │     localStorage (Secure)         │    │              │
│        │ {                                  │    │              │
│        │   "id_multi_accounts": {          │    │              │
│        │     "userId1": {...},             │    │              │
│        │     "userId2": {...}              │    │              │
│        │   },                              │    │              │
│        │   "id_primary_account": "userId1" │    │              │
│        │ }                                  │    │              │
│        └──────────────────────────────────┘    │              │
└─────────────────────────────────────────────────────────────────┘
         │
         └──────► Appwrite Backend (across all subdomains)
                  - Session management
                  - User authentication
```

## Data Flow: Adding an Account

```
1. User Logs In (OAuth/Passkey/Wallet)
   │
   ├─► account.createSession({ userId, secret })
   │
   ├─► userData = account.get()
   │
   ├─► addAccountToList(
   │     userId,
   │     email,
   │     name,
   │     secret  ◄─── This is the refresh token
   │   )
   │
   └─► Save to localStorage:
       {
         "id_multi_accounts": {
           [userId]: {
             userId, email, name,
             refreshToken: secret,  ◄─── Key for future login
             addedAt: timestamp
           }
         }
       }
```

## Data Flow: Switching Accounts

```
1. User Clicks "Switch" on Stored Account
   │
   ├─► accounts = getStoredAccounts()
   ├─► targetAccount = accounts[userIdToSwitchTo]
   │
   ├─► account.deleteSession('current')  ◄─── Kill old session
   │
   ├─► account.createSession({
   │     userId: targetAccount.userId,
   │     secret: targetAccount.refreshToken  ◄─── Use stored token
   │   })
   │
   ├─► setPrimaryUserId(targetAccount.userId)
   │
   ├─► broadcastAccountSwitch(userId)
   │   │
   │   └─► BroadcastChannel('id_account_switch').postMessage(...)
   │       ├─► All other tabs receive message
   │       └─► All tabs reload
   │
   └─► window.location.reload()  ◄─── Refresh to load new user
```

## Data Flow: Soft Logout

```
1. User Chooses "Soft Logout"
   │
   ├─► account.deleteSession('current')  ◄─── Clear session
   │   (User is now logged out)
   │
   ├─► Account STAYS in localStorage
   │   (For future quick login)
   │
   └─► User redirected to /login
       └─► Email auto-fills from localStorage
```

## Data Flow: Hard Logout

```
1. User Chooses "Hard Logout"
   │
   ├─► account.deleteSession('current')  ◄─── Clear session
   │
   ├─► accounts = getStoredAccounts()
   ├─► delete accounts[userIdToRemove]
   ├─► Save back to localStorage
   │
   └─► User redirected to /login
       └─► Account no longer in list
```

## Security Model

### Threat: XSS Attack
**Risk**: If attacker injects JavaScript, they can access localStorage and steal tokens
**Mitigation**:
- CSP headers prevent inline scripts
- Regular security audits
- Tokens are refresh tokens (limited scope)
- Short session duration recommended
- Users can hard logout anytime

### Threat: Session Hijacking
**Risk**: If attacker steals session cookie
**Mitigation**:
- Appwrite manages session cookies (httpOnly, secure, sameSite)
- Each refresh token is tied to device/browser
- User can hard logout any account remotely (future feature)

### Threat: Man-in-the-Middle
**Risk**: Token interception during transmission
**Mitigation**:
- HTTPS/TLS required (enforced by environment)
- Secure cookie flags
- Refresh tokens only valid for session creation

## Integration Points

### After OAuth Login (app/login/page.tsx:~140)
```typescript
await account.createOAuth2Session({ provider, success, failure });
// OAuth redirects back, session established

// Shortly after:
const session = await account.getSession('current');
const user = await account.get();
await addAccountToList(user.$id, user.email, user.name, session.secret);
```

### After Passkey Registration (app/login/page.tsx:~310)
```typescript
const regVerifyJson = await verifyRegistration(...);
await account.createSession({ userId: email, secret: regVerifyJson.token.secret });

// Store for multi-account
const userData = await account.get();
await addAccountToList(userData.$id, userData.email, ..., regVerifyJson.token.secret);
```

### After Passkey Authentication (app/login/page.tsx:~220)
```typescript
const verifyJson = await verifyAssertion(...);
await account.createSession({ userId: email, secret: verifyJson.token.secret });

// Store for multi-account
const userData = await account.get();
await addAccountToList(userData.$id, userData.email, ..., verifyJson.token.secret);
```

### After Wallet Login (app/login/page.tsx:~375)
```typescript
const execution = await functions.createExecution(...);
await account.createSession({ userId: response.userId, secret: response.secret });

// Store for multi-account
const userData = await account.get();
await addAccountToList(userData.$id, userData.email, ..., response.secret);
```

### Settings Logout (app/settings/page.tsx:~133)
```typescript
// Opens LogoutDialog
const handleSignOut = async () => {
  setLogoutDialogOpen(true);
};

// LogoutDialog handles soft/hard logout
const handleLogout = async () => {
  if (logoutType === 'soft') {
    await softLogout();  // Delete session only
  } else {
    await hardLogout();  // Delete session + remove from storage
  }
  onLogoutComplete();  // Navigate back to login
};
```

### Account Switching (AccountSwitcher.tsx:~65)
```typescript
const handleSwitchAccount = async (userId: string) => {
  await switchAccount(userId);
  // Internally:
  //   1. Delete current session
  //   2. Create new session with stored token
  //   3. Broadcast to other tabs
  //   4. Reload page
};
```

## Files Structure

```
lib/
├── multi-account.ts              # Core multi-account logic (155 lines)
├── use-multi-account.ts          # React hook for components (110 lines)
├── appwrite.ts                   # Existing Appwrite client
└── use-account-sync.ts           # Existing cross-tab sync hook

app/
├── login/
│   └── page.tsx                  # Modified: +account storage integration
├── settings/
│   └── page.tsx                  # Modified: +logout dialog integration
└── components/
    ├── AccountSwitcher.tsx       # New: Login page account switcher (150 lines)
    ├── AccountsManager.tsx       # New: Settings account manager (170 lines)
    └── LogoutDialog.tsx          # New: Logout type selection (120 lines)
```

## Testing Scenarios

### Scenario 1: Basic Multi-Account
```
1. Start at /login
2. Click "Google" → Log in with Account A
3. Redirected to dashboard
4. Click user menu → "Add Account" or go to /login
5. Click "Google" → Log in with Account B
6. Redirected to dashboard
7. Click "Your Accounts" → Select Account A
8. Should reload and show Account A's data
```

### Scenario 2: Soft Logout Flow
```
1. Start at /login (2 accounts stored)
2. Click "Sign in" to Account A
3. Redirected to dashboard
4. Click user menu → "Sign Out"
5. Choose "Soft Logout"
6. Redirected to /login with email pre-filled
7. Click "Passkey" (account A still accessible)
8. Successfully logged back in without re-entering email
```

### Scenario 3: Hard Logout Flow
```
1. Start at /login (2 accounts stored)
2. Click "Sign in" to Account A
3. Redirected to dashboard
4. Click user menu → "Sign Out"
5. Choose "Hard Logout"
6. Redirected to /login
7. Account A no longer in "Your Accounts"
8. Must enter email again to log in
```

### Scenario 4: Cross-Tab Sync
```
1. Open 2 tabs to same app, both at /login
2. In Tab 1: Log in with Account A
3. Redirected to dashboard in Tab 1
4. In Tab 1: Settings → Account → Click "Switch" to Account B
5. Should trigger broadcast
6. Both Tab 1 and Tab 2 should reload
7. Both should show Account B's data
```

## Limitations

- **localStorage size**: ~5-10MB typical limit (can store ~100+ accounts)
- **No server-side tracking**: Accounts only stored on device
- **No device naming**: Can't distinguish "my phone" from "my laptop"
- **No activity logs**: Can't see when/where accounts were accessed
- **No remote logout**: Can't log out account on another device
- **No risk detection**: No suspicious activity alerts

## Future Enhancements

1. **Device Management**
   - Name each device
   - See login history
   - Remote logout from specific device

2. **Security Enhancements**
   - Suspicious activity alerts
   - Require re-auth for sensitive operations
   - Require fingerprint/face for multi-account switching

3. **Account Management**
   - Link multiple OAuth providers to one account
   - Account priority/ordering
   - Frequently used account first

4. **Enterprise Features**
   - Parental controls for family accounts
   - Work profile isolation
   - Shared account audit trails
