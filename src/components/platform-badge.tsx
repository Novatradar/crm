import { Badge } from "@/components/ui/badge";

const styles: Record<string, string> = {
  facebook_lead_ads: "bg-[#1877F2]/10 text-[#1877F2]",
  facebook: "bg-[#1877F2]/10 text-[#1877F2]",
  hubspot: "bg-[#FF7A59]/10 text-[#FF7A59]",
  salesforce: "bg-[#00A1E0]/10 text-[#00A1E0]",
  zoho: "bg-[#C8202F]/10 text-[#C8202F]",
  ga4: "bg-[#673AB7]/10 text-[#673AB7]",
  capture: "bg-indigo-100 text-indigo-800",
  import: "bg-gray-100 text-gray-700",
};

function labelFor(source?: string) {
  const s = (source || '').toLowerCase();
  if (s === 'facebook_lead_ads') return 'Facebook';
  if (s === 'ga4') return 'GA4';
  if (s === 'capture') return 'Capture';
  if (s === 'import') return 'Import';
  return source || '—';
}

export function PlatformBadge({ source }: { source?: string }) {
  const key = String(source || '').toLowerCase();
  const cls = styles[key] || 'bg-slate-100 text-slate-700';
  return <Badge className={cls}>{labelFor(source)}</Badge>;
}

