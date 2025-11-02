"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { StatusBadge } from "@/components/status-badge";
import { PlatformBadge } from "@/components/platform-badge";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { PhoneCall, StickyNote, Loader2 } from "lucide-react";
import { VoiceCallButton } from "@/components/voice-call-button";
import { LeadQuickNoteModal } from "@/components/lead-quick-note-modal";

type LeadRow = { id: string; name?: string; email?: string; phone?: string; status?: string; source?: string; assignedAgent?: { id: string; name: string } };

export default function LeadsPage() {
  const [rows, setRows] = useState<LeadRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<string | undefined>(undefined);
  const [source, setSource] = useState<string | undefined>(undefined);
  const [role, setRole] = useState<'agent'|'super_agent'|null>(null);
  const [meId, setMeId] = useState<string | null>(null);
  const [sources, setSources] = useState<string[]>([]);

  // Create modal
  const [openNew, setOpenNew] = useState(false);
  const [newData, setNewData] = useState<any>({ name: "", email: "", phone: "", company: "", source: "", tags: "" });

  // Import modal
  const [openImport, setOpenImport] = useState(false);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [noteOpen, setNoteOpen] = useState(false);
  const [noteLeadId, setNoteLeadId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [autoAssigningId, setAutoAssigningId] = useState<string | null>(null);

  const filters = useMemo(() => ({ q: query.trim(), status: status || undefined, source: source || undefined }), [query, status, source]);

  async function load(nextPage?: number) {
    setLoading(true);
    setError(null);
    try {
      const data = await api.listLeadsPaged({ ...filters, page: nextPage ?? page, limit });
      setRows(data.leads || []);
      setTotal(data.total || 0);
      setPage(data.page || (nextPage ?? 1));
      setLimit(data.limit || 20);
    } catch (e:any) {
      setError(e?.message || 'Failed to load');
    } finally { setLoading(false); }
  }

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [total, setTotal] = useState(0);
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  useEffect(() => { load(1); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, []);
  useEffect(() => { api.getMe().then(m=>{ setRole(m.role as any); setMeId(m.id); }).catch(()=>{ setRole(null); setMeId(null); }); }, []);
  useEffect(() => { api.listLeadSources().then(setSources).catch(()=>setSources([])); }, []);
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

  function maskPhone(p?: string) {
    const s = String(p || '').replace(/\D+/g, '');
    if (!s) return '—';
    const last = s.slice(-4);
    return `••••••${last}`;
  }

  return (
    <Card>
      <CardHeader className="flex items-center justify-between">
        <CardTitle>Leads</CardTitle>
        {role === 'super_agent' && (
          <div className="flex gap-2">
            <Link href="/leads/integrations" className="inline-flex items-center rounded-md border border-slate-300 bg-white px-3 py-2 text-sm hover:bg-slate-50">Integrations</Link>
            <Button className="py-2" variant="secondary" onClick={()=>setOpenImport(true)}>Import CSV</Button>
            <Button className="py-2" onClick={()=>setOpenNew(true)}>New Lead</Button>
          </div>
        )}
      </CardHeader>
      <CardContent>
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center">
          <Input placeholder="Search name, email, phone" value={query} onChange={(e)=>setQuery(e.target.value)} />
          <Select value={status || undefined} onValueChange={(v)=>setStatus(v)}>
            <SelectTrigger className="w-48"><SelectValue placeholder="All statuses" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="new">new</SelectItem>
              <SelectItem value="contacted">contacted</SelectItem>
              <SelectItem value="qualified">qualified</SelectItem>
              <SelectItem value="unqualified">unqualified</SelectItem>
              <SelectItem value="converted">converted</SelectItem>
              <SelectItem value="archived">archived</SelectItem>
            </SelectContent>
          </Select>
          <Select value={source || undefined} onValueChange={(v)=>setSource(v)}>
            <SelectTrigger className="w-56"><SelectValue placeholder="All platforms" /></SelectTrigger>
            <SelectContent>
              {sources.map((s) => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button className="py-2" variant="ghost" onClick={()=>load(1)}>Apply</Button>
        </div>
        {loading ? (
          <div className="p-4 text-sm">Loading...</div>
        ) : error ? (
          <div className="p-4 text-sm text-red-600">{error}</div>
        ) : (
          <Table>
            <THead>
              <TR>
                <TH>Name</TH>
                <TH>Email</TH>
                <TH>Phone</TH>
                <TH>Status</TH>
                <TH>Source</TH>
                <TH>Assigned</TH>
                <TH>Actions</TH>
              </TR>
            </THead>
            <TBody>
              {rows.map((l) => (
                <TR key={l.id}>
                  <TD>
                    <Link href={`/leads/${l.id}`} className="text-gray-900 underline-offset-2 hover:underline">
                      {l.name || '—'}
                    </Link>
                  </TD>
                  <TD>{l.email || '—'}</TD>
                  <TD>{role === 'super_agent' ? (l.phone || '—') : maskPhone(l.phone)}</TD>
                  <TD><StatusBadge value={l.status} /></TD>
                  <TD><PlatformBadge source={l.source} /></TD>
                  <TD>{l.assignedAgent ? l.assignedAgent.name : '—'}</TD>
                  <TD className="space-x-2 whitespace-nowrap">
                    <Link href={`/leads/${l.id}`} className="inline-flex rounded-md border border-slate-300 bg-white px-3 py-2 text-sm hover:bg-slate-50">View</Link>
                    {role === 'super_agent' && !l.assignedAgent && (
                      <button
                        className="inline-flex items-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm hover:bg-slate-50"
                        disabled={autoAssigningId === l.id}
                        onClick={async ()=>{ 
                          setAutoAssigningId(l.id);
                          try { await api.autoAssignLead(l.id); toast.success('Auto-assigned'); await load(page); } catch (e:any) { toast.error(e?.message || 'Failed'); } finally { setAutoAssigningId(null); }
                        }}
                      >{autoAssigningId === l.id ? (<><Loader2 size={14} className="animate-spin" /> Assigning…</>) : 'Auto-Assign'}</button>
                    )}
                    {role === 'agent' && meId && l.assignedAgent && (l as any).assignedAgent.id === meId && (
                      <VoiceCallButton leadId={l.id} conferenceName={`lead-${l.id}`} />
                    )}
                    {role === 'agent' && meId && l.assignedAgent && (l as any).assignedAgent.id === meId && (
                      <button
                        className="inline-flex items-center gap-1 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm hover:bg-slate-50"
                        title="Log feedback"
                        onClick={()=>{ setNoteLeadId(l.id); setNoteOpen(true); }}
                      >
                        <StickyNote size={16} /> Note
                      </button>
                    )}
                  </TD>
                </TR>
              ))}
            </TBody>
          </Table>
        )}
      </CardContent>

      {/* Pagination */}
      <div className="flex items-center justify-between px-6 pb-4">
        <div className="text-xs text-gray-600">Page {page} of {Math.max(1, Math.ceil(total / Math.max(1, limit)))}</div>
        <div className="flex items-center gap-2">
          <Button className="py-2" variant="secondary" disabled={page <= 1 || loading} onClick={async ()=>{ const np = Math.max(1, page-1); setPage(np); await load(np); }}>{loading ? (<><Loader2 size={14} className="mr-2 animate-spin" /> Loading…</>) : 'Prev'}</Button>
          <Button className="py-2" variant="secondary" disabled={page >= Math.ceil(total / Math.max(1, limit)) || loading} onClick={async ()=>{ const np = page + 1; setPage(np); await load(np); }}>{loading ? (<><Loader2 size={14} className="mr-2 animate-spin" /> Loading…</>) : 'Next'}</Button>
        </div>
      </div>

      {/* New Lead Dialog */}
      <Dialog open={openNew} onOpenChange={setOpenNew}>
        <DialogContent>
          <DialogTitle>New Lead</DialogTitle>
          <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
            <div className="md:col-span-2">
              <label className="text-xs text-gray-500">Name</label>
              <Input value={newData.name} onChange={e=>setNewData((d:any)=>({ ...d, name: e.target.value }))} />
            </div>
            <div>
              <label className="text-xs text-gray-500">Email</label>
              <Input type="email" value={newData.email} onChange={e=>setNewData((d:any)=>({ ...d, email: e.target.value }))} />
            </div>
            <div>
              <label className="text-xs text-gray-500">Phone</label>
              <Input value={newData.phone} onChange={e=>setNewData((d:any)=>({ ...d, phone: e.target.value }))} />
            </div>
            <div>
              <label className="text-xs text-gray-500">Company</label>
              <Input value={newData.company} onChange={e=>setNewData((d:any)=>({ ...d, company: e.target.value }))} />
            </div>
            <div>
              <label className="text-xs text-gray-500">Source</label>
              <Input value={newData.source} onChange={e=>setNewData((d:any)=>({ ...d, source: e.target.value }))} />
            </div>
            <div className="md:col-span-2">
              <label className="text-xs text-gray-500">Tags (comma-separated)</label>
              <Input value={newData.tags} onChange={e=>setNewData((d:any)=>({ ...d, tags: e.target.value }))} />
            </div>
            <div className="md:col-span-2 flex justify-end gap-2">
              <Button className="py-2" variant="secondary" onClick={()=>setOpenNew(false)}>Cancel</Button>
              <Button className="py-2" onClick={async ()=>{
                try {
                  setCreating(true);
                  const payload = { ...newData, tags: String(newData.tags||'').split(',').map((t:string)=>t.trim()).filter(Boolean) };
                  await api.createLead(payload);
                  toast.success('Lead created');
                  setOpenNew(false);
                  setNewData({ name: "", email: "", phone: "", company: "", source: "", tags: "" });
                  await load();
                } catch (e:any) {
                  toast.error(e?.message || 'Failed to create lead');
                } finally { setCreating(false); }
              }} disabled={creating}>{creating ? (<><Loader2 size={14} className="mr-2 animate-spin" /> Creating…</>) : 'Create'}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Import CSV Dialog */}
      <Dialog open={openImport} onOpenChange={setOpenImport}>
        <DialogContent>
          <DialogTitle>Import Leads CSV</DialogTitle>
          <div className="mt-3 space-y-3">
            <div className="text-xs text-gray-600">
              Headers: Name, Email, Number, Country, Status, Agent, Whatsapp, Comment
              <br />
              All fields are optional. Whatsapp should be Yes/No. Country is a string (e.g. Switzerland).
            </div>
            <input type="file" accept=".csv,text/csv" onChange={(e)=>setCsvFile(e.target.files?.[0] || null)} />
            <div className="flex justify-end gap-2">
              <Button className="py-2" variant="secondary" onClick={()=>setOpenImport(false)}>Cancel</Button>
              <Button className="py-2" disabled={!csvFile || uploading} onClick={async ()=>{
                if (!csvFile) return;
                try {
                  setUploading(true);
                  // Read CSV text
                  const text = await csvFile.text();
                  // Minimal CSV parser that supports quoted fields
                  function parseCSV(input: string): string[][] {
                    const rows: string[][] = [];
                    let row: string[] = [];
                    let field = '';
                    let i = 0;
                    let inQuotes = false;
                    while (i < input.length) {
                      const char = input[i];
                      if (inQuotes) {
                        if (char === '"') {
                          if (input[i+1] === '"') { field += '"'; i += 2; continue; }
                          inQuotes = false; i++; continue;
                        } else { field += char; i++; continue; }
                      } else {
                        if (char === '"') { inQuotes = true; i++; continue; }
                        if (char === ',') { row.push(field); field = ''; i++; continue; }
                        if (char === '\n') { row.push(field); rows.push(row); row = []; field = ''; i++; continue; }
                        if (char === '\r') { // handle CRLF
                          // If next is \n, skip it in the next iteration
                          i++;
                          continue;
                        }
                        field += char; i++; continue;
                      }
                    }
                    // push last field/row
                    row.push(field);
                    if (row.length > 1 || (row.length === 1 && row[0].trim() !== '')) rows.push(row);
                    // Remove empty trailing rows
                    return rows.filter(r => r.some(c => String(c).trim() !== ''));
                  }
                  const rows = parseCSV(text);
                  if (!rows.length) throw new Error('CSV appears empty');
                  const header = rows[0].map(h => String(h || '').trim());
                  const body = rows.slice(1);
                  // Build header index map (case-insensitive)
                  function idx(name: string) {
                    const n = name.toLowerCase();
                    return header.findIndex(h => h.toLowerCase() === n);
                  }
                  const iName = idx('Name');
                  const iEmail = idx('Email');
                  const iNumber = idx('Number');
                  const iCountry = idx('Country');
                  const iStatus = idx('Status');
                  const iAgent = idx('Agent');
                  const iWhatsapp = idx('Whatsapp');
                  const iComment = idx('Comment');

                  // Preload agents to resolve the "Agent" column
                  let agents: any[] = [];
                  try { agents = await api.listAgents(); } catch (_) { agents = []; }
                  const agentByEmail = new Map<string, any>();
                  const agentByName = new Map<string, any>();
                  agents.forEach(a => {
                    if (a.email) agentByEmail.set(String(a.email).toLowerCase(), a);
                    if (a.name) agentByName.set(String(a.name).toLowerCase(), a);
                  });

                  const normalizeStatus = (s?: string) => {
                    const v = String(s || '').trim().toLowerCase();
                    const allowed = new Set(['new','contacted','qualified','unqualified','converted','archived']);
                    return allowed.has(v) ? v : undefined;
                  };
                  const parseWhatsapp = (v?: string) => {
                    const t = String(v || '').trim().toLowerCase();
                    if (['yes','y','true','1'].includes(t)) return true;
                    if (['no','n','false','0'].includes(t)) return false;
                    return undefined;
                  };

                  let created = 0;
                  let failed = 0;
                  let duplicates = 0;

                  for (let r = 0; r < body.length; r++) {
                    const cols = body[r];
                    const name = iName >= 0 ? cols[iName]?.trim() : '';
                    const email = iEmail >= 0 ? cols[iEmail]?.trim() : '';
                    const phone = iNumber >= 0 ? cols[iNumber]?.trim() : '';
                    const country = iCountry >= 0 ? cols[iCountry]?.trim() : '';
                    const statusRaw = iStatus >= 0 ? cols[iStatus]?.trim() : '';
                    const agentRef = iAgent >= 0 ? cols[iAgent]?.trim() : '';
                    const whatsappRaw = iWhatsapp >= 0 ? cols[iWhatsapp]?.trim() : '';
                    const comment = iComment >= 0 ? cols[iComment]?.trim() : '';

                    // Skip completely empty rows
                    if (![name,email,phone,country,statusRaw,agentRef,whatsappRaw,comment].some(v => String(v || '').trim() !== '')) continue;

                    let assignedAgent: string | undefined = undefined;
                    if (agentRef) {
                      const refLc = agentRef.toLowerCase();
                      const byEmail = agentByEmail.get(refLc);
                      const byName = agentByName.get(refLc);
                      const match = byEmail || byName;
                      if (match && (match.id || match._id)) assignedAgent = String(match.id || match._id);
                    }

                    const status = normalizeStatus(statusRaw);
                    const whatsapp = parseWhatsapp(whatsappRaw);

                    const meta: any = {};
                    if (country) meta.country = country;
                    if (comment) meta.comment = comment;
                    if (whatsapp !== undefined) meta.whatsapp = whatsapp;
                    if (agentRef && !assignedAgent) meta.agent = agentRef; // preserve reference if not resolved
                    meta.importSource = 'csv';

                    try {
                      await api.createLead({
                        name: name || undefined,
                        email: email || undefined,
                        phone: phone || undefined,
                        status,
                        ...(assignedAgent ? { assignedAgent } : {}),
                        meta,
                        source: 'csv_import'
                      });
                      created++;
                    } catch (e:any) {
                      const msg = String(e?.message || '').toLowerCase();
                      if (msg.includes('duplicate') || msg.includes('exists')) duplicates++; else failed++;
                    }
                  }

                  toast.success(`Imported ${created} lead(s). ${duplicates} duplicates. ${failed} failed.`);
                  setOpenImport(false);
                  setCsvFile(null);
                  await load();
                } catch (e:any) {
                  toast.error(e?.message || 'Import failed');
                } finally { setUploading(false); }
              }}>{uploading ? (<><Loader2 size={14} className="mr-2 animate-spin" /> Uploading…</>) : 'Upload'}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      <LeadQuickNoteModal open={noteOpen} onOpenChange={setNoteOpen} leadId={noteLeadId || ''} onSaved={()=>load(page)} />
    </Card>
  );
}
