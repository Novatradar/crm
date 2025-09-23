"use client";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { PhoneCall, PhoneOff } from "lucide-react";

declare global {
  interface Window { Twilio?: any }
}

export function VoiceCallButton({ phone, leadId, conferenceName, supervisor = false, label, className }: { phone?: string; leadId?: string; conferenceName?: string; supervisor?: boolean; label?: string; className?: string }) {
  const [enabled, setEnabled] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [ready, setReady] = useState<boolean>(false);
  const [connected, setConnected] = useState<boolean>(false);
  const deviceRef = useRef<any>(null);
  const connRef = useRef<any>(null);

  useEffect(() => {
    let cancelled = false;
    async function init() {
      try {
        // Fetch token
        const base = process.env.NEXT_PUBLIC_API_BASE || "https://tradar-be.onrender.com/api/v1";
        const token = typeof window !== 'undefined' ? localStorage.getItem('agent_token') || '' : '';
        const tr = await fetch(`${base}/voice/token`, { headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) } });
        const tj = await tr.json().catch(() => ({}));
        if (!tr.ok || !tj?.enabled || !tj?.token) { setEnabled(false); return; }
        setEnabled(true);
        // Load Twilio SDK if needed
        if (!window.Twilio?.Device) {
          await loadScript('https://sdk.twilio.com/js/client/v1.13/twilio.min.js');
        }
        if (!window.Twilio?.Device) { setEnabled(false); return; }
        const Twilio = window.Twilio;
        // Setup device
        deviceRef.current = new Twilio.Device(tj.token, { debug: false, codecPreferences: [ 'opus', 'pcmu' ] });
        deviceRef.current.on('ready', () => { if (!cancelled) setReady(true); });
        deviceRef.current.on('error', (_e: any) => {});
        deviceRef.current.on('connect', (_conn: any) => { if (!cancelled) setConnected(true); });
        deviceRef.current.on('disconnect', () => { if (!cancelled) setConnected(false); });
      } catch (_) {
        setEnabled(false);
      }
    }
    init();
    return () => { cancelled = true; try { deviceRef.current?.destroy?.(); } catch (_) {} };
  }, []);

  if (!enabled) return null;

  const call = async () => {
    if (!deviceRef.current || !ready) return;
    setLoading(true);
    try {
      const params: any = {};
      if (phone) params.To = String(phone || '').replace(/[^+0-9]/g, '');
      if (leadId) params.LeafId = undefined; // noop for backwards compat
      if (leadId) params.LeadId = leadId;
      if (conferenceName) params.ConferenceName = conferenceName;
      if (supervisor) params.Supervisor = '1';
      connRef.current = deviceRef.current.connect(params);
    } catch (_) { /* ignore */ }
    setLoading(false);
  };
  const hangup = async () => {
    try { connRef.current?.disconnect?.(); deviceRef.current?.disconnectAll?.(); } catch (_) {}
  };

  const btnLabel = label || (supervisor ? (connected ? 'Leave' : 'Barge') : (connected ? 'Hang up' : 'Call'));
  const BtnIcon = connected ? PhoneOff : PhoneCall;
  const variant = connected ? 'destructive' : (supervisor ? 'secondary' : 'default');
  return (
    <Button className={className || ''} variant={variant as any} disabled={!ready || loading} onClick={connected ? hangup : call}>
      <BtnIcon size={16} /> {btnLabel}
    </Button>
  );
}

function loadScript(src: string) {
  return new Promise<void>((resolve, reject) => {
    const s = document.createElement('script');
    s.src = src;
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error('Failed to load script'));
    document.head.appendChild(s);
  });
}
