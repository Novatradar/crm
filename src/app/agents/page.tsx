"use client";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/status-badge";
import Link from "next/link";
import { api } from "@/lib/api";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { CreateAgentForm } from "@/components/create-agent-form";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export default function AgentsPage() {
  const router = useRouter();
  const [agents, setAgents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const [open, setOpen] = useState(false);
  async function load() {
    try { setAgents(await api.listAgents()); } catch (e:any) { setErr(e?.message || 'Failed'); } finally { setLoading(false); }
  }
  useEffect(() => {
    api.getMe().then(me => {
      if (me.role !== 'super_agent') {
        router.replace('/');
        return;
      }
      load();
    }).catch(() => router.replace('/'))
  }, [router]);

  async function setStatus(id: string, status: 'active'|'suspended'|'blocked') {
    try {
      await api.updateAgentStatus(id, status);
      toast.success(status === 'active' ? 'Agent activated' : status === 'suspended' ? 'Agent suspended' : 'Status updated');
      await load();
    } catch (e:any) {
      toast.error(e?.message || 'Failed to update status');
    }
  }

  return (
    <>
    <Card>
      <CardHeader className="flex items-center justify-between">
        <CardTitle>Agents</CardTitle>
        <Button className="py-2" onClick={()=>setOpen(true)}>New Agent</Button>
      </CardHeader>
      <CardContent>
        {loading ? 'Loading...' : err ? <div className="text-red-600">{err}</div> : (
          <Table>
            <THead>
              <TR>
                <TH>Name</TH>
                <TH>Email</TH>
                <TH>Role</TH>
                <TH>Status</TH>
                <TH>Actions</TH>
              </TR>
            </THead>
            <TBody>
              {agents.map((a) => (
                <TR key={a.id}>
                  <TD>{a.name}</TD>
                  <TD>{a.email}</TD>
                  <TD>{a.role}</TD>
                  <TD><StatusBadge value={a.status} /></TD>
                  <TD className="space-x-2">
                    <Link href={`/agents/${a.id}`}>
                      <span className="inline-flex rounded-md border border-slate-300 bg-white px-3 py-2 text-sm hover:bg-slate-50">View</span>
                    </Link>
                    {a.status === 'active' && (
                      <Button className="py-2" size="sm" variant="secondary" onClick={()=>setStatus(a.id, 'suspended')}>Suspend</Button>
                    )}
                    {a.status === 'suspended' && (
                      <Button className="py-2" size="sm" variant="ghost" onClick={()=>setStatus(a.id, 'active')}>Activate</Button>
                    )}
                  </TD>
                </TR>
              ))}
            </TBody>
          </Table>
        )}
      </CardContent>
    </Card>
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent>
        <DialogTitle>Create Agent</DialogTitle>
        <div className="mt-3">
          <CreateAgentForm onCreated={async ()=>{ setOpen(false); await load(); }} />
        </div>
      </DialogContent>
    </Dialog>
    </>
  );
}
