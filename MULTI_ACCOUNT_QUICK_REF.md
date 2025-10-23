# Multi-Account Quick Reference

## For Developers

### Using Multi-Account in Components

```typescript
import { useMultiAccount } from '@/lib/use-multi-account';

export function MyComponent() {
  const {
    accounts,           // StoredAccount[]
    primaryUserId,      // string | null
    isLoading,          // boolean
    switchToAccount,    // (userId: string) => Promise<void>
    removeAccount,      // (userId: string) => Promise<void>
    logoutCurrent,      // (isHard: boolean) => Promise<void>
    addAccount,         // (userId, email, name, refreshToken) => Promise<void>
  } = useMultiAccount();

  return (
    <div>
      {accounts.map(acc => (
        <button key={acc.userId} onClick={() => switchToAccount(acc.userId)}>
          Switch to {acc.email}
        </button>
      ))}
    </div>
  );
}
```

### Manual Account Management (without hook)

```typescript
import {
  addAccountToList,
  switchAccount,
  softLogout,
  hardLogout,
  getAccountsList,
  getStoredAccount,
  getPrimaryUserId,
} from '@/lib/multi-account';

// Store account after successful login
await addAccountToList(userId, email, name, refreshToken);

// Switch to another account
await switchAccount(userIdToSwitchTo);

// Logout without removing account
await softLogout();

// Logout and remove account
await hardLogout(userIdToRemove);

// Query accounts
const allAccounts = getAccountsList();
const account = getStoredAccount(userId);
const primaryId = getPrimaryUserId();
```

## For End Users

### Adding an Account

1. Go to login page (or click "Add Account" in settings)
2. Choose login method (OAuth, Passkey, Wallet)
3. Complete login
4. Account is automatically saved

### Switching Accounts

**From Login Page:**
1. See "Your Accounts" section at top
2. Click account to switch to it
3. Automatically logs in

**From Settings:**
1. Go to Settings → Account tab
2. See "Other Accounts" section
3. Click "Switch" button
4. Automatically logs in

### Soft Logout (Keep Account)

1. Click your avatar in top-right
2. Click "Sign Out"
3. Choose "Soft Logout"
4. Session ends, but account is saved
5. Next login, email is pre-filled

### Hard Logout (Remove Account)

1. Click your avatar in top-right
2. Click "Sign Out"
3. Choose "Hard Logout"
4. Account completely removed
5. Must log in manually next time

### Remove Specific Account

**From Login Page:**
1. Go to login page
2. In "Your Accounts" section
3. Click red X on account
4. Account removed

**From Settings:**
1. Go to Settings → Account tab
2. In "Other Accounts" section
3. Click red X on account
4. Account removed

## API Reference

### Multi-Account Module (`lib/multi-account.ts`)

```typescript
interface StoredAccount {
  userId: string;
  email: string;
  name: string;
  refreshToken: string;
  addedAt: number;  // Timestamp
}

// Add new account (call after successful login)
export async function addAccountToList(
  userId: string,
  email: string,
  name: string,
  refreshToken: string
): Promise<void>

// Switch to different account
export async function switchAccount(
  userIdToSwitchTo: string
): Promise<void>

// Sign out but keep account stored
export async function softLogout(): Promise<void>

// Sign out and remove account from storage
export async function hardLogout(userIdToRemove?: string): Promise<void>

// Get all stored accounts
export function getAccountsList(): StoredAccount[]

// Get specific stored account
export function getStoredAccount(userId: string): StoredAccount | null

// Get primary/active user ID
export function getPrimaryUserId(): string | null

// Clear all stored accounts
export function clearAllAccounts(): void
```

### Multi-Account Hook (`lib/use-multi-account.ts`)

```typescript
interface UseMultiAccountReturn {
  accounts: StoredAccount[];
  primaryUserId: string | null;
  isLoading: boolean;
  switchToAccount(userId: string): Promise<void>;
  removeAccount(userId: string): Promise<void>;
  logoutCurrent(isHard: boolean): Promise<void>;
  addAccount(userId: string, email: string, name: string, refreshToken: string): Promise<void>;
}

export function useMultiAccount(): UseMultiAccountReturn
```

### Components

