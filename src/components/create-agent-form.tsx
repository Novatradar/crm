"use client";
import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { Eye, EyeOff } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

export function CreateAgentForm({ onCreated }: { onCreated: (agent: any) => void }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<'agent'|'super_agent'>("agent");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string| null>(null);
  const [showPassword, setShowPassword] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError(null);
    try {
      const agent = await api.createAgent({ name, email, password, role });
      toast.success("Agent created");
      onCreated(agent);
    } catch (e: any) {
      const msg = e?.message || 'Failed to create';
      setError(msg);
      toast.error(String(msg));
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-3 py-6">
      {error && <div className="text-sm text-red-600">{error}</div>}
      <div>
        <Label>Name</Label>
        <Input value={name} onChange={(e)=>setName(e.target.value)} required />
      </div>
      <div>
        <Label>Email</Label>
        <Input type="email" value={email} onChange={(e)=>setEmail(e.target.value)} required />
      </div>
      <div>
        <Label>Password</Label>
        <div className="relative">
          <Input
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e)=>setPassword(e.target.value)}
            required
            minLength={6}
            className="pr-10"
          />
          <button
            type="button"
            aria-label={showPassword ? 'Hide password' : 'Show password'}
            onClick={() => setShowPassword(v=>!v)}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-900"
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
      </div>
      <div>
        <Label>Role</Label>
        <Select value={role} onValueChange={(v)=>setRole(v as 'agent'|'super_agent')}>
          <SelectTrigger className="">
            <SelectValue placeholder="Select role" />
          </SelectTrigger>
          <SelectContent className="">
            <SelectItem value="agent">Agent</SelectItem>
            <SelectItem value="super_agent">Super Agent</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="pt-2">
        <Button type="submit" className="w-full" disabled={loading}>{loading ? 'Creating...' : 'Create Agent'}</Button>
      </div>
    </form>
  );
}
