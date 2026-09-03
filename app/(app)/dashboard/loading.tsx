import { Skeleton } from '@/components/ui/Feedback';

export default function DashboardLoading() {
  return (
    <div className="kb-dash">
      <div>
        <Skeleton style={{ height: 28, width: 220 }} />
        <Skeleton style={{ height: 16, width: 140, marginTop: 8 }} />
      </div>
      <div className="kb-dash-skel-grid">
        {[0, 1, 2, 3].map(i => (
          <Skeleton key={i} className="kb-dash-skel" />
        ))}
      </div>
    </div>
  );
}
