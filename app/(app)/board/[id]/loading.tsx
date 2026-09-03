import { Skeleton } from '@/components/ui/Feedback';

export default function BoardLoading() {
  return (
    <div className="kb-boardwrap">
      <div style={{ padding: '16px 20px' }}>
        <Skeleton style={{ height: 24, width: 240 }} />
      </div>
      <div style={{ padding: '0 20px 8px' }}>
        <Skeleton style={{ height: 32, width: 560 }} />
      </div>
      <div className="kb-boardcols">
        {[0, 1, 2, 3].map(i => (
          <div key={i} className="kb-column" style={{ padding: 12, gap: 8 }}>
            <Skeleton style={{ height: 16, width: 90 }} />
            {[0, 1].map(j => (
              <Skeleton key={j} style={{ height: 84, width: '100%' }} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
