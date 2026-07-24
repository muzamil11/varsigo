import { CardSkeletonList, Screen } from '@/components';

export default function Loading() {
  return (
    <Screen>
      <div className="mx-auto max-w-3xl px-4 py-6">
        <CardSkeletonList padded={false} count={3} />
      </div>
    </Screen>
  );
}
