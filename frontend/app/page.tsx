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

      {/* PRODUCT PREVIEW */}
      <section className="px-8 pb-28 max-w-6xl mx-auto">

        <h2 className="text-4xl font-bold mb-4 text-slate-900">
          Experience the Future of Vegetation Mapping
        </h2>

        <p className="text-lg text-slate-600 max-w-3xl mb-10">
          VegMap brings deep learning inference into a modern scientific workspace —
          enabling researchers and land managers to produce analysis-ready vegetation maps in minutes.
        </p>

        <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-slate-200">

          {/* subtle glow */}
          <div className="absolute inset-0 bg-gradient-to-br from-blue-100/40 via-transparent to-transparent pointer-events-none"></div>

          {/* fake app window */}
          <div className="bg-slate-900 text-slate-100">

            {/* top bar */}
            <div className="flex items-center gap-2 px-5 py-3 border-b border-slate-800 bg-slate-950">
              <div className="w-3 h-3 bg-red-400 rounded-full"></div>
              <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
              <div className="w-3 h-3 bg-green-400 rounded-full"></div>
              <span className="ml-3 text-xs text-slate-400">
                VegMap • Mapping Workspace
              </span>
            </div>

            {/* app body */}
            <div className="grid grid-cols-1 md:grid-cols-4 min-h-[420px]">

              {/* sidebar preview */}
              <div className="border-r border-slate-800 bg-slate-900 p-5 space-y-3">
                <div className="h-8 bg-slate-700 rounded"></div>
                <div className="h-6 bg-slate-700 rounded"></div>
                <div className="h-6 bg-slate-700 rounded"></div>
                <div className="h-10 bg-blue-600 rounded mt-4"></div>
              </div>

              {/* workspace preview */}
              <div className="md:col-span-3 bg-slate-950 flex items-center justify-center text-slate-400 text-sm">
                High-resolution map workspace preview
              </div>

            </div>
          </div>

        </div>

      </section>

      {/* HOW IT WORKS */}
      <section className="px-8 pb-28 max-w-6xl mx-auto">

        <h2 className="text-3xl font-bold mb-3 text-slate-900">
          How VegMap Works
        </h2>

        <p className="text-slate-600 max-w-3xl mb-10">
          Designed for scientists and land managers — from imagery upload to
          analysis-ready outputs in a simple, reproducible workflow.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

          {/* STEP 1 */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
            <div className="text-blue-700 font-semibold mb-2 text-sm">
              STEP 1
            </div>
            <h3 className="text-lg font-semibold mb-2 text-slate-900">
              Upload Imagery
            </h3>
            <p className="text-slate-600 text-sm leading-relaxed">
              Upload RGB imagery or GeoTIFF datasets directly into the workspace.
            </p>
          </div>

          {/* STEP 2 */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
            <div className="text-blue-700 font-semibold mb-2 text-sm">
              STEP 2
            </div>
            <h3 className="text-lg font-semibold mb-2 text-slate-900">
              Run AI Model
            </h3>
            <p className="text-slate-600 text-sm leading-relaxed">
              Configure model settings and launch GPU-accelerated inference.
            </p>
          </div>

          {/* STEP 3 */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
            <div className="text-blue-700 font-semibold mb-2 text-sm">
              STEP 3
            </div>
            <h3 className="text-lg font-semibold mb-2 text-slate-900">
              Download Outputs
            </h3>
            <p className="text-slate-600 text-sm leading-relaxed">
              Export analysis-ready GeoTIFF outputs for GIS, modeling, and reporting.
            </p>
          </div>

        </div>

      </section>


      {/* FINAL CTA */}
      <section className="px-8 pb-28 max-w-5xl mx-auto text-center">

        <div className="bg-slate-900 text-slate-100 rounded-2xl p-12 shadow-2xl">

          <h2 className="text-3xl font-bold mb-4">
            Ready to Map Smarter?
          </h2>

          <p className="text-slate-300 max-w-2xl mx-auto mb-8">
            VegMap brings modern deep learning workflows into a clean scientific interface —
            helping researchers and land managers generate reproducible vegetation maps faster.
          </p>

          <a
            href="/tool"
            className="inline-block bg-blue-600 hover:bg-blue-700 transition px-8 py-3 rounded-lg font-medium text-white shadow-md"
          >
            Open Mapping Tool
          </a>

        </div>

      </section>

    </main>
  );
}