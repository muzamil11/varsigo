import type { Metadata } from 'next';
import React from 'react';

import { Screen } from '@/components';
import { FaqAccordion } from '@/features/faq/FaqAccordion';

export const metadata: Metadata = {
  title: 'FAQ',
  description: 'Frequently asked questions about NED University — admissions, CGPA, fees, attendance, and more.',
};

export default function FaqPage() {
  return (
    <Screen>
      <FaqAccordion />
    </Screen>
  );
}
