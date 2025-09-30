"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { api } from "@/lib/api";

type PreferredMethod = 'twilio' | 'zoiper';

export default function VoiceSettingsPage() {
  const router = useRouter();
  const [role, setRole] = useState<string | null>(null);
  const [preferredMethod, setPreferredMethod] = useState<PreferredMethod>('zoiper');
  const [twilioCallerId, setTwilioCallerId] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const [twilioEnabled, setTwilioEnabled] = useState<boolean>(false);

  useEffect(() => {
    api.getMe().then((me) => {
      setRole(me.role);
      if (me.role !== 'super_agent') router.replace('/');
    }).catch(() => router.replace('/'));
  }, [router]);

  useEffect(() => {
    const load = async () => {
      try {
        const cfg = await api.getVoiceConfig();
        if (cfg?.preferredMethod === 'twilio' || cfg?.preferredMethod === 'zoiper') setPreferredMethod(cfg.preferredMethod);
        if (typeof cfg?.twilioCallerId === 'string') setTwilioCallerId(cfg.twilioCallerId || '');
      } catch (_) {}
      try {
        const base = process.env.NEXT_PUBLIC_API_BASE || "https://tradar-be.onrender.com/api/v1";
        const token = typeof window !== 'undefined' ? localStorage.getItem('agent_token') || '' : '';
        const r = await fetch(`${base}/voice/token`, { headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) } });
        const j = await r.json().catch(()=>({}));
        setTwilioEnabled(!!j?.enabled);
      } catch (_) { setTwilioEnabled(false); }
    };
    load();
  }, []);

  const save = async () => {
    try {
      setSaving(true);
      await api.updateVoiceConfig({ preferredMethod, twilioCallerId: twilioCallerId.trim() || undefined });
      toast.success('Call settings updated');
    } catch (e: any) {
      toast.error(e?.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Call Settings</h1>
        <p className="text-gray-600 mt-2">Configure outgoing call method and Twilio Caller ID</p>
      </div>

      <Card className="max-w-xl">
        <CardHeader>
          <CardTitle>Preferred Call Method</CardTitle>
          <div className="text-sm text-slate-500">Choose how agents initiate calls</div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1">
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 text-sm">
                <input type="radio" name="method" value="zoiper" checked={preferredMethod === 'zoiper'} onChange={() => setPreferredMethod('zoiper')} />
                Zoiper (SIP app)
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input type="radio" name="method" value="twilio" checked={preferredMethod === 'twilio'} onChange={() => setPreferredMethod('twilio')} />
                Twilio Voice {twilioEnabled ? '' : '(not configured)'}
              </label>
            </div>
            <p className="text-xs text-gray-500">Agents can still manually choose a different method when calling.</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="callerId">Twilio Caller ID (outgoing number)</Label>
            <Input id="callerId" placeholder="+15551234567" value={twilioCallerId} onChange={(e) => setTwilioCallerId(e.target.value)} />
            <p className="text-xs text-gray-500">Must be a Twilio verified or purchased number. Used as the caller ID for Twilio outbound calls.</p>
          </div>

          <div className="pt-2">
            <Button onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save Settings'}</Button>
          </div>
        </CardContent>
      </Card>

      <div className="text-xs text-gray-500 max-w-2xl">
        <p className="mb-2"><strong>Zoiper:</strong> Outgoing caller ID is controlled by your SIP provider/account in Zoiper. You generally do not need to configure a number here for Zoiper.</p>
        <p><strong>Twilio:</strong> Ensure the Caller ID is a Twilio number in your account or a verified outgoing caller ID in Twilio. This number will be displayed to the lead when you call using Twilio.</p>
      </div>
    </div>
  );
}
