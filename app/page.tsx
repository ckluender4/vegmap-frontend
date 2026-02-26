import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">

      {/* HERO */}
      <section className="px-8 py-24 max-w-5xl mx-auto">
        <h1 className="text-5xl font-bold tracking-tight leading-tight mb-6">
          AI Vegetation Mapping
          <span className="text-blue-700"> for Landscapes</span>
        </h1>

        <p className="text-lg text-slate-600 max-w-3xl mb-8 leading-relaxed">
          A deep learning platform for generating high-resolution vegetation
          maps from imagery. Built for scientific workflows and modern land
          management applications.
        </p>

        <Link href="/tool">
          <button className="bg-blue-700 text-white px-6 py-3 rounded-lg hover:bg-blue-800 transition shadow-sm">
            Open Mapping Tool
          </button>
        </Link>
      </section>

      {/* FEATURE GRID */}
      <section className="px-8 pb-20 max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">

        <div className="border border-blue-100 rounded-xl p-6 bg-white shadow-sm">
          <h3 className="font-semibold text-lg mb-2 text-blue-700">
            Scientific Accuracy
          </h3>
          <p className="text-slate-600 text-sm leading-relaxed">
            Designed for ecological workflows and reproducible spatial analysis.
          </p>
        </div>

        <div className="border border-blue-100 rounded-xl p-6 bg-white shadow-sm">
          <h3 className="font-semibold text-lg mb-2 text-blue-700">
            GPU Accelerated
          </h3>
          <p className="text-slate-600 text-sm leading-relaxed">
            Deep learning inference running on GPU infrastructure for fast processing.
          </p>
        </div>

        <div className="border border-blue-100 rounded-xl p-6 bg-white shadow-sm">
          <h3 className="font-semibold text-lg mb-2 text-blue-700">
            GeoTIFF Outputs
          </h3>
          <p className="text-slate-600 text-sm leading-relaxed">
            Outputs ready for ArcGIS, QGIS, and modeling workflows.
          </p>
        </div>

      </section>

    </main>
  );
}