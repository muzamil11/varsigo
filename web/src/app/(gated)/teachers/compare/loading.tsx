import { CardSkeletonList, Screen } from '@/components';

export default function Loading() {
  return (
    <Screen>
      <div className="mx-auto max-w-4xl px-4 py-8">
        <CardSkeletonList padded={false} count={4} />
      </div>
    </Screen>
  );
}
