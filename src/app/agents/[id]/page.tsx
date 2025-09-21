"use client";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";
import { StatusBadge } from "@/components/status-badge";
import { api } from "@/lib/api";

export default function AgentDetailPage() {
  const params = useParams();
  const id = params?.id as string;
  const [data, setData] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    api.getAgent(id).then(setData).catch((e:any)=>setError(e?.message || 'Failed to load'));
  }, [id]);

  if (error) return <div className="text-red-600">{error}</div>;
  if (!data) return <div>Loading...</div>;

  const { agent, actions } = data;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader><CardTitle>Agent</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <div><div className="text-xs text-gray-500">Name</div><div>{agent.name}</div></div>
          <div><div className="text-xs text-gray-500">Email</div><div>{agent.email}</div></div>
          <div><div className="text-xs text-gray-500">Role</div><div>{agent.role}</div></div>
          <div><div className="text-xs text-gray-500">Status</div><div><StatusBadge value={agent.status} /></div></div>
          {agent.originalPassword && (
            <div className="md:col-span-2"><div className="text-xs text-gray-500">Original Password</div><div className="font-mono">{agent.originalPassword}</div></div>
          )}
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>Actions</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <THead>
              <TR>
                <TH>Time</TH>
                <TH>Actor</TH>
                <TH>Target</TH>
                <TH>Type</TH>
                <TH>Details</TH>
              </TR>
            </THead>
            <TBody>
              {actions?.map((a:any) => (
                <TR key={a._id}>
                  <TD>{new Date(a.createdAt || a.timestamp).toLocaleString()}</TD>
                  <TD>{a.actorName || a.actor?.name || a.actor?.email || '—'}</TD>
                  <TD>{a.targetName || a.targetAgent?.name || a.targetAgent?.email || '—'}</TD>
                  <TD>{a.typeText || a.actionType}</TD>
                  <TD><code className="text-xs">{typeof a.details === 'object' ? JSON.stringify(a.details) : String(a.details || '')}</code></TD>
                </TR>
              ))}
            </TBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
