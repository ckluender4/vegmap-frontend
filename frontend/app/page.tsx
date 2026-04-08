import Link from "next/link";
import WorkspaceMapPreview from "../components/WorkspaceMapPreview";

const reviews = [
  {
    quote:
      "VegMap made it much easier to move from raw spatial inputs to analysis-ready outputs without jumping across multiple tools.",
    name: "Beta User",
    role: "Landscape Ecologist",
  },
  {
    quote:
      "The interface feels purpose-built for real geospatial workflows. It cuts down setup time and keeps the analysis process organized.",
    name: "Beta User",
    role: "GIS Analyst",
  },
  {
    quote:
      "The sampling design workflow is especially useful. It gives a clearer path from environmental variability to defensible field locations.",
    name: "Beta User",
    role: "Research Scientist",
  },
];

export default function Home() {
  return (
    <main className="relative min-h-screen bg-slate-50 text-slate-900 overflow-hidden">
      {/* HERO GRADIENT BACKGROUND */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-40 left-1/3 w-[600px] h-[600px] bg-blue-400/20 blur-3xl rounded-full animate-pulse"></div>
        <div className="absolute top-60 -left-20 w-[500px] h-[500px] bg-indigo-400/10 blur-3xl rounded-full"></div>
      </div>

      {/* HERO */}
      <section className="relative mx-auto w-full max-w-screen-2xl px-8 py-28">
        <h1 className="text-5xl font-bold tracking-tight leading-tight mb-6">
          Spatial Analysis Tools
          <span className="text-blue-600"> for Landscape Science</span>
        </h1>

        <p className="text-lg text-slate-600 max-w-3xl mb-8 leading-relaxed">
          VegMap provides interactive tools and custom mapping services for vegetation analysis,
          environmental sampling design, and high-resolution geospatial workflows built for
          scientists, researchers, and land managers.
        </p>

        <div className="flex flex-wrap gap-4">
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

          <Link href="/tool?mode=eag-fronts">
            <button className="bg-emerald-700 text-white px-6 py-3 rounded-lg hover:bg-emerald-800 transition shadow-md">
              EAG Invasion Fronts
            </button>
          </Link>

          <Link href="/case-study">
            <button className="border border-slate-300 bg-white text-slate-900 px-6 py-3 rounded-lg hover:bg-slate-100 transition shadow-sm">
              View Case Study
            </button>
          </Link>

          <Link href="/uav-mapping">
            <button className="border border-blue-200 bg-blue-50 text-blue-900 px-6 py-3 rounded-lg hover:bg-blue-100 transition shadow-sm">
              Custom UAV Mapping
            </button>
          </Link>
        </div>
      </section>

      {/* TOOLS */}
      <section className="mx-auto w-full max-w-screen-2xl px-8 pb-24">
        <h2 className="text-3xl font-bold mb-4">Tool and Services</h2>

        <p className="text-slate-600 max-w-3xl mb-10">
          VegMap integrates multiple spatial analysis tools within a unified
          workspace designed for landscape research and environmental analysis.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="border border-slate-200 rounded-xl p-6 bg-white shadow-sm hover:shadow-md hover:-translate-y-1 transition">
            <h3 className="font-semibold text-lg mb-2 text-blue-700">
              Field-Based Vegetation Modeling
            </h3>

            <p className="text-slate-600 text-sm leading-relaxed">
              Train spatial vegetation models using field observations
              and environmental predictor layers.
            </p>
          </div>

          <div className="border border-slate-200 rounded-xl p-6 bg-white shadow-sm hover:shadow-md hover:-translate-y-1 transition">
            <h3 className="font-semibold text-lg mb-2 text-blue-700">
              Sampling Design
            </h3>

            <p className="text-slate-600 text-sm leading-relaxed">
              Identify environmentally representative monitoring locations
              using PCA-based environmental coverage algorithms.
            </p>
          </div>

          <div className="border border-slate-200 rounded-xl p-6 bg-white shadow-sm hover:shadow-md hover:-translate-y-1 transition">
            <h3 className="font-semibold text-lg mb-2 text-emerald-700">
              Exotic Annual Grass Invasion Fronts
            </h3>

            <p className="text-slate-600 text-sm leading-relaxed">
              Identify localized invasion and expansion fronts from annual grass
              cover time series and threshold-based spatial analysis.
            </p>
          </div>

          <div className="border border-slate-200 rounded-xl p-6 bg-white shadow-sm hover:shadow-md hover:-translate-y-1 transition">
            <h3 className="font-semibold text-lg mb-2 text-blue-700">
              Spatial Outputs
            </h3>

            <p className="text-slate-600 text-sm leading-relaxed">
              Export GeoTIFF and GeoJSON results ready for GIS workflows,
              modeling pipelines, and scientific analysis.
            </p>
          </div>

          <div className="border border-blue-200 rounded-xl p-6 bg-blue-50/60 shadow-sm hover:shadow-md hover:-translate-y-1 transition">
            <h3 className="font-semibold text-lg mb-2 text-blue-800">
              Custom UAV + CNN Mapping
            </h3>

            <p className="text-slate-700 text-sm leading-relaxed mb-4">
              Need ultra-high-resolution vegetation maps from UAV imagery? We offer
              custom imagery collection, CNN U-Net mapping, and management-ready
              spatial products for projects that go beyond the self-serve app.
            </p>

            <Link href="/uav-mapping" className="text-sm font-medium text-blue-700 hover:text-blue-800">
              Learn more →
            </Link>
          </div>

        </div>
      </section>

      {/* WORKSPACE PREVIEW */}
      <section className="mx-auto w-full max-w-screen-2xl px-8 pb-28">
        <h2 className="text-4xl font-bold mb-4">A Modern Geospatial Workspace</h2>

        <p className="text-lg text-slate-600 max-w-3xl mb-10">
          VegMap combines machine learning, spatial analysis, and interactive
          visualization into a unified platform for landscape science.
        </p>

        <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-slate-200">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-100/40 via-transparent to-transparent pointer-events-none"></div>

          <div className="bg-slate-900 text-slate-100">
            <div className="flex items-center gap-2 px-5 py-3 border-b border-slate-800 bg-slate-950">
              <div className="w-3 h-3 bg-red-400 rounded-full"></div>
              <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
              <div className="w-3 h-3 bg-green-400 rounded-full"></div>

              <span className="ml-3 text-xs text-slate-400">
                VegMap • Spatial Workspace
              </span>
            </div>

            <div className="relative h-[500px]">
              <WorkspaceMapPreview />

              <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent pointer-events-none"></div>

              <div className="absolute top-4 left-4 text-xs text-white/70 bg-black/40 px-3 py-1 rounded backdrop-blur-sm">
                VegMap Interactive Viewer
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="mx-auto w-full max-w-screen-2xl px-8 pb-28">
        <h2 className="text-3xl font-bold mb-3">How VegMap Works</h2>

        <p className="text-slate-600 max-w-3xl mb-10">
          VegMap simplifies complex spatial workflows by combining data
          upload, analysis tools, and visualization into a single interface.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
            <div className="text-blue-700 font-semibold mb-2 text-sm">STEP 1</div>

            <h3 className="text-lg font-semibold mb-2">Upload Spatial Data</h3>

            <p className="text-slate-600 text-sm leading-relaxed">
              Upload imagery or AOI boundaries to begin analysis.
            </p>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
            <div className="text-blue-700 font-semibold mb-2 text-sm">STEP 2</div>

            <h3 className="text-lg font-semibold mb-2">Run Analysis Tools</h3>

            <p className="text-slate-600 text-sm leading-relaxed">
              Launch vegetation models or sampling algorithms directly
              inside the VegMap workspace.
            </p>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
            <div className="text-blue-700 font-semibold mb-2 text-sm">STEP 3</div>

            <h3 className="text-lg font-semibold mb-2">Export Results</h3>

            <p className="text-slate-600 text-sm leading-relaxed">
              Download GeoTIFF and GeoJSON outputs ready for GIS and modeling.
            </p>
          </div>
        </div>
      </section>

      {/* REVIEWS */}
      <section className="mx-auto w-full max-w-screen-2xl px-8 pb-28">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-10">
          <div>
            <h2 className="text-3xl font-bold mb-3">What Early Users Are Saying</h2>
            <p className="text-slate-600 max-w-3xl">
              Placeholder testimonials for the current beta phase. These can be
              replaced later with direct user quotes, names, organizations, and
              tool-specific outcomes.
            </p>
          </div>

          <div className="text-sm text-slate-500">
            Beta feedback placeholders
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {reviews.map((review, index) => (
            <div
              key={index}
              className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition"
            >
              <div className="text-3xl leading-none text-blue-600 mb-4">“</div>

              <p className="text-slate-700 leading-relaxed mb-6">
                {review.quote}
              </p>

              <div className="border-t border-slate-100 pt-4">
                <div className="font-medium text-slate-900">{review.name}</div>
                <div className="text-sm text-slate-500">{review.role}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CASE STUDY PREVIEW */}
      <section className="mx-auto w-full max-w-screen-2xl px-8 pb-28">
        <div className="bg-white border border-slate-200 rounded-2xl p-10 shadow-sm">
          <div className="max-w-3xl">
            <div className="text-sm font-semibold uppercase tracking-wide text-blue-700 mb-3">
              Featured Case Study
            </div>

            <h2 className="text-3xl font-bold mb-4">
              See how VegMap supports real-world landscape analysis workflows
            </h2>

            <p className="text-slate-600 text-lg leading-relaxed mb-8">
              Explore an example workflow showing how VegMap can support
              spatially explicit analysis, monitoring design, and research-ready
              outputs from a single interface.
            </p>

            <Link href="/case-study">
              <button className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition shadow-md">
                Read the Case Study
              </button>
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-screen-2xl px-8 pb-28">
        <div className="bg-gradient-to-br from-blue-950 to-slate-900 text-slate-100 rounded-2xl p-10 shadow-2xl border border-blue-900/40">
          <div className="max-w-3xl">
            <div className="text-sm font-semibold uppercase tracking-wide text-blue-300 mb-3">
              Custom Service
            </div>

            <h2 className="text-3xl font-bold mb-4">
              Need UAV imagery collection and ultra-high-resolution vegetation mapping?
            </h2>

            <p className="text-slate-300 text-lg leading-relaxed mb-8">
              Some projects need more than a browser-based workflow. We provide
              custom UAV imagery acquisition, targeted labeling, CNN U-Net
              segmentation, and management-ready map products for restoration,
              treatment planning, and post-fire monitoring.
            </p>

            <div className="flex flex-wrap gap-4">
              <Link href="/uav-mapping">
                <button className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition shadow-md">
                  Explore the Service
                </button>
              </Link>

              <Link href="/contact">
                <button className="border border-slate-600 bg-transparent text-slate-100 px-6 py-3 rounded-lg hover:bg-slate-800 transition shadow-sm">
                  Contact Us
                </button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto w-full max-w-screen-2xl px-8 pb-32 text-center">
        <div className="bg-slate-900 text-slate-100 rounded-2xl p-12 shadow-2xl">
          <h2 className="text-3xl font-bold mb-4">
            Ready to Explore Your Landscape Data?
          </h2>

          <p className="text-slate-300 max-w-2xl mx-auto mb-8">
            Launch the VegMap workspace to start mapping vegetation,
            designing monitoring networks, and running spatial analysis tools.
          </p>

          <div className="flex justify-center gap-4 flex-wrap">
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

            <Link href="/tool?mode=eag-fronts">
              <button className="bg-emerald-700 text-white px-6 py-3 rounded-lg hover:bg-emerald-800 transition shadow-md">
                EAG Invasion Fronts
              </button>
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}