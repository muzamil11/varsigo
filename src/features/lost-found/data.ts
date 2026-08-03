export type LostFoundKind = 'lost' | 'found';

export interface LostFoundItem {
  id: string;
  kind: LostFoundKind;
  itemName: string;
  description: string;
  university: string;
  campus: string | null;
  location: string;
  contactName: string;
  whatsapp: string | null;
  email: string;
  photoUrl: string | null;
  createdAt: string;
}

export interface LostFoundInput {
  kind: LostFoundKind;
  itemName: string;
  description: string;
  university: string;
  campus: string;
  location: string;
  contactName: string;
  whatsapp: string;
  email: string;
  photoUrl: string;
}

export const LOST_FOUND_KIND_LABELS: Record<LostFoundKind, string> = {
  lost: 'Lost item',
  found: 'Found item',
};
