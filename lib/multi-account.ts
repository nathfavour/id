import { account } from './appwrite';

export interface StoredAccount {
  userId: string;
  email: string;
  name: string;
  refreshToken: string;
  addedAt: number;
}

export interface MultiAccountState {
  accounts: Record<string, StoredAccount>;
  primaryUserId: string | null;
}

const STORAGE_KEY = 'id_multi_accounts';
const PRIMARY_KEY = 'id_primary_account';

/**
 * Get all stored accounts from localStorage
 */
export function getStoredAccounts(): Record<string, StoredAccount> {
  if (typeof window === 'undefined') return {};
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : {};
  } catch {
    return {};
  }
}

/**
 * Get the primary/active user ID
 */
export function getPrimaryUserId(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return localStorage.getItem(PRIMARY_KEY) || null;
  } catch {
    return null;
  }
}

/**
 * Set the primary/active user ID
 */
function setPrimaryUserId(userId: string | null): void {
  if (typeof window === 'undefined') return;
  try {
    if (userId) {
      localStorage.setItem(PRIMARY_KEY, userId);
    } else {
      localStorage.removeItem(PRIMARY_KEY);
    }
  } catch (e) {
    console.error('Failed to set primary user ID:', e);
  }
}

/**
 * Save accounts to localStorage
 */
function saveAccounts(accounts: Record<string, StoredAccount>): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(accounts));
  } catch (e) {
    console.error('Failed to save accounts:', e);
  }
}

/**
 * Add a new account to the list after successful login
 * Called after user successfully logs in
 */
export async function addAccountToList(
  userId: string,
  email: string,
  name: string,
  refreshToken: string
): Promise<void> {
  const accounts = getStoredAccounts();

  accounts[userId] = {
    userId,
    email,
    name,
    refreshToken,
    addedAt: Date.now(),
  };

  saveAccounts(accounts);

  // If no primary account set, set this as primary
  if (!getPrimaryUserId()) {
    setPrimaryUserId(userId);
  }
}

/**
 * Switch to a different account (account switching - like Google)
 * This performs a "session swap" but keeps the account stored
 */
export async function switchAccount(userIdToSwitchTo: string): Promise<void> {
  const accounts = getStoredAccounts();
  const account_to_switch = accounts[userIdToSwitchTo];

  if (!account_to_switch) {
    throw new Error('Account not found');
  }

  try {
    // Kill current session
    try {
      await account.deleteSession('current');
    } catch (e) {
      // Ignore - session might not exist
    }

    // Create new session using refresh token
    await account.createSession({
      userId: account_to_switch.userId,
      secret: account_to_switch.refreshToken,
    });

    // Set as primary
    setPrimaryUserId(account_to_switch.userId);

    // Broadcast the switch to other tabs/windows
    broadcastAccountSwitch(account_to_switch.userId);

    // Reload to reflect new user context
    window.location.reload();
  } catch (error) {
    throw new Error(`Failed to switch account: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Soft logout - logout from current session but keep account stored
 * User won't need to log in manually again on this device
 */
export async function softLogout(): Promise<void> {
  try {
    await account.deleteSession('current');
  } catch (e) {
    // Ignore
  }

  // Account remains in localStorage
  // Email will auto-fill on login page
}

/**
 * Hard logout - completely remove an account from the device
 * Logs out the session AND removes it from stored accounts
 */
export async function hardLogout(userIdToRemove?: string): Promise<void> {
  const accounts = getStoredAccounts();
  let targetUserId = userIdToRemove || getPrimaryUserId();

  if (!targetUserId) {
    throw new Error('No account to remove');
  }

  try {
    // Kill the current session (if this is the active account)
    if (getPrimaryUserId() === targetUserId) {
      try {
        await account.deleteSession('current');
      } catch (e) {
        // Ignore
      }
    }
  } catch (e) {
    // Ignore
  }

  // Remove from stored accounts
  delete accounts[targetUserId];
  saveAccounts(accounts);

  // If this was the primary account, set a new primary
  if (getPrimaryUserId() === targetUserId) {
    const remainingUserIds = Object.keys(accounts);
    if (remainingUserIds.length > 0) {
      setPrimaryUserId(remainingUserIds[0]);
    } else {
      setPrimaryUserId(null);
    }
  }
}

/**
 * Get list of all stored accounts
 */
export function getAccountsList(): StoredAccount[] {
  return Object.values(getStoredAccounts());
}

/**
 * Get a specific stored account
 */
export function getStoredAccount(userId: string): StoredAccount | null {
  const accounts = getStoredAccounts();
  return accounts[userId] || null;
}

/**
 * Broadcast account switch to other tabs/windows
 */
function broadcastAccountSwitch(activeUserId: string): void {
  if (typeof window === 'undefined') return;

  try {
    const bc = new BroadcastChannel('id_account_switch');
    bc.postMessage({ activeUserId });
    bc.close();
  } catch (e) {
    console.error('Failed to broadcast account switch:', e);
  }
}

/**
 * Clear all stored accounts
 * Should be used with caution, e.g., on "sign out all devices" or settings reset
 */
export function clearAllAccounts(): void {
  saveAccounts({});
  setPrimaryUserId(null);
}
