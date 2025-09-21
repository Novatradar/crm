// const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8800/api/v1";
// const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "https://cfdrockets-be.onrender.com/api/v1";
const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "https://tradar-be.onrender.com/api/v1";


function token() {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem('agent_token') || '';
}

async function req(path: string, opts: RequestInit = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    ...opts,
    headers: {
      'Content-Type': 'application/json',
      ...(opts.headers || {}),
      ...(token() ? { Authorization: `Bearer ${token()}` } : {}),
    },
    cache: 'no-store',
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export const api = {
  // Auth
  async login(email: string, password: string) {
    const { token, agent } = await req('/auth/login', { method: 'POST', body: JSON.stringify({ email, password })});
    if (typeof window !== 'undefined') localStorage.setItem('agent_token', token);
    return agent;
  },
  async getMe() {
    const { agent } = await req('/auth/me');
    return agent as { id: string; name: string; email: string; role: 'agent'|'super_agent'; status: string };
  },
  // Users
  async listUsers() {
    const { users } = await req('/users');
    return users as any[];
  },
  async getUser(id: string) {
    return await req(`/users/${id}`);
  },
  async assignUser(id: string, agentId: string) {
    return await req(`/users/${id}/assign`, { method: 'POST', body: JSON.stringify({ agentId }) });
  },
  async userCalls(id: string) {
    const { calls } = await req(`/users/${id}/calls`);
    return calls as any[];
  },
  async addCall(id: string, data: { outcome?: string; notes?: string; timestamp?: string }) {
    const { call } = await req(`/users/${id}/calls`, { method: 'POST', body: JSON.stringify(data) });
    return call;
  },
  async userChats(id: string) {
    const { chats } = await req(`/users/${id}/chats`);
    return chats as any[];
  },
  async sendChat(id: string, message: string) {
    const { chat } = await req(`/users/${id}/chats`, { method: 'POST', body: JSON.stringify({ message }) });
    return chat;
  },
  // Agents
  async listAgents() {
    const { agents } = await req('/agents');
    return agents as any[];
  },
  async getAgent(id: string) {
    return await req(`/agents/${id}`);
  },
  async createAgent(data: { name: string; email: string; password: string; role?: 'agent'|'super_agent' }) {
    const { agent } = await req('/agents/new', { method: 'POST', body: JSON.stringify(data) });
    return agent;
  },
  async updateAgentStatus(id: string, status: 'active'|'suspended'|'blocked') {
    const { agent } = await req(`/agents/${id}`, { method: 'PATCH', body: JSON.stringify({ status }) });
    return agent;
  },
  // Agent-to-agent chat
  async listAgentConversations() {
    const { conversations } = await req('/chats/agents');
    return conversations as any[];
  },
  async getAgentThread(agentId: string) {
    return await req(`/chats/agents/${agentId}`);
  },
  async sendAgentMessage(agentId: string, message: string) {
    const { message: m } = await req(`/chats/agents/${agentId}`, { method: 'POST', body: JSON.stringify({ message }) });
    return m;
  },
  async sendAgentMessageMultipart(agentId: string, form: FormData) {
    const res = await fetch(`${API_BASE}/chats/agents/${agentId}`, {
      method: 'POST',
      body: form,
      headers: {
        ...(token() ? { Authorization: `Bearer ${token()}` } : {}),
      } as any,
    });
    if (!res.ok) throw new Error(await res.text());
    const json = await res.json();
    return json.message;
  },
  async listAgentsFiltered(role?: 'agent'|'super_agent') {
    const qs = role ? `?role=${role}` : '';
    const { agents } = await req(`/agents${qs}`);
    return agents as any[];
  }
};
