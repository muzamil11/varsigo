import type { Metadata } from 'next';
import React from 'react';

import { Screen } from '@/components';
import { GpaCalculator } from '@/features/gpa/GpaCalculator';

export const metadata: Metadata = {
  title: 'GPA Calculator',
  description:
    "Calculate your semester GPA and cumulative CGPA using NED University's official grading scale.",
};

export default function GpaCalculatorPage() {
  return (
    <Screen>
      <GpaCalculator />
    </Screen>
  );
}
