import { CardSkeletonList, PageShell, Screen } from '@/components';

export default function Loading() {
  return (
    <Screen>
      <PageShell className="py-6">
        <CardSkeletonList padded={false} count={6} />
      </PageShell>
    </Screen>
  );
}
