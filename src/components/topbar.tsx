"use client";
import { useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { MessageSquare, LogOut } from "lucide-react";

type Agent = { id: string; name: string; email: string; role: "agent"|"super_agent"; status: string };

export function Topbar() {
  const [agent, setAgent] = useState<Agent | null>(null);
  const [chatUnread, setChatUnread] = useState(0);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    api.getMe().then((a) => setAgent(a)).catch(() => setAgent(null));
    const refreshUnread = async () => {
      try {
        const convos = await api.listAgentConversations();
        const total = convos.reduce((sum: number, c: any) => sum + (c.unreadCount || 0), 0);
        setChatUnread(total);
      } catch (_) {}
    };
    refreshUnread();
    const t = setInterval(refreshUnread, 30000);
    const handler = (e: any) => {
      if (e?.detail?.total != null) setChatUnread(Number(e.detail.total) || 0);
    };
    if (typeof window !== 'undefined') window.addEventListener('chat:unread', handler as any);
    return () => { clearInterval(t); if (typeof window !== 'undefined') window.removeEventListener('chat:unread', handler as any); };
  }, []);

  const title = useMemo(() => {
    if (!pathname) return 'Dashboard';
    if (pathname === '/') return 'Dashboard';
    const seg = pathname.split('/').filter(Boolean);
    if (seg[0] === 'users') return seg.length > 1 ? 'User Details' : 'Users';
    if (seg[0] === 'agents') return seg.length > 1 ? 'Agent Details' : 'Agents';
    if (seg[0] === 'chat') return 'Chat';
    return 'Dashboard';
  }, [pathname]);
  function signOut() {
    if (typeof window !== 'undefined') localStorage.removeItem('agent_token');
    router.replace('/login');
  }
  return (
    <header className="sticky top-0 z-10 flex h-14 items-center justify-between border-b border-slate-200 bg-white/80 px-4 backdrop-blur">
      <div className="flex items-center gap-3">
        <div className="text-sm font-medium text-slate-800">{title}</div>
        <span className="text-slate-300">|</span>
        <div className="text-xs text-slate-500">Welcome{agent ? `, ${agent.name.split(' ')[0]}` : ''}</div>
      </div>
      {agent ? (
        <div className="flex items-center gap-3 text-sm">
          <Link href="/chat" className="relative inline-flex items-center rounded-md border border-slate-200 bg-white px-3 py-2 text-slate-700 hover:bg-slate-50">
            <MessageSquare size={16} />
            {chatUnread > 0 && (
              <span className="absolute -right-1 -top-1 rounded-full bg-rose-600 px-1.5 py-0.5 text-[10px] font-semibold text-white">{chatUnread}</span>
            )}
          </Link>
          <Badge variant="secondary">{agent.role === 'super_agent' ? 'Super Agent' : 'Agent'}</Badge>
          <Button className="py-2" size="sm" variant="ghost" onClick={signOut}>
            <LogOut size={16} className="mr-1" />
            Sign out
          </Button>
        </div>
      ) : (
        <span className="text-sm text-gray-500" />
      )}
    </header>
  );
}
