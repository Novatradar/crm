"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { Paperclip, Loader2, Image as ImageIcon, FileText, FileSpreadsheet, File as FileIcon, X } from "lucide-react";

type Agent = { id: string; name: string; email: string; role: 'agent'|'super_agent'; status: string };



export default function AgentChatPage() {
  const [me, setMe] = useState<Agent | null>(null);
  const [peers, setPeers] = useState<Agent[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [unread, setUnread] = useState<Record<string, number>>({});
  const [input, setInput] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [sending, setSending] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    api.getMe().then(setMe).catch(()=>setMe(null));
  }, []);

  useEffect(() => {
    if (!me) return;
    // Load peers: super -> list agents; agent -> list super agents
    const role = me.role === 'super_agent' ? 'agent' : 'super_agent';
    api.listAgentsFiltered(role as any).then(setPeers).catch(()=>setPeers([]));
  }, [me]);

  // Auto-select the first peer (if any) when peers load and nothing selected yet
  useEffect(() => {
    if (!selected && peers.length > 0) {
      loadThread(peers[0].id);
    }
  }, [peers, selected]);

  async function refreshUnreadTotals() {
    try {
      const convos = await api.listAgentConversations();
      const map: Record<string, number> = {};
      let total = 0;
      for (const c of convos) {
        const peerId = c.peer?.id || c.peer?._id;
        const count = c.unreadCount || 0;
        if (peerId) map[String(peerId)] = count;
        total += count;
      }
      setUnread(map);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('chat:unread', { detail: { total } }));
      }
    } catch (_) {}
  }

  const lastSeenRef = useRef<string | null>(null);

  async function loadThread(id: string) {
    try {
      const { peer, messages } = await api.getAgentThread(id);
      setSelected(peer.id);
      // Notify if new incoming message arrived since last fetch
      const last = messages[messages.length - 1];
      const lastId = last?._id || null;
      if (lastId && lastSeenRef.current && lastId !== lastSeenRef.current) {
        const fromMe = last?.from && (String(last.from) === me?.id || last.from?._id === me?.id);
        if (!fromMe) toast.message(`New message from ${peer.name}`);
      }
      lastSeenRef.current = lastId;
      setMessages(messages);
      // After loading the thread, backend marked as read; refresh unread
      await refreshUnreadTotals();
      setTimeout(() => endRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
    } catch (e:any) {
      toast.error(e?.message || 'Failed to load chat');
    }
  }

  async function send() {
    if (!selected || (!input.trim() && files.length === 0)) return;
    setSending(true);
    try {
      if (files.length > 0) {
        const form = new FormData();
        if (input.trim()) form.append('message', input.trim());
        for (const f of files) form.append('files', f);
        await api.sendAgentMessageMultipart(selected, form);
      } else {
        await api.sendAgentMessage(selected, input.trim());
      }
      setInput('');
      setFiles([]);
      if (fileInputRef.current) fileInputRef.current.value = '';
      await loadThread(selected);
      toast.success('Message sent');
    } catch (e:any) {
      toast.error(e?.message || 'Failed to send');
    } finally { setSending(false); }
  }

  // Poll for new messages when a thread is open (30s)
  useEffect(() => {
    if (!selected) return;
    const t = setInterval(() => loadThread(selected), 30000);
    return () => clearInterval(t);
  }, [selected]);

  // Poll peers list to update unread counters (30s)
  useEffect(() => {
    if (!me) return;
    refreshUnreadTotals();
    const t = setInterval(refreshUnreadTotals, 30000);
    return () => clearInterval(t);
  }, [me]);

  const selectedPeer = useMemo(() => peers.find(p => p.id === selected) || null, [peers, selected]);

  function iconForFile(f: File) {
    const type = f.type || '';
    if (type.startsWith('image/')) return <ImageIcon size={14} />;
    if (type === 'application/pdf' || type.includes('word')) return <FileText size={14} />;
    if (type.includes('sheet') || type.includes('excel')) return <FileSpreadsheet size={14} />;
    return <FileIcon size={14} />;
  }

  function removeFile(idx: number) {
    setFiles(prev => prev.filter((_, i) => i !== idx));
  }

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
      <Card className="md:col-span-1">
        <CardHeader><CardTitle>Chats</CardTitle></CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-[70vh]">
            <div className="divide-y">
              {peers.map((p: any) => (
                <button key={p.id} onClick={()=>loadThread(p.id)} className={`flex w-full items-center justify-between px-4 py-3 text-left hover:bg-slate-50 ${selected===p.id? 'bg-slate-50' : ''}`}>
                  <div>
                    <div className="font-medium">{p.name}</div>
                    <div className="text-xs text-slate-500">{p.email}</div>
                  </div>
                  <div className="flex items-center gap-2 text-[10px] uppercase text-slate-400">
                    {unread[p.id] > 0 && (
                      <span className="rounded-full bg-rose-600 px-2 py-0.5 text-[10px] font-semibold text-white">{unread[p.id]}</span>
                    )}
                    <span>{p.role === 'super_agent' ? 'Super' : 'Agent'}</span>
                  </div>
                </button>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle>{selectedPeer ? selectedPeer.name : 'Select a chat'}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <ScrollArea className="h-[60vh] rounded border p-3">
            <div className="space-y-3">
              {messages.map((m:any) => {
                const fromMe = m.from && (m.from === me?.id || m.from?._id === me?.id);
                return (
                  <div key={m._id} className={`flex ${fromMe ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[70%] rounded-lg p-2.5 text-sm shadow-sm ${fromMe ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-900'}`}>
                      <div>{m.message}</div>
                      {Array.isArray(m.attachments) && m.attachments.length > 0 && (
                        <div className="mt-2 space-y-2">
                          {m.attachments.map((a:any) => (
                            <div key={a.url}>
                              {String(a.mime || '').startsWith('image/') ? (
                                <a href={a.url} target="_blank" rel="noreferrer">
                                  <img src={a.url} alt={a.name} className="max-h-48 rounded" />
                                </a>
                              ) : (
                                <a className="underline" href={a.url} target="_blank" rel="noreferrer">{a.name || 'Attachment'}</a>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                      <div className={`mt-1 text-[10px] ${fromMe ? 'text-indigo-100/90' : 'text-slate-500'}`}>{new Date(m.timestamp).toLocaleString()}</div>
                    </div>
                  </div>
                );
              })}
              <div ref={endRef} />
            </div>
          </ScrollArea>
          <div className="flex w-full items-center gap-2">
            <Input
              className="flex-1"
              value={input}
              onChange={(e)=>setInput(e.target.value)}
              placeholder="Type a message"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  send();
                }
              }}
            />
            <input ref={fileInputRef} type="file" multiple onChange={(e)=> setFiles(Array.from(e.target.files || []))} className="hidden" />
            <Button type="button" className="py-2 px-3" variant="secondary" onClick={() => fileInputRef.current?.click()} disabled={sending}>
              <Paperclip size={16} />
            </Button>
            <Button className="py-2" onClick={send} disabled={sending || !selected || (!input.trim() && files.length === 0)}>
              {sending ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Sending...</>) : 'Send'}
            </Button>
          </div>
          {files.length > 0 && (
            <div className="mt-2 flex flex-wrap items-center gap-2">
              {files.map((f, idx) => (
                <span key={idx} className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-2 py-1 text-xs">
                  {iconForFile(f)}
                  <span className="max-w-[180px] truncate">{f.name}</span>
                  <button type="button" onClick={() => removeFile(idx)} className="text-slate-500 hover:text-slate-900">
                    <X size={12} />
                  </button>
                </span>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
