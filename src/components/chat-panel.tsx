"use client";
import { useEffect, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export function ChatPanel({ userId }: { userId: string }) {
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  async function load() {
    const data = await api.userChats(userId);
    setMessages(data);
    setTimeout(() => endRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
  }

  useEffect(() => { load(); }, [userId]);

  async function send() {
    if (!input.trim()) return;
    try {
      setSending(true);
      await api.sendChat(userId, input.trim());
      toast.success('Message sent');
    } catch (e:any) {
      toast.error(e?.message || 'Failed to send');
      return;
    } finally { setSending(false); }
    setInput("");
    await load();
  }

  return (
    <Card>
      <CardHeader><CardTitle>Chat</CardTitle></CardHeader>
      <CardContent className="space-y-3">
        <ScrollArea className="h-80 rounded border p-3">
          <div className="space-y-3">
            {messages.map((m) => (
              <div key={m._id} className={`flex ${m.direction === 'agent_to_user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[70%] rounded-lg p-2.5 text-sm shadow-sm ${m.direction === 'agent_to_user' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-900'}`}>
                  <div>{m.message}</div>
                  <div className={`mt-1 text-[10px] ${m.direction === 'agent_to_user' ? 'text-indigo-100/90' : 'text-slate-500'}`}>
                    {new Date(m.timestamp).toLocaleString()}
                  </div>
                </div>
              </div>
            ))}
            <div ref={endRef} />
          </div>
        </ScrollArea>
        <div className="flex gap-2">
          <Textarea value={input} onChange={(e)=>setInput(e.target.value)} placeholder="Type a message" rows={2} disabled={sending} />
          <Button className="py-2" onClick={send} disabled={sending}>{sending ? (<><Loader2 size={14} className="mr-2 animate-spin" /> Sending…</>) : 'Send'}</Button>
        </div>
      </CardContent>
    </Card>
  );
}
