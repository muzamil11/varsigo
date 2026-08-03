import {
  BookOpen,
  CheckCircle2,
  FileText,
  GraduationCap,
  HelpCircle,
  MessageCircle,
  Search,
  ShieldCheck,
  Sparkles,
  Star,
  UploadCloud,
  Users,
} from 'lucide-react';
import Link from 'next/link';
import React from 'react';

import { PageShell, Screen } from '@/components';
import { FAQS } from '@/features/faq/data';

export const revalidate = 300;

const STATS = [
  { label: 'CSIT MS courses', value: '40+' },
  { label: 'Teachers mapped', value: '60+' },
  { label: 'Moderated content', value: '100%' },
];

const FEATURES = [
  {
    href: '/teachers',
    icon: Star,
    title: 'Teacher Reviews',
    description: 'Find teachers by name, department, or course before choosing who to review.',
  },
  {
    href: '/papers',
    icon: FileText,
    title: 'Past Papers & Notes',
    description: 'Sign in to browse approved papers, download files, and upload your own.',
  },
  {
    href: '/lost-found',
    icon: Search,
    title: 'Lost & Found',
    description: 'Report lost or found items with admin approval and signed-in contact access.',
  },
  {
    href: '/faq',
    icon: HelpCircle,
    title: 'University FAQ',
    description: 'Quick answers for admission, exams, documents, fees, and university processes.',
  },
  {
    href: '/questions',
    icon: MessageCircle,
    title: 'Student Q&A',
    description: 'Ask campus questions and help other students with practical answers.',
  },
];

const JOURNEY = [
  {
    icon: Search,
    title: 'Find what you need',
    description: 'Search teachers, courses, FAQs, and signed-in paper resources from one platform.',
  },
  {
    icon: GraduationCap,
    title: 'Make better choices',
    description: 'Use course-linked teacher context and moderated resources to reduce guesswork.',
  },
  {
    icon: UploadCloud,
    title: 'Contribute safely',
    description: 'Reviews, uploads, and reports go through moderation before public visibility.',
  },
];

const TRUST_POINTS = [
  'Google sign-in',
  'Admin moderation',
  'Course-aware reviews',
  'NED-focused data',
];

const QUICK_FAQS = FAQS.slice(0, 4);

