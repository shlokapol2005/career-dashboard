'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * This page has been merged into /career.
 * Redirect anyone who visits /knowledge-gap to /career.
 */
export default function KnowledgeGapRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/career');
  }, [router]);
  return null;
}
