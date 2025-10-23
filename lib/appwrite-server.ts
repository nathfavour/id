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

  let sessionValue: string | null = null;

  // Try to get session cookie from Request headers first (for API routes)
  if (req) {
    const cookieHeader = req.headers.get('cookie');
    if (cookieHeader) {
      const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT;
      const sessionCookieName = `a_session_${projectId}`;
      const cookies = cookieHeader.split('; ');
      for (const cookie of cookies) {
        const [name, value] = cookie.split('=');
        if (name === sessionCookieName) {
          sessionValue = decodeURIComponent(value);
          break;
        }
      }
    }
  }

  // Fallback to cookies() function (for server components)
  if (!sessionValue) {
    try {
      const cookieStore = cookies();
      const sessionCookie = cookieStore.get(`a_session_${process.env.NEXT_PUBLIC_APPWRITE_PROJECT}`);
      if (sessionCookie?.value) {
        sessionValue = sessionCookie.value;
      }
    } catch {
      // cookies() can throw in certain contexts
    }
  }

  if (sessionValue) {
    client.setSession(sessionValue);
  }

  return {
    client,
    account: new Account(client),
  };
}
