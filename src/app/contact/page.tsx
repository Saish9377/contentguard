import type { Metadata } from 'next';
import { ContactClient } from './ContactClient';

export const metadata: Metadata = {
  title: 'Contact Us — ContentGuard AI',
  description: 'Get in touch with ContentGuard AI support, feedback, and partnerships team.',
};

export default function ContactPage() {
  return <ContactClient />;
}
