"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";
import { StatusBadge } from "@/components/status-badge";
import { api } from "@/lib/api";

type Agent = { id: string; name: string; email: string; role: 'agent'|'super_agent'; status: string };
type UserRow = { id: string; name: string; status: string; assignedAgent?: { _id: string; name: string } };

export default function Page() {
  const [me, setMe] = useState<Agent | null>(null);
  const [users, setUsers] = useState<UserRow[]>([]);
  const [agents, setAgents] = useState<any[]>([]);
  const [convos, setConvos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const m = await api.getMe();
        if (!mounted) return;
        setMe(m as any);
        const [u, a, c] = await Promise.all([
          api.listUsers(),
          m.role === 'super_agent' ? api.listAgents() : Promise.resolve([]),
          api.listAgentConversations().catch(() => []),
        ]);
        if (!mounted) return;
        setUsers(u as any);
        setAgents(a as any);
        setConvos(c as any);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const totalUsers = users.length;
  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { new: 0, contacted: 0 };
    for (const u of users) {
      const s = String(u.status || '').toLowerCase();
      if (s === 'new') counts.new += 1;
      if (s === 'contacted') counts.contacted += 1;
    }
    return counts;
  }, [users]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p className="text-sm text-gray-600">Quick snapshot of your workspace.</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3 lg:grid-cols-4">
        <Card>
          <CardHeader><CardTitle>Total Users</CardTitle></CardHeader>
          <CardContent className="text-2xl font-semibold">{totalUsers}</CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>New</CardTitle></CardHeader>
          <CardContent className="text-2xl font-semibold">{statusCounts.new}</CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Contacted</CardTitle></CardHeader>
          <CardContent className="text-2xl font-semibold">{statusCounts.contacted}</CardContent>
        </Card>
        {me?.role === 'super_agent' && (
          <Card className="md:col-span-1">
            <CardHeader><CardTitle>Agents</CardTitle></CardHeader>
            <CardContent className="text-2xl font-semibold">{agents.length}</CardContent>
          </Card>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Recent users */}
        <Card>
          <CardHeader className="flex items-center justify-between">
            <CardTitle>Recent Users</CardTitle>
            <Link href="/users" className="text-xs underline">View all</Link>
          </CardHeader>
          <CardContent>
            {loading ? 'Loading...' : (
              <Table>
                <THead>
                  <TR>
                    <TH>Name</TH>
                    <TH>Status</TH>
                    <TH>Assigned</TH>
                    <TH>Actions</TH>
                  </TR>
                </THead>
                <TBody>
                  {users.slice(0, 5).map((u) => (
                    <TR key={u.id}>
                      <TD>{u.name}</TD>
                      <TD><StatusBadge value={u.status} /></TD>
                      <TD>{u.assignedAgent?.name || '—'}</TD>
                      <TD>
                        <Link href={`/users/${u.id}`}>
                          <span className="inline-flex rounded-md border border-slate-300 bg-white px-3 py-2 text-sm hover:bg-slate-50">View</span>
                        </Link>
                      </TD>
                    </TR>
                  ))}
                </TBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Recent conversations */}
        <Card>
          <CardHeader className="flex items-center justify-between">
            <CardTitle>Recent Conversations</CardTitle>
            <Link href="/chat" className="text-xs underline">Open chat</Link>
          </CardHeader>
          <CardContent>
            {convos.length === 0 ? (
              <div className="text-sm text-slate-500">No conversations yet.</div>
            ) : (
              <div className="divide-y">
                {convos.slice(0,5).map((c:any) => (
                  <div key={c.peer.id} className="flex items-center justify-between py-3">
                    <div>
                      <div className="font-medium">{c.peer.name}</div>
                      <div className="text-xs text-slate-500">{new Date(c.lastMessage?.timestamp).toLocaleString()}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      {c.unreadCount > 0 && (
                        <span className="rounded-full bg-rose-600 px-2 py-0.5 text-[10px] font-semibold text-white">{c.unreadCount}</span>
                      )}
                      <Link href="/chat" className="text-xs underline">Reply</Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
