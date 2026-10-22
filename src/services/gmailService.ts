/**
 * J.A.R.V.I.S. Tactical Gmail Automation Service
 * Direct client-side integration using authorized Google Workspace OAuth access tokens.
 */

export interface GmailMessageSummary {
  id: string;
  threadId: string;
  snippet: string;
  subject: string;
  from: string;
  to: string;
  date: string;
  timestamp: number;
  isUnread: boolean;
  labels: string[];
}

export interface SendEmailPayload {
  to: string;
  subject: string;
  body: string;
}

export interface EmailAutomationTemplate {
  id: string;
  name: string;
  description: string;
  category: 'tactical' | 'business' | 'alert' | 'status';
  defaultSubject: string;
  defaultBody: string;
}

export const EMAIL_AUTOMATION_TEMPLATES: EmailAutomationTemplate[] = [
  {
    id: 'tmpl-status-green',
    name: 'Operative Status Report (Green)',
    description: 'Dispatches a high-priority system status and operations summary.',
    category: 'status',
    defaultSubject: '[EXECUTIVE DISPATCH] Operations & System Status Report - All Systems Nominal',
    defaultBody: `Good day,\n\nAll J.A.R.V.I.S. neural telemetry nodes, workspace automations, and system services are functioning at 99.4% nominal output. No security anomalies or service interruptions have been detected.\n\nChronometer synchronization: Verified\nLocation telemetry: Locked\nDiagnostics: Zero faults\n\nBest regards,\nExecutive AI Assistant Suite`,
  },
  {
    id: 'tmpl-meeting-brief',
    name: 'Executive Mission Briefing',
    description: 'Coordinates an upcoming strategy sync with key stakeholders.',
    category: 'business',
    defaultSubject: 'Strategy Sync & Tactical Mission Briefing Request',
    defaultBody: `Greetings,\n\nI would like to schedule a tactical coordination sync to review current strategic directives and engineering milestones. Please let me know your immediate availability.\n\nAgenda:\n1. Core Architecture Review\n2. Real-Time Telemetry & Automation Integration\n3. Next Milestone Deployment\n\nBest regards,\nTharun Command`,
  },
  {
    id: 'tmpl-urgent-alert',
    name: 'Emergency Directive & Alert',
    description: 'High-priority alert broadcast requiring immediate operative response.',
    category: 'alert',
    defaultSubject: '⚠️ URGENT: High-Priority Operational Alert - Action Required',
    defaultBody: `ATTENTION REQUIRED,\n\nAn urgent priority notice has been dispatched from Tharun Command. Please review the attached tactical parameters and acknowledge receipt immediately.\n\nPriority Level: ALPHA-1\nTime of Dispatch: ${new Date().toLocaleString()}\nAction Required: Immediate acknowledgment and operational standby.\n\nTharun OS J.A.R.V.I.S. Relay`,
  },
  {
    id: 'tmpl-meeting-recap',
    name: 'Mission Debrief & Action Items',
    description: 'Summarizes key decisions and distributes assigned action items.',
    category: 'tactical',
    defaultSubject: 'Mission Debrief - Action Items & Decisions Logged',
    defaultBody: `Hello Team,\n\nThank you for today's tactical session. Below are the key takeaways and designated action items:\n\n- Milestone 1: Automated communication channels online\n- Milestone 2: WhatsApp & Gmail automation protocols verified\n- Milestone 3: Telemetry matrix locked\n\nPlease reach out if any adjustments are required.\n\nWarm regards,\nTharun`,
  },
];

/**
 * Encode an RFC 2822 email message into a URL-safe Base64 string for the Gmail API.
 */
