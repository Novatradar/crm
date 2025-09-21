"use client";
import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

export function ReassignModal({ open, onOpenChange, userId, onAssigned }: { open: boolean; onOpenChange: (o:boolean)=>void; userId: string; onAssigned: ()=>void }) {
  const [agents, setAgents] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<string>("");
  useEffect(() => { if (open) api.listAgents().then(setAgents).catch(()=>setAgents([])); }, [open]);

  async function submit() {
    if (!selected) return;
    setLoading(true);
    try {
      await api.assignUser(userId, selected);
      toast.success('User reassigned');
      onAssigned();
      onOpenChange(false);
    } catch (e:any) {
      toast.error(e?.message || 'Failed to reassign');
    } finally { setLoading(false); }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogTitle>Reassign User</DialogTitle>
        <div className="mt-3 space-y-3">
          <Select value={selected} onValueChange={setSelected}>
            <SelectTrigger>
              <SelectValue placeholder="Select agent" />
            </SelectTrigger>
            <SelectContent>
              {agents.map(a => (
                <SelectItem key={a.id} value={a.id}>{a.name} ({a.email})</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex justify-end gap-2">
            <Button className="py-2" variant="secondary" onClick={()=>onOpenChange(false)}>Cancel</Button>
            <Button className="py-2" onClick={submit} disabled={!selected || loading}>{loading ? 'Assigning...' : 'Assign'}</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
