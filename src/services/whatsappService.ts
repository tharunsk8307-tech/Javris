/**
 * J.A.R.V.I.S. WhatsApp Automation & Deep-Link Dispatch Engine
 * Provides pre-formatted templates, contact address book, and one-click dispatch links.
 */

export interface WhatsAppContact {
  id: string;
  name: string;
  phone: string;
  role: string;
  notes?: string;
}

export interface WhatsAppTemplate {
  id: string;
  title: string;
  category: 'tactical' | 'status' | 'location' | 'emergency';
  body: string;
}

export const DEFAULT_WHATSAPP_CONTACTS: WhatsAppContact[] = [
  {
    id: 'c-1',
    name: 'Sir Tharun (Personal Comms)',
    phone: '+919876543210',
    role: 'Supreme Commander',
    notes: 'Primary executive communication node',
  },
  {
    id: 'c-2',
    name: 'Tactical Operations Team',
    phone: '+14155552671',
    role: 'Engineering & Ops',
    notes: 'Ground operations and server infrastructure',
  },
  {
    id: 'c-3',
    name: 'Emergency Response Node',
    phone: '+18005550199',
    role: 'Emergency Protocol',
    notes: 'High-priority alert dispatch channel',
  },
];

export const WHATSAPP_TEMPLATES: WhatsAppTemplate[] = [
  {
    id: 'wa-tmpl-status',
    title: '🟢 System Status Nominal',
    category: 'status',
    body: 'Sir, J.A.R.V.I.S. Mark VII reports all Tharun OS subsystems, neural voice matrices, and hardware nodes are at 99.4% nominal power. Standing by for next directive.',
  },
  {
    id: 'wa-tmpl-location',
    title: '📍 Tactical Location Ping',
    category: 'location',
    body: 'Tactical location telemetry update dispatched from J.A.R.V.I.S. Command: GPS fix locked. Review coordinates in attached report.',
  },
  {
    id: 'wa-tmpl-meeting',
    title: '📅 Strategy Sync Confirmation',
    category: 'tactical',
    body: 'Greetings. Confirming our upcoming strategy and tactical engineering session. Looking forward to connecting shortly.',
  },
  {
    id: 'wa-tmpl-urgent',
    title: '🚨 Priority Alpha Notice',
    category: 'emergency',
    body: '⚠️ HIGH-PRIORITY ALERT: Operational review required immediately by Tharun Command. Please confirm receipt upon viewing.',
  },
  {
    id: 'wa-tmpl-checkin',
    title: '⚡ Quick Operative Check-In',
    category: 'status',
    body: 'Operative check-in: On schedule, all deployment benchmarks on track. Next update at scheduled interval.',
  },
];

const STORAGE_KEY_CONTACTS = 'tharun_whatsapp_contacts_v1';

export function getStoredWhatsAppContacts(): WhatsAppContact[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_CONTACTS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {
    // fallback
  }
  return DEFAULT_WHATSAPP_CONTACTS;
}

export function saveStoredWhatsAppContacts(contacts: WhatsAppContact[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_CONTACTS, JSON.stringify(contacts));
  } catch {
    // ignore
  }
}

/**
 * Sanitize and format a phone number for WhatsApp deep-links.
 * Strips out spaces, dashes, brackets, and any non-numeric symbols except leading digits.
 */
export function sanitizeWhatsAppPhone(phone: string): string {
  if (!phone) return '';
  // Remove non-digit characters
  const digitsOnly = phone.replace(/\D/g, '');
  return digitsOnly;
}

/**
 * Generate a direct WhatsApp Universal Link (works on Mobile app, Desktop, and WhatsApp Web).
 */
export function buildWhatsAppUrl(phone: string, text: string): string {
  const sanitized = sanitizeWhatsAppPhone(phone);
  const encodedText = encodeURIComponent(text);
  if (sanitized) {
    return `https://wa.me/${sanitized}?text=${encodedText}`;
  }
  // Generic dispatch with pre-filled message (user picks contact on WhatsApp)
  return `https://wa.me/?text=${encodedText}`;
}

/**
 * Generate WhatsApp Web link explicitly.
 */
export function buildWhatsAppWebUrl(phone: string, text: string): string {
  const sanitized = sanitizeWhatsAppPhone(phone);
  const encodedText = encodeURIComponent(text);
  if (sanitized) {
    return `https://web.whatsapp.com/send?phone=${sanitized}&text=${encodedText}`;
  }
  return `https://web.whatsapp.com/send?text=${encodedText}`;
}

/**
 * Trigger direct dispatch in browser.
 */
export function executeWhatsAppDispatch(phone: string, text: string): void {
  const url = buildWhatsAppUrl(phone, text);
  const link = document.createElement('a');
  link.href = url;
  link.target = '_blank';
  link.rel = 'noopener noreferrer';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
