import Link from "next/link";

export default function NotFound() {
  return <main className="grid min-h-screen place-items-center bg-[#f3f5f3] p-5"><section className="card qc-card max-w-lg p-7 text-center sm:p-10"><p className="text-sm font-black uppercase tracking-[.14em] text-amber-700">404</p><h1 className="mt-3 text-3xl font-black">Page not found</h1><p className="muted mt-3 leading-7">The page may have moved, or the link may no longer be available.</p><Link className="btn btn-primary mt-6" href="/">Return home</Link></section></main>;
}
