/**
 * Cryptographic Security Vault for Tharun Operative Credentials
 * Provides SHA-256 salted password hashing and secure client-side persistence
 * Supports individual voice page personas and custom HUD themes for each person.
 */
import { HudThemeType } from '../types';

export interface VaultOperative {
  uid: string;
  email: string;
  displayName: string;
  passwordHash: string;
  salt: string;
  securityClearance: 'GUEST' | 'OPERATOR' | 'THARUN_CLEARANCE_LVL_7' | 'STARK_CLEARANCE_LVL_7' | 'EXECUTIVE_CLEARANCE_LVL_7';
  createdAt: string;
  lastLogin: string;
  preferredCallsign: string;
  preferredVoiceId?: string;
  hudTheme?: HudThemeType;
  customAccentColor?: string;
}

const VAULT_STORAGE_KEY = 'tharun_user_vault_v1';
const LEGACY_STORAGE_KEY = 'stark_operative_vault_v1';
const VAULT_SESSION_KEY = 'tharun_user_session_v1';
const LEGACY_SESSION_KEY = 'stark_active_session_v1';

async function sha256(str: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(str);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

function generateSalt(): string {
  const arr = new Uint8Array(16);
  crypto.getRandomValues(arr);
  return Array.from(arr, (b) => b.toString(16).padStart(2, '0')).join('');
}

export function getAllVaultOperatives(): Record<string, VaultOperative> {
  try {
    const raw = localStorage.getItem(VAULT_STORAGE_KEY) || localStorage.getItem(LEGACY_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function saveVaultOperative(operative: VaultOperative): void {
  try {
    const all = getAllVaultOperatives();
    all[operative.email.toLowerCase()] = operative;
    localStorage.setItem(VAULT_STORAGE_KEY, JSON.stringify(all));
  } catch (err) {
    console.error('Failed to save operative to vault:', err);
  }
}

export function getActiveVaultSession(): VaultOperative | null {
  try {
    const raw = localStorage.getItem(VAULT_SESSION_KEY) || localStorage.getItem(LEGACY_SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setActiveVaultSession(op: VaultOperative | null): void {
  try {
    if (op) {
      localStorage.setItem(VAULT_SESSION_KEY, JSON.stringify(op));
    } else {
      localStorage.removeItem(VAULT_SESSION_KEY);
    }
  } catch (err) {
    console.error('Failed to set active vault session:', err);
  }
}

export async function registerVaultOperative(
  name: string,
  email: string,
  pass: string,
  preferredVoiceId?: string,
  hudTheme?: HudThemeType
): Promise<VaultOperative> {
  const cleanEmail = email.trim().toLowerCase();
  const all = getAllVaultOperatives();

  if (all[cleanEmail]) {
    throw new Error('This email is already registered in the database. Please log in.');
  }

  const salt = generateSalt();
  const passwordHash = await sha256(pass + ':' + salt);
  const uid = 'user-op-' + (await sha256(cleanEmail)).slice(0, 16);

  const operative: VaultOperative = {
    uid,
    email: cleanEmail,
    displayName: name.trim(),
    passwordHash,
    salt,
    securityClearance: 'OPERATOR',
    createdAt: new Date().toISOString(),
    lastLogin: new Date().toISOString(),
    preferredCallsign: name.trim().split(' ')[0] || name.trim(),
    preferredVoiceId: preferredVoiceId || 'puck',
    hudTheme: hudTheme || 'cyan',
  };

  saveVaultOperative(operative);
  setActiveVaultSession(operative);
  return operative;
}

export async function verifyVaultOperative(
  email: string,
  pass: string
): Promise<VaultOperative> {
  const cleanEmail = email.trim().toLowerCase();
  const all = getAllVaultOperatives();
  const found = all[cleanEmail];

  if (!found) {
    throw new Error('Access denied: No operative account found for this email. Please register first.');
  }

  const calculatedHash = await sha256(pass + ':' + found.salt);
  if (calculatedHash !== found.passwordHash) {
    throw new Error('Access denied: Incorrect security password.');
  }

  found.lastLogin = new Date().toISOString();
  saveVaultOperative(found);
  setActiveVaultSession(found);
  return found;
}
