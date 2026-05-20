'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function SentencesRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/learn/vocabulary?tab=sentences');
  }, [router]);
  return null;
}
