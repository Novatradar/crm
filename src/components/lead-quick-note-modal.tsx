"use client";
import { useState } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { toast } from "sonner";

export function LeadQuickNoteModal({ open, onOpenChange, leadId, onSaved }: { open: boolean; onOpenChange: (o:boolean)=>void; leadId: string; onSaved: ()=>void }) {
  const [outcome, setOutcome] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);

  async function save() {
    setLoading(true);
    try {
      await api.addLeadCall(leadId, { outcome: outcome || undefined, notes: notes || undefined });
      toast.success('Saved');
      setOutcome("");
      setNotes("");
      onOpenChange(false);
      onSaved();
    } catch (e:any) {
      toast.error(e?.message || 'Failed to save');
    } finally { setLoading(false); }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogTitle>Log Feedback</DialogTitle>
        <div className="mt-3 space-y-3">
          <Input placeholder="Outcome (e.g., Answered, No answer)" value={outcome} onChange={(e)=>setOutcome(e.target.value)} />
          <Input placeholder="Notes" value={notes} onChange={(e)=>setNotes(e.target.value)} />
          <div className="flex justify-end">
            <Button className="py-2" onClick={save} disabled={loading}>{loading ? 'Saving...' : 'Save'}</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

