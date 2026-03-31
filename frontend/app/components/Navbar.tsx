"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useRef, useEffect } from "react";

export default function Navbar() {
  const pathname = usePathname();
  const isToolPage = pathname.startsWith("/tool");

  const [open, setOpen] = useState(false);

  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <nav
      className={`flex items-center justify-between px-8 py-5 border-b ${isToolPage
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
        className={`flex gap-6 text-sm items-center ${isToolPage ? "text-slate-300" : "text-slate-600"
          }`}
      >
        <div ref={menuRef} className="relative">
          <button
            onClick={() => setOpen(!open)}
            className="hover:text-blue-600 transition flex items-center gap-1"
          >
            Tools
            <span
              className={`text-xs transition-transform ${open ? "rotate-180" : ""
                }`}
            >
              ▼
            </span>
          </button>

          {open && (
            <div className="absolute top-10 left-1/2 -translate-x-1/2 w-80 rounded-xl border border-slate-200 bg-white shadow-xl py-2 z-50">
              <Link
                href="/tool?mode=sampling"
                onClick={() => setOpen(false)}
                className="block px-4 py-3 hover:bg-slate-50 transition"
              >
                <div className="flex gap-3">
                  <div className="text-lg">📍</div>
                  <div>
                    <div className="text-sm font-medium text-slate-900">
                      Sampling Design
                    </div>
                    <div className="text-xs text-slate-500">
                      Environmentally representative monitoring locations
                    </div>
                  </div>
                </div>
              </Link>

              <Link
                href="/tool?mode=field-model"
                onClick={() => setOpen(false)}
                className="block px-4 py-3 hover:bg-slate-50 transition"
              >
                <div className="flex gap-3">
                  <div className="text-lg">🌱</div>
                  <div>
                    <div className="text-sm font-medium text-slate-900">
                      Field-Based Vegetation Modeling
                    </div>
                    <div className="text-xs text-slate-500">
                      Train spatial vegetation models from field data points
                    </div>
                  </div>
                </div>
              </Link>

              <Link
                href="/tool?mode=eag-fronts"
                onClick={() => setOpen(false)}
                className="block px-4 py-3 hover:bg-slate-50 transition"
              >
                <div className="flex gap-3">
                  <div className="text-lg">🌾</div>
                  <div>
                    <div className="text-sm font-medium text-slate-900">
                      Exotic Annual Grass Invasion Fronts
                    </div>
                    <div className="text-xs text-slate-500">
                      Distance-weighted kernel mapping of likely invasion fronts
                    </div>
                  </div>
                </div>
              </Link>

              <div className="border-t border-slate-200 my-2"></div>

              <div className="px-4 py-2 text-xs text-slate-400 uppercase tracking-wide">
                Coming Soon
              </div>

              <div className="px-4 py-3 flex gap-3 opacity-60">
                <div className="text-lg">🌿</div>
                <div>
                  <div className="text-sm font-medium text-slate-700">
                    Deep Learning Vegetation Classification
                  </div>
                  <div className="text-xs text-slate-500">
                    Semantic segmentation of vegetation from aerial imagery
                  </div>
                </div>
              </div>

              <div className="px-4 py-3 flex gap-3 opacity-60">
                <div className="text-lg">🔥</div>
                <div>
                  <div className="text-sm font-medium text-slate-700">
                    Fire Spread Modeling
                  </div>
                  <div className="text-xs text-slate-500">
                    Burn probability and fire behavior simulation
                  </div>
                </div>
              </div>

              <div className="px-4 py-3 flex gap-3 opacity-60">
                <div className="text-lg">🌎</div>
                <div>
                  <div className="text-sm font-medium text-slate-700">
                    Carbon Mapping
                  </div>
                  <div className="text-xs text-slate-500">
                    Spatial prediction of soil carbon stocks
                  </div>
                </div>
              </div>

              <div className="px-4 py-3 flex gap-3 opacity-60">
                <div className="text-lg">🛰</div>
                <div>
                  <div className="text-sm font-medium text-slate-700">
                    UAV Analysis
                  </div>
                  <div className="text-xs text-slate-500">
                    Drone imagery classification and mapping
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <Link href="/case-study" className="hover:text-blue-600 transition">
          Case Study
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