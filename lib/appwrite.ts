import { Client, Account, Functions } from 'appwrite';

const client = new Client();

// These values should be provided via environment variables at runtime
if (process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT) {
  client.setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT);
}
if (process.env.NEXT_PUBLIC_APPWRITE_PROJECT) {
  client.setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT);
}

const account = new Account(client);
const functions = new Functions(client);

export { client, account, functions };
