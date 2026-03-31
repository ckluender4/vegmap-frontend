import Link from "next/link";
import Image from "next/image";

const workflowSteps = [
  {
    eyebrow: "Step 1",
    title: "Sampling Design",
    description:
      "VegMap identifies environmentally representative monitoring locations within the uploaded area of interest. This workflow helps users move from a landscape boundary to a defensible set of field locations.",
    output:
      "Output: sampling points and environmental coverage diagnostics ready for export to GIS and field planning workflows.",
    image: "/case-study/sampling-design.png",
    alt: "VegMap sampling design workspace showing recommended monitoring locations and environmental coverage chart.",
  },
  {
    eyebrow: "Step 2",
    title: "Field-Based Vegetation Modeling",
    description:
      "Users can upload field observations and train a spatial vegetation model directly in the workspace. The interface keeps the AOI, training data, and model settings in one place.",
    output:
      "Output: trained model diagnostics and a structured workflow for generating spatial vegetation predictions.",
    image: "/case-study/field-model-inputs.png",
    alt: "VegMap field-based vegetation modeling workspace showing uploaded field points and model settings.",
  },
  {
    eyebrow: "Step 3",
    title: "Predicted Vegetation Map",
    description:
      "After model training, VegMap generates a spatial prediction surface that can be reviewed in the browser against the AOI and basemap imagery.",
    output:
      "Output: GIS-ready prediction raster with map-based visualization and downloadable results.",
    image: "/case-study/field-model-prediction.png",
    alt: "VegMap field-based vegetation modeling workspace showing predicted vegetation map and model performance panel.",
  },
  {
    eyebrow: "Step 4",
    title: "Exotic Annual Grass Invasion Fronts",
    description:
      "VegMap can also identify likely invasion and expansion fronts from annual grass cover time series using threshold-based spatial analysis.",
    output:
      "Output: exportable kernel raster highlighting localized areas of likely invasion pressure.",
    image: "/case-study/eag-invasion-fronts.png",
    alt: "VegMap exotic annual grass invasion front workspace showing mapped invasion front outputs.",
  },
];

export default function CaseStudyPage() {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <section className="mx-auto w-full max-w-6xl px-8 py-24">
        <div className="mb-12">
          <div className="text-sm font-semibold uppercase tracking-wide text-blue-700 mb-3">
            Case Study
          </div>

          <h1 className="text-5xl font-bold tracking-tight leading-tight mb-6">
            From landscape boundary to analysis-ready spatial outputs
          </h1>

          <p className="text-lg text-slate-600 max-w-3xl leading-relaxed">
            This example case study shows how VegMap supports applied spatial
            analysis workflows by combining monitoring design, field-based
            modeling, and map-based outputs in a single geospatial workspace.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
            <div className="text-sm text-slate-500 mb-2">Project Type</div>
            <div className="font-semibold text-slate-900">
              Landscape Analysis Workflow
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
            <div className="text-sm text-slate-500 mb-2">Primary Use Case</div>
            <div className="font-semibold text-slate-900">
              Monitoring design and vegetation mapping
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
            <div className="text-sm text-slate-500 mb-2">Outputs</div>
            <div className="font-semibold text-slate-900">
              Maps, points, diagnostics, and GIS-ready exports
            </div>
          </div>
        </div>

        <div className="space-y-16">
          <section>
            <h2 className="text-2xl font-bold mb-4">Overview</h2>
            <p className="text-slate-700 leading-relaxed max-w-3xl">
              Land managers and researchers often need tools that move cleanly
              from uploaded inputs to interpretable outputs. VegMap is designed
              to reduce workflow fragmentation by keeping analysis, mapping, and
              export in one interface.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-6">Workflow in practice</h2>

            <div className="space-y-12">
              {workflowSteps.map((step, index) => (
                <div
                  key={index}
                  className="bg-white border border-slate-200 rounded-2xl p-6 md:p-8 shadow-sm"
                >
                  <div className="mb-6">
                    <div className="text-sm font-semibold uppercase tracking-wide text-blue-700 mb-2">
                      {step.eyebrow}
                    </div>

                    <h3 className="text-2xl font-bold mb-3">{step.title}</h3>

                    <p className="text-slate-700 leading-relaxed mb-3 max-w-3xl">
                      {step.description}
                    </p>

                    <p className="text-slate-600 leading-relaxed max-w-3xl">
                      {step.output}
                    </p>
                  </div>

                  <div className="overflow-hidden rounded-xl border border-slate-200 bg-slate-100">
                    <Image
                      src={step.image}
                      alt={step.alt}
                      width={1600}
                      height={1100}
                      className="w-full h-auto"
                      priority={index === 0}
                    />
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">Why it matters</h2>
            <p className="text-slate-700 leading-relaxed max-w-3xl">
              The value of VegMap is not just in producing a map. It is in
              giving users a more coherent path from uploaded data to spatially
              explicit outputs they can review, interpret, and use in downstream
              GIS and management workflows.
            </p>
          </section>
        </div>

        <div className="mt-16 pt-10 border-t border-slate-200 flex flex-wrap gap-4">
          <Link href="/tool?mode=sampling">
            <button className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition shadow-md">
              Launch VegMap
            </button>
          </Link>

          <Link href="/">
            <button className="border border-slate-300 bg-white text-slate-900 px-6 py-3 rounded-lg hover:bg-slate-100 transition shadow-sm">
              Back to Homepage
            </button>
          </Link>
        </div>
      </section>
    </main>
  );
}