# Multi-Account Support Implementation

## Overview

The application now supports a **Google-style multi-account system** where users can:
- Add multiple accounts to their device
- Quickly switch between accounts without logging in again
- Perform "soft logout" (keep account stored, clear session)
- Perform "hard logout" (completely remove account from device)
- Auto-fill the most recent account email on login

## Architecture

### Core Components

#### 1. **Multi-Account Storage** (`lib/multi-account.ts`)
The central module managing all multi-account operations:

```typescript
// Main functions
addAccountToList(userId, email, name, refreshToken)  // Store new account after login
switchAccount(userIdToSwitchTo)                       // Switch to different account
softLogout()                                          // Logout session, keep account stored
hardLogout(userIdToRemove?)                          // Completely remove account
getAccountsList()                                     // Get all stored accounts
getStoredAccount(userId)                             // Get specific account
clearAllAccounts()                                    // Clear all accounts
```

**Storage Format** (localStorage):
```json
{
  "id_multi_accounts": {
    "userId1": {
      "userId": "userId1",
      "email": "user@example.com",
      "name": "User Name",
      "refreshToken": "...",
      "addedAt": 1234567890
    }
  },
  "id_primary_account": "userId1"
}
```

#### 2. **React Hook** (`lib/use-multi-account.ts`)
Provides easy access to multi-account functionality in components:

```typescript
const { accounts, primaryUserId, switchToAccount, removeAccount, logoutCurrent, addAccount } = useMultiAccount();
```

#### 3. **UI Components**

##### `AccountSwitcher` (`app/components/AccountSwitcher.tsx`)
Displayed on login page, allows:
- Quick switching to stored accounts
- Removing accounts with hard logout
- Shows at top of login form for easy access

##### `AccountsManager` (`app/components/AccountsManager.tsx`)
Displayed in Settings → Account tab:
- Shows all other accounts
- Switch to another account
- Remove other accounts

##### `LogoutDialog` (`app/components/LogoutDialog.tsx`)
Modal for logout action:
- **Soft Logout**: Sign out session, account remains on device
- **Hard Logout**: Remove account completely from device

### Integration Points

#### Login Flow (OAuth, Passkey, Wallet)
After successful authentication, the application automatically:
1. Creates the session
2. Fetches user data
3. Calls `addAccountToList()` to store the account for future switching
4. Redirects to dashboard

**Key files modified:**
- `app/login/page.tsx` - Added account storage after OAuth, passkey, and wallet login

#### Settings Page
- Added `LogoutDialog` for soft/hard logout options
- Added `AccountsManager` in Account tab to manage other accounts
- Shows logout options when user clicks sign out

**Key files modified:**
- `app/settings/page.tsx` - Integrated logout dialog and accounts manager

#### Session Sync
Leverages existing `BroadcastChannel` mechanism:
- When account switches, broadcasts to all tabs/windows
- All tabs reload to reflect new session context
- Already implemented in `lib/use-account-sync.ts`

---

## How It Works

### Adding an Account

When user logs in with any method (OAuth, Passkey, Wallet):

```typescript
// After successful session creation
await account.createSession({ userId, secret });
const userData = await account.get();
await addAccountToList(userData.$id, userData.email, userData.name, secret);
```

The refresh token (session secret) is stored securely in localStorage.

### Switching Accounts

When user clicks "Switch" on another account:

```typescript
const accounts = getStoredAccounts();
const account_to_switch = accounts[userIdToSwitchTo];

// Kill current session
await account.deleteSession('current');

// Create new session using stored refresh token
await account.createSession({
  userId: account_to_switch.userId,
  secret: account_to_switch.refreshToken
});

// Broadcast to other tabs
broadcastAccountSwitch(account_to_switch.userId);
window.location.reload();
```

### Soft Logout

```typescript
// Delete current session but keep account stored
await account.deleteSession('current');
// Account remains in localStorage
// User returned to login page, email auto-filled
```

### Hard Logout

```typescript
// Delete session AND remove account from storage
await account.deleteSession('current');
delete accounts[targetUserId];
localStorage.setItem('id_multi_accounts', JSON.stringify(accounts));
```

---

## Usage Examples

### For Users

**Adding a New Account:**
1. Go to login page
2. Click "Add Account" in settings or top menu
3. Log in with new credentials
4. Account is automatically saved

**Switching Accounts:**
1. Go to login page (or click "Switch Account" in settings)
2. Click on account you want to switch to
3. Automatically logs in and redirects

**Soft Logout:**
1. Go to Settings
2. Click "Sign Out"
3. Select "Soft Logout"
4. Session cleared, but account remains saved
5. On login page, email is auto-filled

**Hard Logout:**
1. Go to Settings
2. Click "Sign Out"
3. Select "Hard Logout"
4. Account completely removed from device

