import { HomePage } from '@/client/components/website/home-page';
import React from 'react';

export const revalidate = 3600; // Revalidate every hour

export default function Page() {
  return <HomePage />;
}
