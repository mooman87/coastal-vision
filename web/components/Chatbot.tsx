'use client';

import { useEffect, useRef, useState } from 'react';
import { sendChat } from '../lib/api';

export default function Chatbot() {
  const [open, setOpen] = useState(true);
  const [messages, setMessages] = useState<{ role: 'user' | 'assistant'; content: string }[]>([
    { role: 'assistant', content: "Hi! I'm Rachel, your friendly real estate assistant. How can I help today?" }
  ]);
  const [input, setInput] = useState('');
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  async function handleSend(e?: React.FormEvent) {
    e?.preventDefault();
    const text = input.trim();
    if (!text) return;

    // Add user message to the UI
    setMessages((m) => [...m, { role: 'user', content: text }]);
    setInput('');

    try {
      // ✅ send an object, not a raw string
      const response = await sendChat({ message: text });

      // Assuming backend returns: { reply: "..." }
      setMessages((m) => [
        ...m,
        { role: 'assistant', content: response.reply },
      ]);
    } catch (err) {
      setMessages((m) => [
        ...m,
        {
          role: 'assistant',
          content: 'Sorry, I had trouble replying. Try again in a moment.',
        },
      ]);
      console.error(err);
    }
  }

  return (
    <div id="chat" className="fixed bottom-6 right-6 z-50">
      <button
        onClick={() => setOpen(!open)}
        className="btn-primary shadow-soft"
        aria-expanded={open}
      >
        {open ? 'Hide Chat' : 'Chat'}
      </button>

      {open && (
        <div className="card mt-3 w-[360px] max-w-[90vw]">
          <div className="border-b border-slate-100 p-3">
            <p className="font-semibold">Chat with Rachel</p>
            <p className="text-xs text-slate-500">
              Ask about neighborhoods, financing, or booking a tour.
            </p>
          </div>
          <div ref={listRef} className="h-64 overflow-y-auto p-3 space-y-2">
            {messages.map((m, i) => (
              <div key={i} className={m.role === 'user' ? 'text-right' : 'text-left'}>
                <span
                  className={
                    m.role === 'user'
                      ? 'inline-block rounded-2xl bg-brand-600 px-3 py-2 text-white'
                      : 'inline-block rounded-2xl bg-slate-100 px-3 py-2'
                  }
                >
                  {m.content}
                </span>
              </div>
            ))}
          </div>
          <form onSubmit={handleSend} className="flex items-center gap-2 p-3">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your question..."
              className="flex-1 rounded-xl border border-slate-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-300"
            />
            <button type="submit" className="btn-primary">
              Send
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
