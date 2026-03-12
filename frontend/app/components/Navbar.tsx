"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Navbar() {
  const pathname = usePathname();
  const isToolPage = pathname === "/tool";

  return (
    <nav
      className={`flex items-center justify-between px-8 py-5 border-b ${
        isToolPage
          ? "border-slate-700 bg-slate-900 text-slate-100"
          : "border-slate-200 bg-white text-slate-900"
      }`}
    >
      <Link
        href="/"
        className="text-xl font-semibold tracking-tight text-blue-600"
      >
        VegMap
      </Link>

      <div
        className={`flex gap-6 text-sm ${
          isToolPage ? "text-slate-300" : "text-slate-600"
        }`}
      >
        <Link href="/tool" className="hover:text-blue-600 transition">
          Tool
        </Link>

        <Link href="/pricing" className="hover:text-blue-600 transition">
          Pricing
        </Link>

        <Link href="/contact" className="hover:text-blue-600 transition">
          Contact
        </Link>
      </div>
    </nav>
  );
}