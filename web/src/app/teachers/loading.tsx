import { CardSkeletonList, Screen } from '@/components';

export default function Loading() {
  return (
    <Screen>
      <div className="mx-auto max-w-4xl px-4 py-6">
        <CardSkeletonList padded={false} count={6} />
      </div>
    </Screen>
  );
}
