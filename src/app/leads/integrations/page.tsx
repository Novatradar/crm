"use client";
import { Suspense, useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useRouter, useSearchParams } from "next/navigation";

type Cfg = { id: string; platform: string; enabled: boolean; autoSync: boolean; settings?: any; connected?: boolean };

function LeadIntegrationsPageInner() {
  const router = useRouter();
  const [configs, setConfigs] = useState<Cfg[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const params = useSearchParams();
  const [sfConnecting, setSfConnecting] = useState(false);
  const [zohoConnecting, setZohoConnecting] = useState(false);

  async function load() {
    try { setConfigs(await api.listIntegrationConfigs()); } catch (e:any) { setErr(e?.message || 'Failed'); } finally { setLoading(false); }
  }
  useEffect(() => { api.getMe().then(m => { if (m.role !== 'super_agent') router.replace('/'); else load(); }).catch(()=>router.replace('/')); }, [router]);
  useEffect(() => {
    const ok = params?.get('connected');
    const error = params?.get('error');
    if (ok) toast.success(`${ok} connected`);
    if (error) toast.error(error);
  }, [params]);

  function row(platform: string): Cfg {
    return configs.find(c => c.platform === platform) || { id: '', platform, enabled: false, autoSync: false, settings: {}, connected: false };
  }

  async function save(platform: string, payload: any) {
    try { await api.upsertIntegrationConfig({ platform, ...payload }); toast.success('Saved'); await load(); } catch (e:any) { toast.error(e?.message || 'Failed'); }
  }

  if (loading) return <div>Loading...</div>;
  if (err) return <div className="text-red-600">{err}</div>;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader><CardTitle>HubSpot</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <ToggleRow label="Enabled" value={row('hubspot').enabled} onChange={(v)=>save('hubspot',{ enabled: v })} />
          <ToggleRow label="Auto-sync on create" value={row('hubspot').autoSync} onChange={(v)=>save('hubspot',{ autoSync: v })} />
          <SecretRow label="Private App Token" placeholder="pat-..." onSave={(token)=>save('hubspot',{ secrets: { token } })} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Salesforce</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <ToggleRow label="Enabled" value={row('salesforce').enabled} onChange={(v)=>save('salesforce',{ enabled: v })} />
          <ToggleRow label="Auto-sync on create" value={row('salesforce').autoSync} onChange={(v)=>save('salesforce',{ autoSync: v })} />
          <SettingRow label="Instance URL" value={row('salesforce').settings?.instanceUrl || ''} placeholder="https://your-instance.my.salesforce.com" onSave={(instanceUrl)=>save('salesforce',{ settings: { instanceUrl } })} />
          <SecretRow label="Client ID" placeholder="SF Client ID" onSave={(clientId)=>save('salesforce',{ secrets: { clientId } })} />
          <SecretRow label="Client Secret" placeholder="SF Client Secret" onSave={(clientSecret)=>save('salesforce',{ secrets: { clientSecret } })} />
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-700">Connection</div>
            <div className="flex items-center gap-2">
              <span className={`text-xs ${row('salesforce').connected ? 'text-green-600' : 'text-gray-500'}`}>{row('salesforce').connected ? 'Connected' : 'Not connected'}</span>
              <Button className="py-2" variant="secondary" disabled={sfConnecting} onClick={async ()=>{
                try { setSfConnecting(true); const { url } = await apiRequest('/leads/integrations/oauth/salesforce/start'); window.location.href = url; } catch (e:any) { toast.error(e?.message || 'Failed to start OAuth'); } finally { setSfConnecting(false); }
              }}>{sfConnecting ? (<><Loader2 size={14} className="mr-2 animate-spin" /> Connecting…</>) : 'Connect'}</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Zoho CRM</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <ToggleRow label="Enabled" value={row('zoho').enabled} onChange={(v)=>save('zoho',{ enabled: v })} />
          <ToggleRow label="Auto-sync on create" value={row('zoho').autoSync} onChange={(v)=>save('zoho',{ autoSync: v })} />
          <SettingRow label="Domain" value={row('zoho').settings?.domain || ''} placeholder="https://www.zohoapis.com" onSave={(domain)=>save('zoho',{ settings: { domain } })} />
          <SecretRow label="Client ID" placeholder="Zoho Client ID" onSave={(clientId)=>save('zoho',{ secrets: { clientId } })} />
          <SecretRow label="Client Secret" placeholder="Zoho Client Secret" onSave={(clientSecret)=>save('zoho',{ secrets: { clientSecret } })} />
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-700">Connection</div>
            <div className="flex items-center gap-2">
              <span className={`text-xs ${row('zoho').connected ? 'text-green-600' : 'text-gray-500'}`}>{row('zoho').connected ? 'Connected' : 'Not connected'}</span>
              <Button className="py-2" variant="secondary" disabled={zohoConnecting} onClick={async ()=>{
                try { setZohoConnecting(true); const { url } = await apiRequest('/leads/integrations/oauth/zoho/start'); window.location.href = url; } catch (e:any) { toast.error(e?.message || 'Failed to start OAuth'); } finally { setZohoConnecting(false); }
              }}>{zohoConnecting ? (<><Loader2 size={14} className="mr-2 animate-spin" /> Connecting…</>) : 'Connect'}</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Google Analytics 4</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <ToggleRow label="Enabled" value={row('ga4').enabled} onChange={(v)=>save('ga4',{ enabled: v })} />
          <ToggleRow label="Auto-sync on create" value={row('ga4').autoSync} onChange={(v)=>save('ga4',{ autoSync: v })} />
          <SettingRow label="Measurement ID" value={row('ga4').settings?.measurementId || ''} placeholder="G-XXXXXXX" onSave={(measurementId)=>save('ga4',{ settings: { measurementId } })} />
          <SecretRow label="API Secret" placeholder="GA4 API Secret" onSave={(apiSecret)=>save('ga4',{ secrets: { apiSecret } })} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Facebook Lead Ads</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <ToggleRow label="Enabled" value={row('facebook').enabled} onChange={(v)=>save('facebook',{ enabled: v })} />
          <div className="text-xs text-gray-600">Webhook URL: <code>/api/v1/leads/integrations/facebook/webhook</code>. Set the Verify Token and Page Access Token below, then add the webhook in your App (subscribe to leadgen).</div>
          <SecretRow label="Verify Token" placeholder="A random string" onSave={(verifyToken)=>save('facebook',{ secrets: { verifyToken } })} />
          <SecretRow label="Page Access Token" placeholder="EAAG..." onSave={(pageAccessToken)=>save('facebook',{ secrets: { pageAccessToken } })} />
        </CardContent>
      </Card>
    </div>
  );
}

