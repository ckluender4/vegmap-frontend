import Link from "next/link";
import WorkspaceMapPreview from "../components/WorkspaceMapPreview";

export default function Home() {
  return (
    <main className="relative min-h-screen bg-slate-50 text-slate-900 overflow-hidden">

      {/* HERO GRADIENT BACKGROUND */}
      <div className="absolute inset-0 pointer-events-none">

        {/* blue glow */}
        <div className="absolute -top-40 left-1/3 w-[600px] h-[600px] bg-blue-400/20 blur-3xl rounded-full animate-pulse"></div>

        {/* secondary glow */}
        <div className="absolute top-60 -left-20 w-[500px] h-[500px] bg-indigo-400/10 blur-3xl rounded-full"></div>

      </div>


      {/* HERO */}
      <section className="relative px-8 py-28 max-w-5xl mx-auto">

        <h1 className="text-5xl font-bold tracking-tight leading-tight mb-6">
          Spatial Analysis Tools
          <span className="text-blue-600"> for Landscape Science</span>
        </h1>

        <p className="text-lg text-slate-600 max-w-3xl mb-8 leading-relaxed">
          VegMap provides interactive tools for vegetation mapping,
          environmental sampling design, and geospatial analysis —
          built for scientists, researchers, and land managers.
        </p>

        <div className="flex gap-4">

          <Link href="/tool?mode=sampling">
            <button className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition shadow-md">
              Sampling Design
            </button>
          </Link>

          <Link href="/tool?mode=field-model">
            <button className="bg-slate-800 text-white px-6 py-3 rounded-lg hover:bg-slate-900 transition shadow-md">
              Field Vegetation Modeling
            </button>
          </Link>

        </div>

      </section>


      {/* TOOLS */}
      <section className="px-8 pb-24 max-w-6xl mx-auto">

        <h2 className="text-3xl font-bold mb-4">
          Analysis Tools
        </h2>

        <p className="text-slate-600 max-w-3xl mb-10">
          VegMap integrates multiple spatial analysis tools within a unified
          workspace designed for landscape research and environmental analysis.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

          {/* TOOL CARD */}
          {/* <div className="border border-slate-200 rounded-xl p-6 bg-white shadow-sm hover:shadow-md hover:-translate-y-1 transition">

            <h3 className="font-semibold text-lg mb-2 text-blue-700">
              Vegetation Mapping
            </h3>

            <p className="text-slate-600 text-sm leading-relaxed">
              Generate high-resolution vegetation maps using deep learning
              models applied to aerial imagery and satellite datasets.
            </p>

          </div> */}

          {/* TOOL CARD */}
          <div className="border border-slate-200 rounded-xl p-6 bg-white shadow-sm hover:shadow-md hover:-translate-y-1 transition">

            <h3 className="font-semibold text-lg mb-2 text-blue-700">
              Field-Based Vegetation Modeling
            </h3>

            <p className="text-slate-600 text-sm leading-relaxed">
              Train spatial vegetation models using field observations
              and environmental predictor layers.
            </p>

          </div>

          {/* TOOL CARD */}
          <div className="border border-slate-200 rounded-xl p-6 bg-white shadow-sm hover:shadow-md hover:-translate-y-1 transition">

            <h3 className="font-semibold text-lg mb-2 text-blue-700">
              Sampling Design
            </h3>

            <p className="text-slate-600 text-sm leading-relaxed">
              Identify environmentally representative monitoring locations
              using PCA-based environmental coverage algorithms.
            </p>

          </div>

          {/* TOOL CARD */}
          <div className="border border-slate-200 rounded-xl p-6 bg-white shadow-sm hover:shadow-md hover:-translate-y-1 transition">

            <h3 className="font-semibold text-lg mb-2 text-blue-700">
              Spatial Outputs
            </h3>

            <p className="text-slate-600 text-sm leading-relaxed">
              Export GeoTIFF and GeoJSON results ready for GIS workflows,
              modeling pipelines, and scientific analysis.
            </p>

          </div>

        </div>

      </section>


      {/* WORKSPACE PREVIEW */}
      <section className="px-8 pb-28 max-w-6xl mx-auto">

        <h2 className="text-4xl font-bold mb-4">
          A Modern Geospatial Workspace
        </h2>

        <p className="text-lg text-slate-600 max-w-3xl mb-10">
          VegMap combines machine learning, spatial analysis, and interactive
          visualization into a unified platform for landscape science.
        </p>


        <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-slate-200">

          {/* subtle gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-blue-100/40 via-transparent to-transparent pointer-events-none"></div>


          {/* fake app window */}
          <div className="bg-slate-900 text-slate-100">

            {/* window header */}
            <div className="flex items-center gap-2 px-5 py-3 border-b border-slate-800 bg-slate-950">

              <div className="w-3 h-3 bg-red-400 rounded-full"></div>
              <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
              <div className="w-3 h-3 bg-green-400 rounded-full"></div>

              <span className="ml-3 text-xs text-slate-400">
                VegMap • Spatial Workspace
              </span>

            </div>


            {/* workspace preview */}
            <div className="relative h-[500px]">

              <WorkspaceMapPreview />

              {/* subtle gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent pointer-events-none"></div>

              {/* preview label */}
              <div className="absolute top-4 left-4 text-xs text-white/70 bg-black/40 px-3 py-1 rounded backdrop-blur-sm">
                VegMap Interactive Viewer
              </div>

            </div>

          </div>

        </div>



      </section>


      {/* HOW IT WORKS */}
      <section className="px-8 pb-28 max-w-6xl mx-auto">

        <h2 className="text-3xl font-bold mb-3">
          How VegMap Works
        </h2>

        <p className="text-slate-600 max-w-3xl mb-10">
          VegMap simplifies complex spatial workflows by combining data
          upload, analysis tools, and visualization into a single interface.
        </p>


        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
            <div className="text-blue-700 font-semibold mb-2 text-sm">
              STEP 1
            </div>

            <h3 className="text-lg font-semibold mb-2">
              Upload Spatial Data
            </h3>

            <p className="text-slate-600 text-sm leading-relaxed">
              Upload imagery or AOI boundaries to begin analysis.
            </p>
          </div>


          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
            <div className="text-blue-700 font-semibold mb-2 text-sm">
              STEP 2
            </div>

            <h3 className="text-lg font-semibold mb-2">
              Run Analysis Tools
            </h3>

            <p className="text-slate-600 text-sm leading-relaxed">
              Launch vegetation models or sampling algorithms directly
              inside the VegMap workspace.
            </p>
          </div>


          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
            <div className="text-blue-700 font-semibold mb-2 text-sm">
              STEP 3
            </div>

            <h3 className="text-lg font-semibold mb-2">
              Export Results
            </h3>

            <p className="text-slate-600 text-sm leading-relaxed">
              Download GeoTIFF and GeoJSON outputs ready for GIS and modeling.
            </p>
          </div>

        </div>

      </section>


      {/* CTA */}
      <section className="px-8 pb-32 max-w-5xl mx-auto text-center">

        <div className="bg-slate-900 text-slate-100 rounded-2xl p-12 shadow-2xl">

          <h2 className="text-3xl font-bold mb-4">
            Ready to Explore Your Landscape Data?
          </h2>

          <p className="text-slate-300 max-w-2xl mx-auto mb-8">
            Launch the VegMap workspace to start mapping vegetation,
            designing monitoring networks, and running spatial analysis tools.
          </p>

          <div className="flex gap-4">

            <Link href="/tool?mode=sampling">
              <button className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition shadow-md">
                Sampling Design
              </button>
            </Link>

            <Link href="/tool?mode=field-model">
              <button className="bg-slate-800 text-white px-6 py-3 rounded-lg hover:bg-slate-900 transition shadow-md">
                Field Vegetation Modeling
              </button>
            </Link>

          </div>

        </div>

      </section>

    </main >
  );
}