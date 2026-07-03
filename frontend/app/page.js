"use client";

import Link from 'next/link';

export default function Home() {
  return (
    <main style={{ padding: '2rem' }}>
      <h1>Welcome to Career Dashboard</h1>
      <p>Choose a module to get started:</p>
      <ul style={{ marginTop: '2rem', listStyle: 'none' }}>
        <li><Link href="/login">Login</Link></li>
        <li><Link href="/summarizer">AI Notes Summarizer</Link></li>
        <li><Link href="/career">Career Intelligence</Link></li>
        <li><Link href="/knowledge-gap">Knowledge Gap Analysis</Link></li>
      </ul>
    </main>
  );
}
