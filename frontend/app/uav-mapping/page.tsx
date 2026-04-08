import Link from "next/link";

export default function UavMappingPage() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <section className="relative overflow-hidden border-b border-slate-800 bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950/40">
        <div className="mx-auto max-w-7xl px-6 py-20 lg:px-8 lg:py-28">
          <div className="grid gap-12 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
            <div>
              <div className="mb-4 inline-flex rounded-full border border-blue-500/30 bg-blue-500/10 px-3 py-1 text-xs font-medium tracking-wide text-blue-300">
                Custom UAV Mapping Service
              </div>
              <h1 className="max-w-4xl text-4xl font-semibold tracking-tight text-white sm:text-5xl lg:text-6xl">
                Ultra-high-resolution UAV vegetation mapping for treatment planning and post-fire restoration.
              </h1>
              <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-300">
                When a standard web workflow is not enough, we provide end-to-end custom mapping services using UAV imagery,
                targeted field labeling, and CNN U-Net segmentation to produce management-ready vegetation maps at sub-meter resolution.
              </p>

              <div className="mt-8 flex flex-wrap gap-4">
                <Link
                  href="/contact"
                  className="rounded-2xl bg-blue-600 px-5 py-3 text-sm font-medium text-white shadow-lg shadow-blue-900/30 transition hover:bg-blue-500"
                >
                  Request a consultation
                </Link>
                <Link
                  href="/case-study"
                  className="rounded-2xl border border-slate-700 px-5 py-3 text-sm font-medium text-slate-200 transition hover:border-slate-500 hover:bg-slate-900"
                >
                  View case study
                </Link>
              </div>

              <div className="mt-10 grid gap-4 sm:grid-cols-3">
                {[
                  ["Spatial grain", "Sub-meter to 0.25 m outputs"],
                  ["Best fit", "Patch-scale treatment targeting"],
                  ["Delivery", "Custom map products and support"],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
                    <div className="text-xs uppercase tracking-wide text-slate-400">{label}</div>
                    <div className="mt-2 text-sm font-medium text-slate-100">{value}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6 shadow-2xl shadow-black/30">
              <div className="rounded-2xl border border-slate-800 bg-slate-950 p-6">
                <h2 className="text-lg font-semibold text-white">Why this is a custom service</h2>
                <p className="mt-3 text-sm leading-7 text-slate-300">
                  UAV orthomosaics, segmentation masks, model training, and large-area inference can exceed the practical limits of a lightweight web app.
                  This service is designed for clients who need high-resolution deliverables, ecological interpretation, and direct support from collection through map delivery.
                </p>
                <div className="mt-6 space-y-3 text-sm text-slate-300">
                  <div className="rounded-xl border border-slate-800 bg-slate-900 px-4 py-3">
                    Flight planning and acquisition matched to phenology and project goals
                  </div>
                  <div className="rounded-xl border border-slate-800 bg-slate-900 px-4 py-3">
                    Targeted field labeling and class design for operational decision-making
                  </div>
                  <div className="rounded-xl border border-slate-800 bg-slate-900 px-4 py-3">
                    CNN U-Net modeling, post-processing, QA, and management-ready outputs
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-16 lg:px-8">
        <div className="max-w-3xl">
          <h2 className="text-3xl font-semibold text-white">What this service is designed for</h2>
          <p className="mt-4 text-base leading-8 text-slate-300">
            This offering is built for projects where broad regional products are too coarse and management depends on the fine-scale mosaic of invasive annual grasses,
            perennial refugia, shrub structure, or other vegetation patterns that control treatment placement and treatment interpretation.
          </p>
        </div>

        <div className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {[
            {
              title: "Pre-treatment planning",
              body: "Identify patch-scale invasion, residual perennial grasses, and treatment priority zones before herbicide or seeding operations.",
            },
            {
              title: "Post-fire restoration",
              body: "Map vegetation patterns across burned landscapes to guide restoration placement and assess recovery potential.",
            },
            {
              title: "Treatment evaluation",
              body: "Compare treatment units beyond average conditions and examine the actual mosaic that remains after management.",
            },
            {
              title: "Custom ecological products",
              body: "Develop class schemes and map outputs tailored to your species, fuels, or restoration questions.",
            },
          ].map((item) => (
            <div key={item.title} className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6">
              <h3 className="text-lg font-semibold text-white">{item.title}</h3>
              <p className="mt-3 text-sm leading-7 text-slate-300">{item.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="border-y border-slate-800 bg-slate-900/60">
        <div className="mx-auto max-w-7xl px-6 py-16 lg:px-8">
          <div className="grid gap-8 lg:grid-cols-2">
            <div>
              <h2 className="text-3xl font-semibold text-white">How the workflow works</h2>
              <p className="mt-4 max-w-2xl text-base leading-8 text-slate-300">
                The workflow is designed to move from raw imagery to management-ready maps quickly while keeping the class design and outputs tied to real field decisions.
              </p>
            </div>
            <div className="rounded-3xl border border-slate-800 bg-slate-950/70 p-6 text-sm text-slate-300">
              Typical deliverables include orthomosaics, classified vegetation maps, class summaries, confidence-aware outputs, and consultation on interpretation and use.
            </div>
          </div>

          <div className="mt-10 grid gap-4 lg:grid-cols-5">
            {[
              ["1", "Scope", "Define the management question, site constraints, target classes, and final deliverables."],
              ["2", "Collect", "Acquire UAV imagery during the best phenological window for class separation."],
              ["3", "Label", "Develop targeted polygon labels that capture the conditions that matter most on the ground."],
              ["4", "Model", "Train and run a CNN U-Net workflow with post-processing for cleaner, ecologically useful outputs."],
              ["5", "Deliver", "Provide high-resolution maps, export files, and interpretation support for management use."],
            ].map(([step, title, body]) => (
              <div key={step} className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
                <div className="text-sm font-semibold text-blue-300">Step {step}</div>
                <div className="mt-2 text-base font-medium text-white">{title}</div>
                <p className="mt-3 text-sm leading-7 text-slate-300">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-16 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-2">
          <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-8">
            <h2 className="text-2xl font-semibold text-white">Example outputs</h2>
            <div className="mt-6 space-y-4 text-sm text-slate-300">
              <div className="rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3">Orthomosaic and project imagery archive</div>
              <div className="rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3">High-resolution classified vegetation raster</div>
              <div className="rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3">Class summaries and area estimates</div>
              <div className="rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3">Map layouts or GIS-ready export files</div>
              <div className="rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3">Interpretation support for treatment planning or evaluation</div>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-8">
            <h2 className="text-2xl font-semibold text-white">Good fit for clients who need</h2>
            <div className="mt-6 space-y-4 text-sm text-slate-300">
              <div className="rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3">Patch-scale vegetation mapping that broad products cannot resolve</div>
              <div className="rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3">Species or class schemes tailored to local restoration questions</div>
              <div className="rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3">A service team that can help plan, build, and interpret the workflow</div>
              <div className="rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3">A custom approach when the standard self-serve web tool is not the right fit</div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-slate-800 bg-gradient-to-r from-blue-950/30 to-slate-950">
        <div className="mx-auto max-w-7xl px-6 py-16 lg:px-8">
          <div className="rounded-3xl border border-blue-900/30 bg-slate-900/80 p-8 lg:flex lg:items-center lg:justify-between lg:gap-8">
            <div className="max-w-3xl">
              <h2 className="text-3xl font-semibold text-white">Need a custom UAV mapping project?</h2>
              <p className="mt-4 text-base leading-8 text-slate-300">
                Tell us about your site, timeline, target species or classes, and the management decisions the map needs to support. We can help determine whether a custom UAV + CNN workflow is the right fit.
              </p>
            </div>
            <div className="mt-8 flex shrink-0 flex-wrap gap-4 lg:mt-0">
              <Link
                href="/contact"
                className="rounded-2xl bg-blue-600 px-5 py-3 text-sm font-medium text-white transition hover:bg-blue-500"
              >
                Contact us
              </Link>
              <a
                href="mailto:hello@example.com?subject=Custom%20UAV%20Mapping%20Project"
                className="rounded-2xl border border-slate-700 px-5 py-3 text-sm font-medium text-slate-200 transition hover:border-slate-500 hover:bg-slate-950"
              >
                Email directly
              </a>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