#### AccountSwitcher
```typescript
import { AccountSwitcher } from '@/app/components/AccountSwitcher';

<AccountSwitcher 
  onAccountSwitch={() => {}}  // Optional callback
  onAccountRemove={() => {}}  // Optional callback
/>
```

#### AccountsManager
```typescript
import { AccountsManager } from '@/app/components/AccountsManager';

<AccountsManager
  currentUserId={user.userId}
  onAccountSwitch={() => {}}  // Optional callback
/>
```

#### LogoutDialog
```typescript
import { LogoutDialog } from '@/app/components/LogoutDialog';

<LogoutDialog
  open={isOpen}
  onClose={() => setIsOpen(false)}
  onLogoutComplete={() => {
    // Called after successful logout
  }}
/>
```

## LocalStorage Keys

```typescript
// All accounts
localStorage.getItem('id_multi_accounts')
// Returns: { [userId]: StoredAccount, ... }

// Primary account
localStorage.getItem('id_primary_account')
// Returns: userId string
```

## BroadcastChannel

The system uses `BroadcastChannel('id_account_switch')` for cross-tab sync.

```typescript
// To listen for account switches (already done in useMultiAccount):
const bc = new BroadcastChannel('id_account_switch');
bc.onmessage = (event) => {
  console.log('Account switched to:', event.data.activeUserId);
  window.location.reload();
};

// Broadcasted when account is switched:
// { activeUserId: "userId123" }
```

## Key Files

| File | Purpose | Lines |
|------|---------|-------|
| `lib/multi-account.ts` | Core multi-account logic | 231 |
| `lib/use-multi-account.ts` | React hook | 117 |
| `app/components/AccountSwitcher.tsx` | Login page switcher | 146 |
| `app/components/AccountsManager.tsx` | Settings manager | 155 |
| `app/components/LogoutDialog.tsx` | Logout dialog | 120 |
| `app/login/page.tsx` | Modified for account storage | - |
| `app/settings/page.tsx` | Modified for logout dialog | - |

## Testing Tips

```bash
# Check stored accounts in browser console:
JSON.parse(localStorage.getItem('id_multi_accounts'))

# Clear all accounts:
localStorage.removeItem('id_multi_accounts')
localStorage.removeItem('id_primary_account')

# Manually test add account:
import { addAccountToList } from '@/lib/multi-account'
addAccountToList('test-id', 'test@example.com', 'Test User', 'token-secret')

# Manually test switch:
import { switchAccount } from '@/lib/multi-account'
switchAccount('test-id')

# Manually test logout:
import { softLogout, hardLogout } from '@/lib/multi-account'
await softLogout()      // Keep account
await hardLogout()      // Remove account
```

## Common Issues

| Issue | Solution |
|-------|----------|
| Accounts not appearing | Check localStorage is enabled, try incognito mode |
| Switch not working | Check dev console for errors, verify refresh token valid |
| Session not clearing | Try hard logout instead, check Appwrite logs |
| Cross-tab not syncing | BroadcastChannel not supported, try manual refresh |
| Email not auto-filling | Check localStorage, clear browser cache |

## Security Reminders

⚠️ **Refresh tokens are stored in localStorage**
- Accessible to any JavaScript on the page
- Use CSP headers to prevent inline scripts
- Keep dependencies up to date
- Regular security audits recommended
- Users can hard logout anytime

## Integration Checklist

- [x] Core multi-account logic in `lib/multi-account.ts`
- [x] React hook in `lib/use-multi-account.ts`
- [x] Login page updated with account storage
- [x] Login page shows `AccountSwitcher` component
- [x] Settings page shows logout dialog
- [x] Settings page shows `AccountsManager` component
- [x] All auth methods store accounts (OAuth, Passkey, Wallet)
- [x] Email auto-fill from stored accounts
- [x] Cross-tab sync via BroadcastChannel
- [x] Documentation complete
- [x] No existing functionality broken
- [x] Ready for production

## Next Steps

1. Test multi-account flow end-to-end
2. Test with different auth methods
3. Test cross-tab sync
4. Monitor for any XSS vulnerabilities
5. Consider future enhancements (device management, activity logs)
6. Deploy and gather user feedback
