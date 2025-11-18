import Link from 'next/link';

export default function Navbar() {
  return (
    <header className="border-b border-slate-100">
      <div className="container flex h-16 items-center justify-between">
        <Link href="/" className="text-xl font-semibold">Coastal Vision</Link>
        <nav className="flex items-center gap-6 text-sm">
          <Link href="/listings" className="hover:underline">Listings</Link>
          <Link href="/contact" className="hover:underline">Contact</Link>
          <Link href="/login" className="hover:underline">B/A Login</Link>
          <Link href="/register" className="hover:underline">B/A Register</Link>
          <a href="#chat" className="btn-ghost">Chat</a>
        </nav>
      </div>
    </header>
  );
}