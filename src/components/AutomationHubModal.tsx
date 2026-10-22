import React, { useState, useEffect } from 'react';
import {
  Mail,
  MessageSquare,
  Send,
  FileEdit,
  RefreshCw,
  Search,
  CheckCircle2,
  AlertTriangle,
  UserPlus,
  Trash2,
  ExternalLink,
  ShieldAlert,
  Sparkles,
  X,
  Phone,
  User,
  MapPin,
  Clock,
  Radio,
  Check,
  Share2,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import {
  GmailMessageSummary,
  fetchRecentGmailMessages,
  sendGmailMessage,
  createGmailDraft,
  EMAIL_AUTOMATION_TEMPLATES,
  EmailAutomationTemplate,
} from '../services/gmailService';
import {
  WhatsAppContact,
  WhatsAppTemplate,
  WHATSAPP_TEMPLATES,
  getStoredWhatsAppContacts,
  saveStoredWhatsAppContacts,
  buildWhatsAppUrl,
  buildWhatsAppWebUrl,
  executeWhatsAppDispatch,
} from '../services/whatsappService';
import { TacticalLocationData, formatCoordinates } from '../utils/tacticalTimeLocation';

interface AutomationHubModalProps {
  isOpen: boolean;
  onClose: () => void;
  locationData?: TacticalLocationData;
  effectiveAccentColor?: string;
  initialTab?: 'gmail' | 'whatsapp' | 'broadcast';
  initialEmailTo?: string;
  initialEmailSubject?: string;
  initialEmailBody?: string;
  initialWhatsAppPhone?: string;
  initialWhatsAppText?: string;
}

export const AutomationHubModal: React.FC<AutomationHubModalProps> = ({
  isOpen,
  onClose,
  locationData,
  effectiveAccentColor = '#06b6d4',
  initialTab = 'gmail',
  initialEmailTo = '',
  initialEmailSubject = '',
  initialEmailBody = '',
  initialWhatsAppPhone = '',
  initialWhatsAppText = '',
}) => {
  const { currentUser, accessToken, requestGmailAuth } = useAuth();

  const [activeTab, setActiveTab] = useState<'gmail' | 'whatsapp' | 'broadcast'>(initialTab);

  // Sync initial tab when modal opens
  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
      if (initialEmailTo) setEmailTo(initialEmailTo);
      if (initialEmailSubject) setEmailSubject(initialEmailSubject);
      if (initialEmailBody) setEmailBody(initialEmailBody);
      if (initialWhatsAppPhone) setWaPhone(initialWhatsAppPhone);
      if (initialWhatsAppText) setWaMessage(initialWhatsAppText);
    }
  }, [isOpen, initialTab, initialEmailTo, initialEmailSubject, initialEmailBody, initialWhatsAppPhone, initialWhatsAppText]);

  // ===================== GMAIL STATE =====================
  const [emails, setEmails] = useState<GmailMessageSummary[]>([]);
  const [isLoadingEmails, setIsLoadingEmails] = useState(false);
  const [emailSearchQuery, setEmailSearchQuery] = useState('');
  const [emailTo, setEmailTo] = useState(initialEmailTo);
  const [emailSubject, setEmailSubject] = useState(initialEmailSubject);
  const [emailBody, setEmailBody] = useState(initialEmailBody);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [emailStatusMsg, setEmailStatusMsg] = useState<{ text: string; isError: boolean } | null>(null);

  // Mandatory Confirmation Dialog State for Gmail Send (Workspace Integration Requirement)
  const [showSendConfirmation, setShowSendConfirmation] = useState(false);

  // ===================== WHATSAPP STATE =====================
  const [contacts, setContacts] = useState<WhatsAppContact[]>(getStoredWhatsAppContacts);
  const [selectedContactId, setSelectedContactId] = useState<string>('');
  const [waPhone, setWaPhone] = useState(initialWhatsAppPhone);
  const [waMessage, setWaMessage] = useState(
    initialWhatsAppText || 'Greetings Sir. J.A.R.V.I.S. reports all operative communications and telemetry systems are online.'
  );
  const [newContactName, setNewContactName] = useState('');
  const [newContactPhone, setNewContactPhone] = useState('');
  const [newContactRole, setNewContactRole] = useState('Operative');
  const [isAddingContact, setIsAddingContact] = useState(false);
  const [waDispatchedToast, setWaDispatchedToast] = useState(false);

  // ===================== BROADCAST STATE =====================
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [isBroadcasting, setIsBroadcasting] = useState(false);

  // Load Gmail messages when tab is active and token exists
  useEffect(() => {
    if (isOpen && activeTab === 'gmail' && accessToken) {
      loadEmails();
    }
  }, [isOpen, activeTab, accessToken]);

  const loadEmails = async (search?: string) => {
    if (!accessToken) return;
    setIsLoadingEmails(true);
    setEmailStatusMsg(null);
    try {
      const fetched = await fetchRecentGmailMessages(accessToken, search !== undefined ? search : emailSearchQuery, 7);
      setEmailEmailsState(fetched);
    } catch (err: any) {
      console.warn('Failed to load Gmail messages:', err);
      setEmailStatusMsg({
        text: err.message || 'Failed to connect to Gmail API. Please verify account permissions.',
        isError: true,
      });
    } finally {
      setIsLoadingEmails(false);
    }
  };

  const setEmailEmailsState = (items: GmailMessageSummary[]) => {
    setEmails(items);
  };

  const handleApplyEmailTemplate = (template: EmailAutomationTemplate) => {
    setEmailSubject(template.defaultSubject);
    setEmailBody(template.defaultBody);
  };

  // User initiated send -> Opens mandatory confirmation dialog
  const handleInitiateEmailSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailTo.trim() || !emailSubject.trim() || !emailBody.trim()) {
      setEmailStatusMsg({ text: 'Please provide recipient, subject, and message content.', isError: true });
      return;
    }
    setShowSendConfirmation(true);
  };

  // User confirmed the destructive send in the mandatory dialog
  const handleConfirmEmailSend = async () => {
    setShowSendConfirmation(false);
    if (!accessToken) {
      setEmailStatusMsg({ text: 'Google Account OAuth access token is missing. Please sign in.', isError: true });
      return;
    }

    setIsSendingEmail(true);
    setEmailStatusMsg(null);

    try {
      await sendGmailMessage(accessToken, emailTo.trim(), emailSubject.trim(), emailBody.trim());
      setEmailStatusMsg({ text: `Email successfully transmitted to ${emailTo}!`, isError: false });
      setEmailTo('');
      setEmailSubject('');
      setEmailBody('');
      // Reload inbox to reflect sent message
      loadEmails();
    } catch (err: any) {
      setEmailStatusMsg({
        text: err.message || 'Failed to transmit email. Check Google Workspace permissions.',
        isError: true,
      });
    } finally {
      setIsSendingEmail(false);
    }
  };

  const handleSaveDraft = async () => {
    if (!accessToken) {
      setEmailStatusMsg({ text: 'Google Account OAuth access token is required.', isError: true });
      return;
    }
    if (!emailTo.trim() && !emailSubject.trim()) {
      setEmailStatusMsg({ text: 'Specify at least a recipient or subject to save draft.', isError: true });
      return;
    }

    setIsSendingEmail(true);
    setEmailStatusMsg(null);
    try {
      await createGmailDraft(accessToken, emailTo.trim(), emailSubject.trim(), emailBody.trim());
      setEmailStatusMsg({ text: 'Draft saved in your Google Workspace Gmail account!', isError: false });
    } catch (err: any) {
      setEmailStatusMsg({ text: err.message || 'Failed to save draft in Gmail.', isError: true });
    } finally {
      setIsSendingEmail(false);
    }
  };

  // AI Assistant Email Polish / Generation
  const handleGenerateAiEmail = async () => {
    if (!emailSubject && !emailBody) {
      setEmailSubject('Tactical Briefing & Systems Update');
    }
    const prompt = emailBody || emailSubject || 'Daily executive status report';
    setEmailStatusMsg({ text: 'J.A.R.V.I.S. is synthesizing tactical email draft...', isError: false });

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [
            {
              role: 'user',
              content: `Write an articulate, professional email draft on the topic: "${prompt}". Provide only the email body text without pleasantry filler, suitable for immediate transmission from Tharun Command.`,
            },
          ],
          modelChoice: 'fast',
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.text) {
          setEmailBody(data.text);
          setEmailStatusMsg({ text: 'AI email draft synthesized successfully!', isError: false });
        }
      }
    } catch {
      setEmailStatusMsg({ text: 'AI drafting service unavailable. Proceeding with standard templates.', isError: false });
    }
  };

  // ===================== WHATSAPP HANDLERS =====================
  const handleSelectContact = (contactId: string) => {
    setSelectedContactId(contactId);
    const found = contacts.find((c) => c.id === contactId);
    if (found) {
      setWaPhone(found.phone);
    }
  };

  const handleApplyWaTemplate = (tmpl: WhatsAppTemplate) => {
    setWaMessage(tmpl.body);
  };

  const handleAttachLocationToWa = () => {
    if (!locationData) return;
    const coords = formatCoordinates(locationData.latitude, locationData.longitude, 'DD');
    const locText = `\n\n📍 Tactical Location Fix: ${coords}\nAddress: ${locationData.city || 'Sector'}, ${locationData.country || ''}\nMap: https://www.google.com/maps?q=${locationData.latitude},${locationData.longitude}`;
    setWaMessage((prev) => prev + locText);
  };

  const handleDispatchWhatsApp = (mode: 'direct' | 'web') => {
    if (!waMessage.trim()) return;

    if (mode === 'direct') {
      executeWhatsAppDispatch(waPhone, waMessage);
    } else {
      const url = buildWhatsAppWebUrl(waPhone, waMessage);
      window.open(url, '_blank', 'noopener,noreferrer');
    }

    setWaDispatchedToast(true);
    setTimeout(() => setWaDispatchedToast(false), 4000);
  };

  const handleAddNewContact = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContactName.trim() || !newContactPhone.trim()) return;

    const newContact: WhatsAppContact = {
      id: 'c-' + Date.now(),
      name: newContactName.trim(),
      phone: newContactPhone.trim(),
      role: newContactRole.trim(),
    };

    const updated = [newContact, ...contacts];
    setContacts(updated);
    saveStoredWhatsAppContacts(updated);
    setNewContactName('');
    setNewContactPhone('');
    setIsAddingContact(false);
  };

  const handleDeleteContact = (id: string) => {
    const updated = contacts.filter((c) => c.id !== id);
    setContacts(updated);
    saveStoredWhatsAppContacts(updated);
    if (selectedContactId === id) {
      setSelectedContactId('');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-5xl max-h-[92vh] flex flex-col rounded-2xl bg-slate-950 border border-cyan-500/50 shadow-[0_0_50px_rgba(6,182,212,0.25)] overflow-hidden text-slate-100">
        
        {/* Top Header */}
        <div className="px-5 py-3.5 border-b border-cyan-900/60 bg-slate-900/80 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center shadow-lg border"
              style={{
                backgroundColor: `${effectiveAccentColor}20`,
                borderColor: `${effectiveAccentColor}60`,
              }}
            >
              <Radio className="w-5 h-5 animate-pulse" style={{ color: effectiveAccentColor }} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="hud-font font-bold text-base tracking-wider text-slate-100">
                  TACTICAL COMMUNICATIONS & AUTOMATION HUB
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-950 border border-cyan-600/60 text-cyan-300 font-bold">
                  GMAIL & WHATSAPP
                </span>
              </div>
              <p className="text-[11px] font-mono text-slate-400">
                Authorized Google Workspace Email Dispatcher & WhatsApp Direct Universal Relay
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg border border-slate-700 hover:border-rose-500/80 hover:bg-rose-950/40 text-slate-400 hover:text-rose-300 transition-colors cursor-pointer"
            title="Close Communications Hub"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="px-5 pt-3 border-b border-slate-800 bg-slate-950 flex items-center gap-2 shrink-0 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('gmail')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-t-lg font-mono text-xs font-bold transition-all border-t border-x cursor-pointer ${
              activeTab === 'gmail'
                ? 'bg-slate-900 border-cyan-500/70 text-cyan-300 shadow-[0_-2px_10px_rgba(6,182,212,0.2)]'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
            }`}
          >
            <Mail className="w-4 h-4 text-rose-400" />
            <span>GMAIL AUTOMATION</span>
            {accessToken && (
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" title="Google OAuth Active" />
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('whatsapp')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-t-lg font-mono text-xs font-bold transition-all border-t border-x cursor-pointer ${
              activeTab === 'whatsapp'
                ? 'bg-slate-900 border-emerald-500/70 text-emerald-300 shadow-[0_-2px_10px_rgba(16,185,129,0.2)]'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
            }`}
          >
            <MessageSquare className="w-4 h-4 text-emerald-400" />
            <span>WHATSAPP AUTOMATION</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('broadcast')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-t-lg font-mono text-xs font-bold transition-all border-t border-x cursor-pointer ${
              activeTab === 'broadcast'
                ? 'bg-slate-900 border-amber-500/70 text-amber-300 shadow-[0_-2px_10px_rgba(245,158,11,0.2)]'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
            }`}
          >
            <Share2 className="w-4 h-4 text-amber-400" />
            <span>UNIFIED BROADCAST</span>
          </button>
        </div>

        {/* Tab Content Container */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">

          {/* ===================== TAB 1: GMAIL AUTOMATION ===================== */}
          {activeTab === 'gmail' && (
            <div className="space-y-6">
              
              {/* OAuth Status Card */}
              {!accessToken ? (
                <div className="p-4 rounded-xl border border-amber-500/60 bg-amber-950/25 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-lg">
                  <div className="flex items-start gap-3">
                    <ShieldAlert className="w-6 h-6 text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-bold text-amber-200 hud-font">
                        Google Workspace Gmail Authorization Required
                      </h4>
                      <p className="text-xs text-amber-300/80 font-mono mt-0.5">
                        Connect your authorized Google Account to read inboxes, compose drafts, and trigger automated email transmissions directly from J.A.R.V.I.S.
                      </p>
                    </div>
                  </div>

                  {/* Standard Sign in with Google Button as prescribed by Workspace Integration */}
                  <button
                    type="button"
                    onClick={() => requestGmailAuth()}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-white hover:bg-slate-100 text-slate-800 font-medium text-xs shadow-md transition-all shrink-0 cursor-pointer"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 48 48">
                      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                    </svg>
                    <span>Connect Google Account</span>
                  </button>
                </div>
              ) : (
                <div className="p-3.5 rounded-xl border border-emerald-500/50 bg-emerald-950/20 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    <div>
                      <span className="text-xs font-bold font-mono text-emerald-300">
                        GOOGLE WORKSPACE GMAIL UPLINK ACTIVE
                      </span>
                      <p className="text-[11px] text-slate-400 font-mono">
                        Connected as: {currentUser?.email || 'Authorized Operative'} • Permissions: Read, Compose, Send
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => loadEmails()}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-emerald-600/60 bg-emerald-950/40 text-emerald-300 hover:bg-emerald-900/40 text-xs font-mono transition-colors cursor-pointer"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isLoadingEmails ? 'animate-spin' : ''}`} />
                    <span>REFRESH INBOX</span>
                  </button>
                </div>
              )}

              {/* Status Message Notification */}
              {emailStatusMsg && (
                <div
                  className={`p-3 rounded-lg text-xs font-mono border ${
                    emailStatusMsg.isError
                      ? 'border-rose-500 bg-rose-950/50 text-rose-200'
                      : 'border-emerald-500 bg-emerald-950/50 text-emerald-200'
                  }`}
                >
                  {emailStatusMsg.text}
                </div>
              )}

              {/* Grid: Live Inbox Reader & Automated Email Composer */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* Left (5 cols): Live Inbox Transmissions */}
                <div className="lg:col-span-5 flex flex-col rounded-xl border border-slate-800 bg-slate-900/60 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-cyan-400" />
                      <span className="font-bold text-xs hud-font text-slate-200">
                        RECENT GMAIL TRANSMISSIONS
                      </span>
                    </div>
                    {emails.length > 0 && (
                      <span className="text-[10px] font-mono text-slate-400">
                        {emails.length} Loaded
                      </span>
                    )}
                  </div>

                  {/* Search Inbox */}
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search query (e.g. from:support or is:unread)..."
                      value={emailSearchQuery}
                      onChange={(e) => setEmailSearchQuery(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') loadEmails(emailSearchQuery);
                      }}
                      className="w-full pl-9 pr-3 py-1.5 text-xs font-mono bg-slate-950 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-cyan-500"
                    />
                  </div>

                  {/* Email List View */}
                  <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
                    {isLoadingEmails ? (
                      <div className="py-12 text-center text-xs font-mono text-slate-400 flex flex-col items-center justify-center gap-2">
                        <RefreshCw className="w-5 h-5 text-cyan-400 animate-spin" />
                        <span>Querying Google Workspace Gmail telemetry...</span>
                      </div>
                    ) : emails.length === 0 ? (
                      <div className="py-12 text-center text-xs font-mono text-slate-400">
                        {accessToken
                          ? 'No emails found matching current query.'
                          : 'Connect Google Account above to inspect live inbox messages.'}
                      </div>
                    ) : (
                      emails.map((msg) => (
                        <div
                          key={msg.id}
                          className="p-3 rounded-lg border border-slate-800 bg-slate-950 hover:border-cyan-500/50 transition-all cursor-pointer group"
                          onClick={() => {
                            setEmailSubject(`Re: ${msg.subject.replace(/^Re:\s*/i, '')}`);
                            const fromAddress = msg.from.match(/<([^>]+)>/)?.[1] || msg.from;
                            setEmailTo(fromAddress);
                          }}
                          title="Click to auto-reply to this email"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <span className="text-xs font-bold text-slate-200 truncate group-hover:text-cyan-300">
                              {msg.subject}
                            </span>
                            {msg.isUnread && (
                              <span className="text-[9px] px-1.5 py-0.2 rounded bg-rose-950 text-rose-300 border border-rose-500/60 font-mono font-bold shrink-0">
                                UNREAD
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono truncate mt-0.5">
                            From: {msg.from}
                          </div>
                          <p className="text-[11px] text-slate-300 line-clamp-2 mt-1 font-sans">
                            {msg.snippet}
                          </p>
                          <div className="text-[9px] text-slate-400 font-mono mt-1 text-right">
                            {msg.date}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Right (7 cols): Automated Email Composer */}
                <div className="lg:col-span-7 flex flex-col rounded-xl border border-slate-800 bg-slate-900/60 p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Send className="w-4 h-4 text-emerald-400" />
                      <span className="font-bold text-xs hud-font text-slate-200">
                        AUTOMATED EMAIL COMPOSER & DISPATCHER
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={handleGenerateAiEmail}
                      className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg border border-purple-500/50 bg-purple-950/40 text-purple-300 hover:bg-purple-900/50 font-mono transition-colors cursor-pointer"
                      title="Generate crisp, tactical email copy with Gemini AI"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-purple-400 animate-pulse" />
                      <span>AI AUTO-DRAFT</span>
                    </button>
                  </div>

                  {/* Quick Tactical Templates Selector */}
                  <div>
                    <label className="text-[10px] font-mono text-slate-400 block mb-1">
                      RAPID AUTOMATION TEMPLATES:
                    </label>
                    <div className="flex flex-wrap gap-1.5">
                      {EMAIL_AUTOMATION_TEMPLATES.map((tmpl) => (
                        <button
                          key={tmpl.id}
                          type="button"
                          onClick={() => handleApplyEmailTemplate(tmpl)}
                          className="px-2 py-1 rounded bg-slate-950 hover:bg-slate-800 border border-slate-700 text-[10px] font-mono text-slate-300 hover:text-cyan-300 transition-colors cursor-pointer"
                          title={tmpl.description}
                        >
                          {tmpl.name}
                        </button>
                      ))}
                    </div>
                  </div>

                  <form onSubmit={handleInitiateEmailSend} className="space-y-3">
                    <div>
                      <label className="text-[10px] font-mono text-slate-400 block mb-1">
                        RECIPIENT EMAIL ADDRESS:
                      </label>
                      <input
                        type="email"
                        required
                        placeholder="alex.turner@company.com or colleague@company.com"
                        value={emailTo}
                        onChange={(e) => setEmailTo(e.target.value)}
                        className="w-full px-3 py-2 text-xs font-mono bg-slate-950 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:border-cyan-500"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-mono text-slate-400 block mb-1">
                        SUBJECT LINE:
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Mission Status, Briefing, or Tactical Query..."
                        value={emailSubject}
                        onChange={(e) => setEmailSubject(e.target.value)}
                        className="w-full px-3 py-2 text-xs font-mono bg-slate-950 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:border-cyan-500 font-bold"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-mono text-slate-400 block mb-1">
                        MESSAGE BODY:
                      </label>
                      <textarea
                        rows={6}
                        required
                        placeholder="Draft your operational directives, updates, or briefing here..."
                        value={emailBody}
                        onChange={(e) => setEmailBody(e.target.value)}
                        className="w-full px-3 py-2 text-xs font-mono bg-slate-950 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:border-cyan-500 resize-none"
                      />
                    </div>

                    <div className="flex items-center justify-between pt-2">
                      <button
                        type="button"
                        onClick={handleSaveDraft}
                        disabled={isSendingEmail || !accessToken}
                        className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-slate-700 hover:border-slate-500 bg-slate-950 text-slate-300 text-xs font-mono transition-colors cursor-pointer disabled:opacity-50"
                        title="Save as draft in your Google Workspace Gmail"
                      >
                        <FileEdit className="w-3.5 h-3.5 text-cyan-400" />
                        <span>SAVE TO GMAIL DRAFTS</span>
                      </button>

                      <button
                        type="submit"
                        disabled={isSendingEmail || !accessToken}
                        className="flex items-center gap-2 px-5 py-2 rounded-lg bg-gradient-to-r from-cyan-500 to-cyan-400 hover:from-cyan-400 hover:to-cyan-300 text-slate-950 font-bold text-xs hud-font tracking-wider shadow-[0_0_20px_rgba(6,182,212,0.35)] transition-all cursor-pointer disabled:opacity-50"
                      >
                        <Send className="w-4 h-4 fill-slate-950" />
                        <span>TRANSMIT EMAIL</span>
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          )}

          {/* ===================== TAB 2: WHATSAPP AUTOMATION ===================== */}
          {activeTab === 'whatsapp' && (
            <div className="space-y-6">
              
              {/* WhatsApp Notice Banner */}
              <div className="p-3.5 rounded-xl border border-emerald-500/50 bg-emerald-950/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-lg">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-950/80 border border-emerald-500/60 flex items-center justify-center shrink-0">
                    <MessageSquare className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-emerald-200 hud-font tracking-wide">
                      WHATSAPP UNIVERSAL DISPATCH MATRIX
                    </h4>
                    <p className="text-[11px] text-slate-400 font-mono">
                      Deep-link and Web relay: Pre-formats messages, coordinates, and template broadcasts for one-click dispatch to WhatsApp.
                    </p>
                  </div>
                </div>

                {waDispatchedToast && (
                  <div className="px-3 py-1.5 rounded-lg bg-emerald-500 text-slate-950 font-bold text-xs font-mono flex items-center gap-1.5 animate-bounce">
                    <Check className="w-4 h-4" />
                    <span>WhatsApp Transmission Dispatched!</span>
                  </div>
                )}
              </div>

              {/* Grid: Contacts Directory & WhatsApp Composer */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* Left (5 cols): Saved Contacts & Phone Input */}
                <div className="lg:col-span-5 flex flex-col rounded-xl border border-slate-800 bg-slate-900/60 p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-emerald-400" />
                      <span className="font-bold text-xs hud-font text-slate-200">
                        SAVED CONTACTS DIRECTORY
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => setIsAddingContact(!isAddingContact)}
                      className="flex items-center gap-1 text-[10px] px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono cursor-pointer"
                    >
                      <UserPlus className="w-3 h-3 text-emerald-400" />
                      <span>{isAddingContact ? 'CANCEL' : 'ADD NEW'}</span>
                    </button>
                  </div>

                  {/* Add New Contact Form */}
                  {isAddingContact && (
                    <form onSubmit={handleAddNewContact} className="p-3 rounded-lg bg-slate-950 border border-emerald-500/40 space-y-2">
                      <input
                        type="text"
                        placeholder="Contact Name (e.g. Sarah Jenkins or Alex Turner)"
                        required
                        value={newContactName}
                        onChange={(e) => setNewContactName(e.target.value)}
                        className="w-full px-2.5 py-1.5 text-xs font-mono bg-slate-900 border border-slate-700 rounded text-slate-200"
                      />
                      <input
                        type="tel"
                        placeholder="Phone Number (+91..., +1...)"
                        required
                        value={newContactPhone}
                        onChange={(e) => setNewContactPhone(e.target.value)}
                        className="w-full px-2.5 py-1.5 text-xs font-mono bg-slate-900 border border-slate-700 rounded text-slate-200"
                      />
                      <input
                        type="text"
                        placeholder="Role / Tag (e.g. VIP, Operations, Family)"
                        value={newContactRole}
                        onChange={(e) => setNewContactRole(e.target.value)}
                        className="w-full px-2.5 py-1.5 text-xs font-mono bg-slate-900 border border-slate-700 rounded text-slate-200"
                      />
                      <button
                        type="submit"
                        className="w-full py-1.5 rounded bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs font-mono cursor-pointer"
                      >
                        SAVE OPERATIVE CONTACT
                      </button>
                    </form>
                  )}

                  {/* Contacts List */}
                  <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                    {contacts.map((contact) => (
                      <div
                        key={contact.id}
                        className={`p-2.5 rounded-lg border transition-all flex items-center justify-between cursor-pointer ${
                          selectedContactId === contact.id
                            ? 'bg-emerald-950/40 border-emerald-500 text-emerald-200'
                            : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                        }`}
                        onClick={() => handleSelectContact(contact.id)}
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-slate-800 border border-emerald-500/40 flex items-center justify-center font-bold text-xs text-emerald-400 font-mono">
                            {contact.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="text-xs font-bold font-sans flex items-center gap-1.5">
                              {contact.name}
                              <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 font-mono">
                                {contact.role}
                              </span>
                            </div>
                            <div className="text-[10px] font-mono text-emerald-400">
                              {contact.phone}
                            </div>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteContact(contact.id);
                          }}
                          className="p-1 text-slate-500 hover:text-rose-400 transition-colors"
                          title="Delete contact"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>

                  {/* Manual Phone Number Input */}
                  <div className="pt-2 border-t border-slate-800">
                    <label className="text-[10px] font-mono text-slate-400 block mb-1">
                      OR DIRECT PHONE NUMBER (WITH COUNTRY CODE):
                    </label>
                    <div className="relative">
                      <Phone className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                      <input
                        type="tel"
                        placeholder="e.g. +919876543210 or 14155552671"
                        value={waPhone}
                        onChange={(e) => setWaPhone(e.target.value)}
                        className="w-full pl-9 pr-3 py-1.5 text-xs font-mono bg-slate-950 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-emerald-500 font-bold"
                      />
                    </div>
                  </div>
                </div>

                {/* Right (7 cols): WhatsApp Message Composer & Dispatch */}
                <div className="lg:col-span-7 flex flex-col rounded-xl border border-slate-800 bg-slate-900/60 p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <MessageSquare className="w-4 h-4 text-emerald-400" />
                      <span className="font-bold text-xs hud-font text-slate-200">
                        WHATSAPP MESSAGE COMPOSER
                      </span>
                    </div>

                    {locationData && (
                      <button
                        type="button"
                        onClick={handleAttachLocationToWa}
                        className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg border border-rose-500/50 bg-rose-950/40 text-rose-300 hover:bg-rose-900/50 font-mono transition-colors cursor-pointer"
                        title="Attach real-time GPS coordinates and address into message"
                      >
                        <MapPin className="w-3.5 h-3.5 text-rose-400" />
                        <span>ATTACH GPS PING</span>
                      </button>
                    )}
                  </div>

                  {/* Quick WhatsApp Templates */}
                  <div>
                    <label className="text-[10px] font-mono text-slate-400 block mb-1">
                      TACTICAL PRE-SET MACROS:
                    </label>
                    <div className="flex flex-wrap gap-1.5">
                      {WHATSAPP_TEMPLATES.map((tmpl) => (
                        <button
                          key={tmpl.id}
                          type="button"
                          onClick={() => handleApplyWaTemplate(tmpl)}
                          className="px-2 py-1 rounded bg-slate-950 hover:bg-slate-800 border border-slate-700 text-[10px] font-mono text-slate-300 hover:text-emerald-300 transition-colors cursor-pointer"
                        >
                          {tmpl.title}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-mono text-slate-400 block mb-1">
                      WHATSAPP MESSAGE CONTENT:
                    </label>
                    <textarea
                      rows={6}
                      placeholder="Type your message to dispatch via WhatsApp..."
                      value={waMessage}
                      onChange={(e) => setWaMessage(e.target.value)}
                      className="w-full px-3 py-2 text-xs font-mono bg-slate-950 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:border-emerald-500 resize-none"
                    />
                  </div>

                  <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
                    <button
                      type="button"
                      onClick={() => handleDispatchWhatsApp('web')}
                      className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg border border-emerald-600/70 bg-emerald-950/40 hover:bg-emerald-900/40 text-emerald-300 text-xs font-mono transition-colors cursor-pointer"
                      title="Open in WhatsApp Web client"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>OPEN IN WHATSAPP WEB</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDispatchWhatsApp('direct')}
                      className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-bold text-xs hud-font tracking-wider shadow-[0_0_20px_rgba(16,185,129,0.35)] transition-all cursor-pointer"
                      title="Launch universal WhatsApp link (works on Mobile App & Desktop)"
                    >
                      <Send className="w-4 h-4 fill-slate-950" />
                      <span>DISPATCH VIA WHATSAPP (WA.ME)</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ===================== TAB 3: UNIFIED BROADCAST ===================== */}
          {activeTab === 'broadcast' && (
            <div className="space-y-6">
              <div className="p-4 rounded-xl border border-amber-500/50 bg-amber-950/20 space-y-2">
                <div className="flex items-center gap-2">
                  <Share2 className="w-5 h-5 text-amber-400" />
                  <h4 className="text-xs font-bold text-amber-200 hud-font tracking-wide">
                    MULTI-CHANNEL TACTICAL BROADCAST ENGINE
                  </h4>
                </div>
                <p className="text-xs text-slate-300 font-mono">
                  Prepare an urgent directive to be simultaneously prepared for transmission across both your connected Google Workspace Gmail account and designated WhatsApp emergency channels.
                </p>
              </div>

              <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/60 space-y-4">
                <div>
                  <label className="text-[10px] font-mono text-slate-400 block mb-1">
                    BROADCAST MESSAGE BODY:
                  </label>
                  <textarea
                    rows={5}
                    placeholder="Enter urgent briefing to transmit across all automated channels..."
                    value={broadcastMessage}
                    onChange={(e) => setBroadcastMessage(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-mono bg-slate-950 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:border-amber-500 resize-none"
                  />
                </div>

                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      if (!broadcastMessage.trim()) return;
                      setEmailSubject('[EXECUTIVE BROADCAST] Priority Operational Directive');
                      setEmailBody(broadcastMessage);
                      setActiveTab('gmail');
                    }}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg border border-cyan-500/60 bg-cyan-950/40 hover:bg-cyan-900/40 text-cyan-300 text-xs font-mono transition-colors cursor-pointer"
                  >
                    <Mail className="w-4 h-4 text-cyan-400" />
                    <span>LOAD INTO GMAIL AUTOMATION</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (!broadcastMessage.trim()) return;
                      setWaMessage(broadcastMessage);
                      setActiveTab('whatsapp');
                    }}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg border border-emerald-500/60 bg-emerald-950/40 hover:bg-emerald-900/40 text-emerald-300 text-xs font-mono transition-colors cursor-pointer"
                  >
                    <MessageSquare className="w-4 h-4 text-emerald-400" />
                    <span>LOAD INTO WHATSAPP DISPATCH</span>
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-800 bg-slate-900/80 flex items-center justify-between text-xs font-mono text-slate-400 shrink-0">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyan-400" />
            <span>J.A.R.V.I.S. COMMS MATRIX • GOOGLE WORKSPACE & CLOUD SECURE LINK</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg border border-slate-700 hover:bg-slate-800 text-slate-300 transition-colors cursor-pointer"
          >
            DISMISS
          </button>
        </div>

        {/* ========================================================================= */}
        {/* MANDATORY USER CONFIRMATION MODAL FOR GMAIL DESTRUCTIVE/MUTATING SEND     */}
        {/* Workspace Integration skill requires explicit user confirmation dialog     */}
        {/* ========================================================================= */}
        {showSendConfirmation && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
            <div className="relative w-full max-w-lg rounded-2xl bg-slate-950 border border-rose-500/80 shadow-[0_0_50px_rgba(244,63,94,0.35)] p-5 space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-rose-950 border border-rose-500/80 flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-5 h-5 text-rose-400 animate-bounce" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-rose-200 hud-font tracking-wide">
                    CONFIRM EMAIL TRANSMISSION
                  </h3>
                  <p className="text-xs text-slate-400 font-mono mt-0.5">
                    This action will officially dispatch an email through your connected Google Workspace account.
                  </p>
                </div>
              </div>

              <div className="p-3.5 rounded-lg bg-slate-900 border border-slate-800 font-mono text-xs space-y-2">
                <div>
                  <span className="text-slate-400">To: </span>
                  <span className="text-cyan-300 font-bold">{emailTo}</span>
                </div>
                <div>
                  <span className="text-slate-400">Subject: </span>
                  <span className="text-slate-200 font-semibold">{emailSubject}</span>
                </div>
                <div>
                  <span className="text-slate-400 block mb-1">Message Preview:</span>
                  <p className="text-slate-300 max-h-24 overflow-y-auto text-[11px] p-2 rounded bg-slate-950 border border-slate-800 whitespace-pre-wrap">
                    {emailBody}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowSendConfirmation(false)}
                  className="px-4 py-2 rounded-lg border border-slate-700 hover:bg-slate-800 text-slate-300 text-xs font-mono transition-colors cursor-pointer"
                >
                  ABORT / CANCEL
                </button>

                <button
                  type="button"
                  onClick={handleConfirmEmailSend}
                  className="flex items-center gap-2 px-5 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs hud-font tracking-wider shadow-[0_0_20px_rgba(244,63,94,0.4)] transition-all cursor-pointer"
                >
                  <Send className="w-4 h-4 fill-white" />
                  <span>CONFIRM & TRANSMIT NOW</span>
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