export default function LeadIntegrationsPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LeadIntegrationsPageInner />
    </Suspense>
  );
}

function ToggleRow({ label, value, onChange }: { label: string; value: boolean; onChange: (v:boolean)=>Promise<void>|void }) {
  const [busy, setBusy] = useState(false);
  return (
    <div className="flex items-center justify-between">
      <div className="text-sm text-gray-700">{label}</div>
      <label className="inline-flex cursor-pointer items-center gap-2 text-sm">
        <input type="checkbox" checked={value} disabled={busy} onChange={async (e)=>{ try { setBusy(true); await onChange(e.target.checked); } finally { setBusy(false); } }} />
        <span>{value ? 'On' : 'Off'}</span>
        {busy && <Loader2 size={14} className="ml-1 animate-spin text-gray-500" />}
      </label>
    </div>
  );
}

function SettingRow({ label, value, placeholder, onSave }: { label: string; value: string; placeholder?: string; onSave: (v:string)=>Promise<void>|void }) {
  const [v, setV] = useState(value);
  const [saving, setSaving] = useState(false);
  useEffect(()=>setV(value), [value]);
  return (
    <div>
      <div className="text-xs text-gray-600 mb-1">{label}</div>
      <div className="flex gap-2">
        <Input value={v} placeholder={placeholder} onChange={(e)=>setV(e.target.value)} disabled={saving} />
        <Button className="py-2" onClick={async ()=>{ try { setSaving(true); await onSave(v); } finally { setSaving(false); } }} disabled={saving}>{saving ? (<><Loader2 size={14} className="mr-2 animate-spin" /> Saving…</>) : 'Save'}</Button>
      </div>
    </div>
  );
}

function SecretRow({ label, placeholder, onSave }: { label: string; placeholder?: string; onSave: (v:string)=>Promise<void>|void }) {
  const [v, setV] = useState('');
  const [saving, setSaving] = useState(false);
  return (
    <div>
      <div className="text-xs text-gray-600 mb-1">{label}</div>
      <div className="flex gap-2">
        <Input type="password" value={v} placeholder={placeholder} onChange={(e)=>setV(e.target.value)} disabled={saving} />
        <Button className="py-2" onClick={async ()=>{ try { setSaving(true); await onSave(v); setV(''); } finally { setSaving(false); } }} disabled={saving}>{saving ? (<><Loader2 size={14} className="mr-2 animate-spin" /> Saving…</>) : 'Save'}</Button>
      </div>
    </div>
  );
}

async function apiRequest(path: string) {
  const base = process.env.NEXT_PUBLIC_API_BASE || "https://tradar-be.onrender.com/api/v1";
  const token = typeof window !== 'undefined' ? localStorage.getItem('agent_token') || '' : '';
  const res = await fetch(`${base}${path}`, { headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) } });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
