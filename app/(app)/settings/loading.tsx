import { Skeleton } from '@/components/ui/Feedback';

export default function SettingsLoading() {
  return (
    <div className="kb-settings">
      <Skeleton style={{ height: 28, width: 160 }} />
      <Skeleton style={{ height: 40, width: 480 }} />
      <Skeleton style={{ height: 180, width: '100%' }} />
    </div>
  );
}