**Remove Specific Account:**
1. Go to login page - "Your Accounts" section
2. Click delete icon on account
3. Account removed (hard logout for that account only)

---

## Security Considerations

### Refresh Tokens in localStorage

⚠️ **Important:** Refresh tokens are stored in `localStorage`, which is accessible via XSS attacks.

**Mitigations already in place:**
- HTTPS enforced (environment-dependent)
- Secure cookie handling via Appwrite SDK
- Tokens are refresh tokens (not access tokens)
- Short session durations recommended
- Users can hard logout to clear all tokens

**Recommendations:**
- Use Content Security Policy (CSP) headers
- Regular security audits for XSS vulnerabilities
- Educate users about trusted devices
- Implement "logout all devices" option

### Account Isolation

- Each account is completely isolated
- Session switching properly kills old session
- No session overlap or cross-contamination
- Passkey verification remains per-account
- Wallet authentication per-account

---

## Browser Support

Multi-account features require:
- `localStorage` support
- `BroadcastChannel` API (for cross-tab sync)

**Fallback:** If BroadcastChannel not supported, account switch will still work but won't sync other tabs (they'll need manual refresh).

---

## Testing Scenarios

1. **Basic Multi-Account**
   - Log in with Account A
   - Add Account B (new login)
   - Switch to Account B
   - Verify correct user data loaded

2. **Soft Logout**
   - Log in with Account A
   - Settings → Sign Out → Soft Logout
   - Go to login page
   - Verify email is auto-filled
   - Log back in with stored account

3. **Hard Logout**
   - Log in with Accounts A and B
   - Hard logout Account A
   - Verify Account A not in list on login page
   - Account B still accessible

4. **Cross-Tab Sync**
   - Open 2 tabs, log in to both
   - Switch account in one tab
   - Verify other tab reloads with new session

5. **OAuth Preservation**
   - Log in via Google
   - Add via GitHub
   - Switch between both
   - Verify all features work (passkeys, wallet, etc.)

---

## API Reference

### `lib/multi-account.ts`

```typescript
// Add account after successful login
addAccountToList(userId: string, email: string, name: string, refreshToken: string): Promise<void>

// Switch to different account
switchAccount(userIdToSwitchTo: string): Promise<void>

// Soft logout (keep account)
softLogout(): Promise<void>

// Hard logout (remove account)
hardLogout(userIdToRemove?: string): Promise<void>

// Get all stored accounts
getAccountsList(): StoredAccount[]

// Get specific account
getStoredAccount(userId: string): StoredAccount | null

// Get primary user ID
getPrimaryUserId(): string | null

// Clear all accounts
clearAllAccounts(): void
```

### `lib/use-multi-account.ts`

```typescript
const useMultiAccount = (): UseMultiAccountReturn => {
  accounts: StoredAccount[]
  primaryUserId: string | null
  isLoading: boolean
  switchToAccount(userId: string): Promise<void>
  removeAccount(userId: string): Promise<void>
  logoutCurrent(isHard: boolean): Promise<void>
  addAccount(userId, email, name, refreshToken): Promise<void>
}
```

---

## Limitations & Future Enhancements

### Current Limitations
- Max accounts limited by localStorage size (~5-10 MB typical)
- No server-side tracking of logged-in devices
- No "logout all devices" functionality
- No account activity logs
- No suspicious activity detection

### Potential Enhancements
1. **Server-side account management**: Track logins server-side
2. **Device management**: Name devices, see login history
3. **Suspicious activity**: Alert if login from new location
4. **Logout all devices**: Server-side session revocation
5. **Account linking**: Link multiple OAuth accounts to one user
6. **Parental controls**: Manage family accounts

---

## Troubleshooting

### Accounts not appearing on login page
- Check localStorage is enabled
- Verify refresh tokens are stored correctly
- Clear cache and reload

### Account switch not working
- Verify refresh token validity
- Check Appwrite session limits
- Ensure no CORS issues

### Soft logout not clearing session
- Verify `account.deleteSession('current')` succeeds
- Check Appwrite session management
- Try hard logout if issue persists

### Cross-tab sync not working
- Verify BroadcastChannel supported
- Check browser privacy mode restrictions
- Manual refresh may be needed

---

## File Structure

```
lib/
  ├── multi-account.ts              # Core multi-account logic
  └── use-multi-account.ts          # React hook

app/
  ├── login/
  │   └── page.tsx                  # Updated with account storage
  ├── settings/
  │   └── page.tsx                  # Updated with logout dialog
  └── components/
      ├── AccountSwitcher.tsx       # Login page account switcher
      ├── AccountsManager.tsx       # Settings account manager
      └── LogoutDialog.tsx          # Logout type selection dialog
```