export default function HomePage() {
  return (
    <Screen>
      <PageShell className="py-10">
        <section className="rounded-2xl border border-line bg-card px-5 py-10 dark:border-line-dark dark:bg-card-dark sm:px-8 lg:px-12">
          <div className="max-w-4xl">
            <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-accent text-white">
              <GraduationCap size={28} />
            </div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-accent">
              Built for NED students
            </p>
            <h1 className="text-4xl font-bold tracking-tight text-foreground dark:text-foreground-dark sm:text-5xl">
              Teacher reviews, papers, and campus answers in one place
            </h1>
            <p className="mt-4 max-w-3xl text-base leading-7 text-muted dark:text-muted-dark sm:text-lg">
              Varsigo helps students find course-linked teacher context, approved study resources,
              and practical FAQ answers without digging through scattered links.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/teachers"
                className="inline-flex items-center gap-2 rounded-xl bg-accent px-6 py-3 text-base font-semibold text-white"
              >
                <Users size={18} />
                Browse Teachers
              </Link>
              <Link
                href="/papers"
                className="inline-flex items-center gap-2 rounded-xl border border-line px-6 py-3 text-base font-semibold text-foreground dark:border-line-dark dark:text-foreground-dark"
              >
                <FileText size={18} />
                Find Papers
              </Link>
            </div>
          </div>

          <div className="mt-10 grid grid-cols-1 gap-3 sm:grid-cols-3">
            {STATS.map((stat) => (
              <div
                key={stat.label}
                className="rounded-xl border border-line bg-background p-4 text-center dark:border-line-dark dark:bg-background-dark"
              >
                <p className="text-2xl font-bold text-foreground dark:text-foreground-dark">
                  {stat.value}
                </p>
                <p className="mt-1 text-xs text-muted dark:text-muted-dark">{stat.label}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-12">
          <div className="mb-5 flex items-end justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">
                Student tools
              </p>
              <h2 className="mt-2 text-2xl font-bold text-foreground dark:text-foreground-dark">
                Everything important stays easy to find
              </h2>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {FEATURES.map((feature) => (
              <Link
                key={feature.href}
                href={feature.href}
                className="rounded-2xl border border-line bg-card p-5 transition-transform duration-150 hover:-translate-y-0.5 dark:border-line-dark dark:bg-card-dark"
              >
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-accent/10">
                  <feature.icon size={21} className="text-accent" />
                </div>
                <h3 className="text-base font-semibold text-foreground dark:text-foreground-dark">
                  {feature.title}
                </h3>
                <p className="mt-2 text-sm leading-6 text-muted dark:text-muted-dark">
                  {feature.description}
                </p>
              </Link>
            ))}
          </div>
        </section>

        <section className="mt-12 grid grid-cols-1 gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-2xl border border-line bg-card p-6 dark:border-line-dark dark:bg-card-dark">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">
              Student journey
            </p>
            <h2 className="mt-2 text-2xl font-bold text-foreground dark:text-foreground-dark">
              From confusion to a clear next step
            </h2>
            <div className="mt-6 space-y-4">
              {JOURNEY.map((item, index) => (
                <div key={item.title} className="flex gap-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-accent/10">
                    <item.icon size={20} className="text-accent" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground dark:text-foreground-dark">
                      {index + 1}. {item.title}
                    </p>
                    <p className="mt-1 text-sm leading-6 text-muted dark:text-muted-dark">
                      {item.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-line bg-card p-6 dark:border-line-dark dark:bg-card-dark">
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent/10">
                <ShieldCheck size={21} className="text-accent" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-foreground dark:text-foreground-dark">
                  Trust and clarity
                </h2>
                <p className="text-sm text-muted dark:text-muted-dark">
                  Users should always know what happens next.
                </p>
              </div>
            </div>
            <div className="space-y-3">
              {TRUST_POINTS.map((point) => (
                <div
                  key={point}
                  className="flex items-center gap-3 rounded-xl border border-line bg-background px-3 py-3 dark:border-line-dark dark:bg-background-dark"
                >
                  <CheckCircle2 size={18} className="text-accent" />
                  <span className="text-sm font-medium text-foreground dark:text-foreground-dark">
                    {point}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mt-12 rounded-2xl border border-line bg-card p-6 dark:border-line-dark dark:bg-card-dark">
          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">
                Quick help
              </p>
              <h2 className="mt-2 text-2xl font-bold text-foreground dark:text-foreground-dark">
                Common questions should not feel hidden
              </h2>
            </div>
            <Link href="/faq" className="text-sm font-semibold text-accent">
              Open FAQ
            </Link>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {QUICK_FAQS.map((faq) => (
              <Link
                key={faq.id}
                href={`/faq?category=${encodeURIComponent(faq.category)}`}
                className="flex items-center justify-between rounded-xl border border-line bg-background px-4 py-3 text-sm font-medium text-foreground dark:border-line-dark dark:bg-background-dark dark:text-foreground-dark"
              >
                {faq.question}
                <Sparkles size={16} className="text-accent" />
              </Link>
            ))}
          </div>
        </section>

        <section className="mt-12 rounded-2xl border border-accent/30 bg-accent/10 p-7 text-center">
          <BookOpen className="mx-auto text-accent" size={28} />
          <h2 className="mt-3 text-2xl font-bold text-foreground dark:text-foreground-dark">
            Help build a cleaner NED resource library
          </h2>
          <p className="mx-auto mt-2 max-w-2xl text-sm leading-6 text-muted dark:text-muted-dark">
            Upload useful papers, review teachers with course context, and report anything that
            needs moderation. Some areas require Google sign-in so the platform stays accountable.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link
              href="/papers/upload"
              className="rounded-xl bg-accent px-5 py-2.5 text-sm font-semibold text-white"
            >
              Upload a Paper
            </Link>
            <Link
              href="/questions"
              className="rounded-xl border border-line px-5 py-2.5 text-sm font-semibold text-foreground dark:border-line-dark dark:text-foreground-dark"
            >
              Ask a Question
            </Link>
          </div>
        </section>
      </PageShell>
    </Screen>
  );
}
