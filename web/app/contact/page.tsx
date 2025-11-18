'use client';

import { useState } from 'react';

export default function ContactPage() {
  const [status, setStatus] = useState<string | null>(null);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    await new Promise((r) => setTimeout(r, 500));
    setStatus("Thanks! We'll reach out shortly.");
    e.currentTarget.reset();
  }

  return (
    <section className="container max-w-2xl space-y-6">
      <h1 className="text-3xl font-bold">Let's talk</h1>
      <p className="text-slate-600">Tell us what you're looking for and we'll be in touch.</p>
      <form onSubmit={submit} className="space-y-4">
        <input name="name" placeholder="Your name" className="w-full rounded-xl border border-slate-200 px-3 py-2" required />
        <input name="email" type="email" placeholder="Email" className="w-full rounded-xl border border-slate-200 px-3 py-2" required />
        <textarea name="message" placeholder="What can we help with?" className="w-full rounded-xl border border-slate-200 px-3 py-2" rows={5} required />
        <button className="btn-primary">Send</button>
      </form>
      {status && <p className="text-green-700">{status}</p>}
    </section>
  );
}