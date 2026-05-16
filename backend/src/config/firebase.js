/**
 * Firebase Admin SDK initialisation.
 *
 * Credential priority:
 *   1. FIREBASE_SERVICE_ACCOUNT_BASE64
 *   2. FIREBASE_SERVICE_ACCOUNT_JSON
 *   3. backend/serviceAccount.json for local development
 *   4. Application Default Credentials in managed hosting
 */
import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import path from 'path';
import admin from 'firebase-admin';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
const serviceAccountPath = path.join(__dirname, '..', '..', 'serviceAccount.json');

function normalizeServiceAccount(account) {
  if (!account) return account;
  return {
    ...account,
    private_key: account.private_key?.replace(/\\n/g, '\n'),
  };
}

function loadServiceAccount() {
  if (process.env.FIREBASE_SERVICE_ACCOUNT_BASE64) {
    const decoded = Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_BASE64, 'base64').toString('utf8');
    return normalizeServiceAccount(JSON.parse(decoded));
  }

  if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
    return normalizeServiceAccount(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON));
  }

  try {
    return normalizeServiceAccount(require(serviceAccountPath));
  } catch {
    return null;
  }
}

if (!admin.apps.length) {
  const serviceAccount = loadServiceAccount();
  const projectId = process.env.FIREBASE_PROJECT_ID || serviceAccount?.project_id;

  admin.initializeApp({
    credential: serviceAccount
      ? admin.credential.cert(serviceAccount)
      : admin.credential.applicationDefault(),
    ...(projectId ? { projectId } : {}),
  });
}

export const db = admin.firestore();
export const adminAuth = admin.auth();
export default admin;
