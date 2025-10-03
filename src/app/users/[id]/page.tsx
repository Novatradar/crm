"use client";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";
import { ReassignModal } from "@/components/reassign-modal";
import { VoiceCallButton } from "@/components/voice-call-button";
import { Loader2 } from "lucide-react";
import { api } from "@/lib/api";

export default function UserDetailPage() {
  const params = useParams();
  const id = params?.id as string;
  const [data, setData] = useState<any | null>(null);
  const [open, setOpen] = useState(false);
  const [role, setRole] = useState<'agent'|'super_agent'|null>(null);
  const [error, setError] = useState<string | null>(null);
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [callData, setCallData] = useState<{ outcome?: string; notes?: string }>({ outcome: '', notes: '' });
  const [loggingCall, setLoggingCall] = useState(false);

  async function load() {
    try {
      const d = await api.getUser(id);
      setData(d);
    } catch (e: any) {
      setError(e?.message || 'Failed to load');
    }
  }

  useEffect(() => { if (id) load(); }, [id]);
  useEffect(() => { api.getMe().then(m=>setRole(m.role as any)).catch(()=>setRole(null)); }, []);
  useEffect(() => {
    (async () => {
      try {
        const base = process.env.NEXT_PUBLIC_API_BASE || "https://tradar-be.onrender.com/api/v1";
        const token = typeof window !== 'undefined' ? localStorage.getItem('agent_token') || '' : '';
        const r = await fetch(`${base}/voice/token`, { headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) } });
        const j = await r.json().catch(()=>({}));
        setVoiceEnabled(!!j?.enabled);
      } catch (_) { setVoiceEnabled(false); }
    })();
  }, []);

  if (error) return <div className="text-red-600">{error}</div>;
  if (!data) return <div>Loading...</div>;

  const { user, calls, chats } = data;
  const conferenceName = `user-${id}`;
  const hasActive = (calls || []).some((c: any) => !c?.endedAt && (!c?.callStatus || ["initiated","ringing","answered","in-progress","queued"].includes(String(c?.callStatus))));
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex items-center justify-between">
          <CardTitle>Basic Info</CardTitle>
          <div className="flex items-center gap-2">
            {role === 'super_agent' && (
              <Button className="py-2" onClick={() => setOpen(true)}>Reassign</Button>
            )}
            {(role === 'agent' || role === 'super_agent') && (
              <VoiceCallButton phone={user.phone} conferenceName={conferenceName} />
            )}
            {role === 'super_agent' && voiceEnabled && hasActive && (
              <VoiceCallButton supervisor conferenceName={conferenceName} label="Barge" />
            )}
          </div>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <div><div className="text-xs text-gray-500">Name</div><div>{user.name}</div></div>
          {role === 'super_agent' && (<div><div className="text-xs text-gray-500">Email</div><div>{user.email}</div></div>)}
          {role === 'super_agent' && (<div><div className="text-xs text-gray-500">Phone</div><div>{user.phone || '—'}</div></div>)}
          <div><div className="text-xs text-gray-500">Assigned Agent</div><div>{user.assignedAgent ? user.assignedAgent.name : '—'}</div></div>
          {user.originalPassword && (
            <div className="md:col-span-2"><div className="text-xs text-gray-500">Original Password</div><div className="font-mono">{user.originalPassword}</div></div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Call History</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <THead>
              <TR>
                <TH>Time</TH>
                <TH>Outcome</TH>
                <TH>Notes</TH>
                <TH>Agent</TH>
              </TR>
            </THead>
            <TBody>
              {calls.map((c: any) => (
                <TR key={c._id}>
                  <TD>{new Date(c.timestamp || c.startedAt).toLocaleString()}</TD>
                  <TD>{c.outcome || c.callStatus || '—'}</TD>
                  <TD>{c.notes || '—'}</TD>
                  <TD>{c.agent?.name || '—'}</TD>
                </TR>
              ))}
            </TBody>
          </Table>
          <div className="mt-3 grid grid-cols-1 gap-2 md:grid-cols-4">
            <div className="md:col-span-1">
              <Input placeholder="Outcome (e.g., Answered, No answer)" value={callData.outcome || ''} onChange={(e)=>setCallData(d=>({ ...d, outcome: e.target.value }))} />
            </div>
            <div className="md:col-span-2">
              <Input placeholder="Notes" value={callData.notes || ''} onChange={(e)=>setCallData(d=>({ ...d, notes: e.target.value }))} />
            </div>
            <div className="md:col-span-1 flex justify-end">
              <Button className="py-2" onClick={async ()=>{
                try { setLoggingCall(true); await api.addCall(id, { outcome: callData.outcome, notes: callData.notes }); setCallData({ outcome: '', notes: '' }); await load(); } catch(e:any) { /* non-fatal */ } finally { setLoggingCall(false); }
              }} disabled={loggingCall}>{loggingCall ? (<><Loader2 size={14} className="mr-2 animate-spin" /> Logging…</>) : 'Log Call'}</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <ReassignModal open={open} onOpenChange={setOpen} userId={id} onAssigned={load} />
    </div>
  );
}
