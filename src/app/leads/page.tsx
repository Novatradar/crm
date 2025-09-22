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
import { api } from "@/lib/api";
import { toast } from "sonner";

type LeadRow = { id: string; name?: string; email?: string; phone?: string; status?: string; assignedAgent?: { id: string; name: string } };

export default function LeadsPage() {
  const [rows, setRows] = useState<LeadRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<string | undefined>(undefined);

  // Create modal
  const [openNew, setOpenNew] = useState(false);
  const [newData, setNewData] = useState<any>({ name: "", email: "", phone: "", company: "", source: "", tags: "" });

  // Import modal
  const [openImport, setOpenImport] = useState(false);
  const [csvFile, setCsvFile] = useState<File | null>(null);

  const filters = useMemo(() => ({ q: query.trim(), status: status || undefined }), [query, status]);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const leads = await api.listLeads(filters);
      setRows(leads);
    } catch (e:any) {
      setError(e?.message || 'Failed to load');
    } finally { setLoading(false); }
  }

  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, []);

  return (
    <Card>
      <CardHeader className="flex items-center justify-between">
        <CardTitle>Leads</CardTitle>
        <div className="flex gap-2">
          <Link href="/leads/integrations" className="inline-flex items-center rounded-md border border-slate-300 bg-white px-3 py-2 text-sm hover:bg-slate-50">Integrations</Link>
          <Button className="py-2" variant="secondary" onClick={()=>setOpenImport(true)}>Import CSV</Button>
          <Button className="py-2" onClick={()=>setOpenNew(true)}>New Lead</Button>
        </div>
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
          <Button className="py-2" variant="ghost" onClick={load}>Apply</Button>
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
                  <TD>{l.phone || '—'}</TD>
                  <TD><StatusBadge value={l.status} /></TD>
                  <TD>{l.assignedAgent ? l.assignedAgent.name : '—'}</TD>
                  <TD>
                    <Link href={`/leads/${l.id}`}>
                      <span className="inline-flex rounded-md border border-slate-300 bg-white px-3 py-2 text-sm hover:bg-slate-50">View</span>
                    </Link>
                  </TD>
                </TR>
              ))}
            </TBody>
          </Table>
        )}
      </CardContent>

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
                  const payload = { ...newData, tags: String(newData.tags||'').split(',').map((t:string)=>t.trim()).filter(Boolean) };
                  await api.createLead(payload);
                  toast.success('Lead created');
                  setOpenNew(false);
                  setNewData({ name: "", email: "", phone: "", company: "", source: "", tags: "" });
                  await load();
                } catch (e:any) {
                  toast.error(e?.message || 'Failed to create lead');
                }
              }}>Create</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Import CSV Dialog */}
      <Dialog open={openImport} onOpenChange={setOpenImport}>
        <DialogContent>
          <DialogTitle>Import Leads CSV</DialogTitle>
          <div className="mt-3 space-y-3">
            <div className="text-xs text-gray-600">Headers: firstName,lastName,name,email,phone,company,source,tags</div>
            <input type="file" accept=".csv,text/csv" onChange={(e)=>setCsvFile(e.target.files?.[0] || null)} />
            <div className="flex justify-end gap-2">
              <Button className="py-2" variant="secondary" onClick={()=>setOpenImport(false)}>Cancel</Button>
              <Button className="py-2" disabled={!csvFile} onClick={async ()=>{
                if (!csvFile) return;
                const form = new FormData();
                form.append('file', csvFile);
                try {
                  const res = await api.importLeadsCsv(form);
                  toast.success(`Imported ${res.createdCount} leads; ${res.duplicateCount} duplicates`);
                  setOpenImport(false);
                  setCsvFile(null);
                  await load();
                } catch (e:any) {
                  toast.error(e?.message || 'Import failed');
                }
              }}>Upload</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
