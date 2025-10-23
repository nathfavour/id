'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  getStoredAccounts,
  getPrimaryUserId,
  getAccountsList,
  addAccountToList,
  switchAccount,
  softLogout,
  hardLogout,
  StoredAccount,
} from './multi-account';

export interface UseMultiAccountReturn {
  accounts: StoredAccount[];
  primaryUserId: string | null;
  isLoading: boolean;
  switchToAccount: (userId: string) => Promise<void>;
  removeAccount: (userId: string) => Promise<void>;
  logoutCurrent: (isHard: boolean) => Promise<void>;
  addAccount: (userId: string, email: string, name: string, refreshToken: string) => Promise<void>;
}

/**
 * Hook for managing multiple accounts
 * Use in components that need multi-account functionality
 */
export function useMultiAccount(): UseMultiAccountReturn {
  const [accounts, setAccounts] = useState<StoredAccount[]>([]);
  const [primaryUserId, setPrimaryUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load accounts on mount
  useEffect(() => {
    const loaded = getAccountsList();
    const primary = getPrimaryUserId();
    setAccounts(loaded);
    setPrimaryUserId(primary);
    setIsLoading(false);

    // Listen for account switches from other tabs
    const bc = new BroadcastChannel('id_account_switch');
    bc.onmessage = (event) => {
      console.log('Account switch detected:', event.data.activeUserId);
      // Reload to reflect new session
      window.location.reload();
    };

    return () => {
      bc.close();
    };
  }, []);

  const switchToAccount = useCallback(async (userId: string) => {
    setIsLoading(true);
    try {
      await switchAccount(userId);
    } catch (error) {
      setIsLoading(false);
      throw error;
    }
  }, []);

  const removeAccount = useCallback(async (userId: string) => {
    try {
      await hardLogout(userId);
      const updated = getAccountsList();
      const primary = getPrimaryUserId();
      setAccounts(updated);
      setPrimaryUserId(primary);
    } catch (error) {
      throw error;
    }
  }, []);

  const logoutCurrent = useCallback(async (isHard: boolean) => {
    try {
      if (isHard) {
        await hardLogout();
      } else {
        await softLogout();
      }
      const updated = getAccountsList();
      const primary = getPrimaryUserId();
      setAccounts(updated);
      setPrimaryUserId(primary);
    } catch (error) {
      throw error;
    }
  }, []);

  const addAccount = useCallback(
    async (userId: string, email: string, name: string, refreshToken: string) => {
      try {
        await addAccountToList(userId, email, name, refreshToken);
        const updated = getAccountsList();
        const primary = getPrimaryUserId();
        setAccounts(updated);
        setPrimaryUserId(primary);
      } catch (error) {
        throw error;
      }
    },
    []
  );

  return {
    accounts,
    primaryUserId,
    isLoading,
    switchToAccount,
    removeAccount,
    logoutCurrent,
    addAccount,
  };
}
