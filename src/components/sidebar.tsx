"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Users, Shield, MessageSquare } from "lucide-react";
import { api } from "@/lib/api";

const items = [
  { href: "/", label: "Dashboard", Icon: LayoutDashboard },
  { href: "/users", label: "Users", Icon: Users },
  { href: "/chat", label: "Chat", Icon: MessageSquare },
  { href: "/agents", label: "Agents", Icon: Shield },
];

export function Sidebar() {
  const pathname = usePathname();
  const [role, setRole] = useState<string | null>(null);
  const [chatUnread, setChatUnread] = useState(0);
  useEffect(() => {
    api.getMe().then(a => setRole(a.role)).catch(() => setRole(null));
    const refreshUnread = async () => {
      try {
        const convos = await api.listAgentConversations();
        const total = convos.reduce((sum: number, c: any) => sum + (c.unreadCount || 0), 0);
        setChatUnread(total);
      } catch(_) {}
    };
    refreshUnread();
    const t = setInterval(refreshUnread, 30000);
    const handler = (e: any) => {
      if (e?.detail?.total != null) setChatUnread(Number(e.detail.total) || 0);
    };
    if (typeof window !== 'undefined') window.addEventListener('chat:unread', handler as any);
    return () => {
      clearInterval(t);
      if (typeof window !== 'undefined') window.removeEventListener('chat:unread', handler as any);
    };
  }, []);
  return (
    <aside
      className="fixed left-0 top-0 h-full w-[var(--sidebar-width)] border-r border-slate-200 bg-black backdrop-blur"
      aria-label="Sidebar"
    >
      <div className="flex items-center gap-2 px-4 py-4">
        <div className="grid h-8 w-12 place-items-center rounded-md bg-indigo-600 text-white text-xs tracking-wide">CFD</div>
        <div className="text-sm font-semibold text-white">CFD Admin</div>
      </div>
      <nav className="mt-2 space-y-1 px-2">
        {items.filter(it => (it.href === "/agents" ? role === "super_agent" : true)).map(({ href, label, Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 rounded-md px-3 py-5 text-sm ${
                active
                  ? "bg-indigo-50 text-indigo-700 shadow-inner"
                  : "text-white opacity-80 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              <Icon size={18} />
              <span className="flex-1">{label}</span>
              {href === '/chat' && chatUnread > 0 && (
                <span className="rounded-full bg-rose-600 px-2 py-0.5 text-[10px] font-semibold text-white">{chatUnread}</span>
              )}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
