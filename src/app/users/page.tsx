"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";
import { StatusBadge } from "@/components/status-badge";
import { api } from "@/lib/api";
import { VoiceCallButton } from "@/components/voice-call-button";

type Row = { id: string; name: string; email: string; phone?: string; status: string; assignedAgent?: { _id: string; name: string; email: string } };

export default function UsersPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [role, setRole] = useState<'agent'|'super_agent'|null>(null);
  const [meId, setMeId] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const me = await api.getMe();
        if (mounted) { setRole(me.role as any); setMeId(me.id); }
      } catch (_) { setRole(null as any); setMeId(null); }
      try {
        const users = await api.listUsers();
        if (mounted) setRows(users);
      } catch (e:any) {
        setError("Failed to load" + (e?.message || ''));
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Users</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="p-4 text-sm">Loading...</div>
        ) : error ? (
          <div className="p-4 text-sm text-red-600">{error}</div>
        ) : (
          <Table>
            <THead>
              <TR>
                <TH>Name</TH>
                {role === 'super_agent' && <TH>Email</TH>}
                {role === 'super_agent' && <TH>Phone</TH>}
                <TH>Status</TH>
                <TH>Assigned Agent</TH>
                <TH>Actions</TH>
              </TR>
            </THead>
            <TBody>
              {rows.map((u) => (
                <TR key={u.id}>
                  <TD>
                    <Link href={`/users/${u.id}`} className="text-gray-900 underline-offset-2 hover:underline">
                      {u.name || '—'}
                    </Link>
                  </TD>
                  {role === 'super_agent' && <TD>{u.email}</TD>}
                  {role === 'super_agent' && <TD>{u.phone || '—'}</TD>}
                  <TD><StatusBadge value={u.status} /></TD>
                  <TD>{u.assignedAgent ? u.assignedAgent.name : '—'}</TD>
                  <TD className="space-x-2">
                    <Link href={`/users/${u.id}`}>
                      <span className="inline-flex rounded-md border border-slate-300 bg-white px-3 py-2 text-sm hover:bg-slate-50">View</span>
                    </Link>
                    {role === 'agent' && meId && u.assignedAgent && (u.assignedAgent as any)._id === meId && (
                      <VoiceCallButton phone={u.phone} conferenceName={`user-${u.id}`} />
                    )}
                  </TD>
                </TR>
              ))}
            </TBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
