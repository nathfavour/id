import { Client, Account } from 'node-appwrite';
import { cookies } from 'next/headers';

export function createServerClient(req?: Request) {
  const client = new Client();
  
  if (process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT) {
    client.setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT);
  }
  if (process.env.NEXT_PUBLIC_APPWRITE_PROJECT) {
    client.setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT);
  }

  // Get session cookie from request
  const cookieStore = cookies();
  const sessionCookie = cookieStore.get(`a_session_${process.env.NEXT_PUBLIC_APPWRITE_PROJECT}`);
  
  if (sessionCookie?.value) {
    client.setSession(sessionCookie.value);
  }

  return {
    client,
    account: new Account(client),
  };
}
