import { Badge } from "@/components/ui/badge";

export function StatusBadge({ value }: { value?: string }) {
  const v = (value || '').toLowerCase();
  if (v === 'converted' || v === 'active') return <Badge variant="success">{value}</Badge>;
  if (v === 'archived' || v === 'suspended') return <Badge variant="secondary">{value}</Badge>;
  if (v === 'blocked' || v === 'banned') return <Badge variant="danger">{value}</Badge>;
  if (v === 'new' || v === 'pending') return <Badge className="bg-indigo-100 text-indigo-800">{value}</Badge>;
  return <Badge variant="secondary">{value || '—'}</Badge>;
}

