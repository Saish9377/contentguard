import type { Metadata } from 'next';
import { ReportClient } from './client';

export const metadata: Metadata = {
  title: 'Content Verification Report | ContentGuard AI',
  description: 'View the shared content verification report, including AI probability index, originality scores, and writing metrics.',
  robots: {
    index: false, // Do not index shared report pages on search engines to prevent duplicate content
    follow: true,
  },
};

export default function ReportPage() {
  return <ReportClient />;
}
