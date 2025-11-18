export default function Footer() {
  return (
    <footer className="border-t border-slate-100">
      <div className="container py-8 text-sm text-slate-600">
        © {new Date().getFullYear()} Coastal Vision. All rights reserved.
      </div>
    </footer>
  );
}