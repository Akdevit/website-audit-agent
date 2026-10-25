import Badge from '@/components/ui/Badge';

const tones = {completed:'good',failed:'poor',running:'info',pending:'attention'};
export default function AuditStatus({status}) {
  return <Badge tone={tones[status] || 'neutral'} dot className="capitalize">{status || 'Unknown'}</Badge>;
}
