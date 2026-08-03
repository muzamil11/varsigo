import { callCommunityFunction } from '@/lib/communityFunction';
import type { LostFoundInput, LostFoundItem, LostFoundKind } from './data';

interface RawLostFoundRow {
  id: string;
  kind: LostFoundKind;
  item_name: string;
  description: string;
  university: string;
  campus: string | null;
  location: string;
  contact_name: string;
  whatsapp: string | null;
  email: string;
  photo_url: string | null;
  created_at: string;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function mapItem(row: RawLostFoundRow): LostFoundItem {
  return {
    id: row.id,
    kind: row.kind,
    itemName: row.item_name,
    description: row.description,
    university: row.university,
    campus: row.campus,
    location: row.location,
    contactName: row.contact_name,
    whatsapp: row.whatsapp,
    email: row.email,
    photoUrl: row.photo_url,
    createdAt: formatDate(row.created_at),
  };
}

export async function fetchLostFoundItems(): Promise<LostFoundItem[]> {
  const rows = await callCommunityFunction<RawLostFoundRow[]>('listLostFoundItems', {});
  return rows.map(mapItem);
}

export async function submitLostFoundItem(input: LostFoundInput): Promise<void> {
  await callCommunityFunction<void>('submitLostFoundItem', { ...input });
}