function encodeEmailRaw(to: string, subject: string, bodyText: string): string {
  // UTF-8 base64 encoding for subject to support emojis and international character sets
  const encodedSubject = `=?utf-8?B?${btoa(unescape(encodeURIComponent(subject)))}?=`;
  const messageParts = [
    `To: ${to}`,
    `Subject: ${encodedSubject}`,
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset=UTF-8',
    'Content-Transfer-Encoding: 7bit',
    '',
    bodyText,
  ];

  const fullMessage = messageParts.join('\r\n');

  // Convert to URL-safe base64
  return btoa(unescape(encodeURIComponent(fullMessage)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

/**
 * Fetch recent emails from the authenticated user's Gmail inbox.
 */
export async function fetchRecentGmailMessages(
  accessToken: string,
  query: string = '',
  maxResults: number = 6
): Promise<GmailMessageSummary[]> {
  const queryParam = query ? `&q=${encodeURIComponent(query)}` : '';
  const listUrl = `https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=${maxResults}${queryParam}`;

  const listResponse = await fetch(listUrl, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: 'application/json',
    },
  });

  if (!listResponse.ok) {
    const errorData = await listResponse.json().catch(() => ({}));
    throw new Error(
      errorData?.error?.message ||
        `Gmail API request failed with status ${listResponse.status}`
    );
  }

  const listData = await listResponse.json();
  const rawList: { id: string; threadId: string }[] = listData.messages || [];

  if (rawList.length === 0) {
    return [];
  }

  // Fetch metadata details for each message in parallel
  const detailsPromises = rawList.map(async (item) => {
    try {
      const detailUrl = `https://gmail.googleapis.com/gmail/v1/users/me/messages/${item.id}?format=metadata&metadataHeaders=Subject&metadataHeaders=From&metadataHeaders=To&metadataHeaders=Date`;
      const detailRes = await fetch(detailUrl, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: 'application/json',
        },
      });

      if (!detailRes.ok) return null;
      const data = await detailRes.json();

      const headers: { name: string; value: string }[] = data.payload?.headers || [];
      const getHeader = (name: string) =>
        headers.find((h) => h.name.toLowerCase() === name.toLowerCase())?.value || '';

      const subject = getHeader('Subject') || '(No Subject)';
      const from = getHeader('From') || 'Unknown Sender';
      const to = getHeader('To') || 'me';
      const dateStr = getHeader('Date') || '';
      const timestamp = data.internalDate ? parseInt(data.internalDate, 10) : Date.now();
      const labels: string[] = data.labelIds || [];
      const isUnread = labels.includes('UNREAD');

      return {
        id: data.id,
        threadId: data.threadId,
        snippet: data.snippet || '',
        subject,
        from,
        to,
        date: dateStr || new Date(timestamp).toLocaleString(),
        timestamp,
        isUnread,
        labels,
      } as GmailMessageSummary;
    } catch {
      return null;
    }
  });

  const resolved = await Promise.all(detailsPromises);
  return resolved.filter((m): m is GmailMessageSummary => m !== null);
}

/**
 * Transmit an email using Gmail API.
 * CRITICAL: Must be preceded by explicit user confirmation modal in the UI!
 */
export async function sendGmailMessage(
  accessToken: string,
  to: string,
  subject: string,
  body: string
): Promise<{ id: string; threadId: string }> {
  const raw = encodeEmailRaw(to, subject, body);

  const response = await fetch(
    'https://gmail.googleapis.com/gmail/v1/users/me/messages/send',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ raw }),
    }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData?.error?.message ||
        `Failed to send email via Gmail (Status: ${response.status})`
    );
  }

  return await response.json();
}

/**
 * Save an email as a draft in Gmail.
 */
export async function createGmailDraft(
  accessToken: string,
  to: string,
  subject: string,
  body: string
): Promise<{ id: string; message: any }> {
  const raw = encodeEmailRaw(to, subject, body);

  const response = await fetch(
    'https://gmail.googleapis.com/gmail/v1/users/me/drafts',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: { raw },
      }),
    }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData?.error?.message ||
        `Failed to save draft in Gmail (Status: ${response.status})`
    );
  }

  return await response.json();
}
