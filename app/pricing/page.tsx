export default function PricingPage() {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 px-8 py-20">

      <div className="max-w-6xl mx-auto">

        <h1 className="text-4xl font-bold mb-4">
          Pricing
        </h1>

        <p className="text-slate-600 mb-12 max-w-2xl">
          Simple pricing built for researchers, agencies, and applied workflows.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

          {/* PLAN 1 */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <h2 className="text-xl font-semibold mb-2">Starter</h2>
            <p className="text-slate-500 mb-4 text-sm">
              Early exploration and testing.
            </p>
            <p className="text-3xl font-bold mb-6">$0</p>
            <ul className="space-y-2 text-sm text-slate-600">
              <li>✔ Limited runs</li>
              <li>✔ Basic outputs</li>
              <li>✔ Community support</li>
            </ul>
          </div>

          {/* PLAN 2 */}
          <div className="bg-white border-2 border-blue-600 rounded-2xl p-6 shadow-md">
            <h2 className="text-xl font-semibold mb-2">Professional</h2>
            <p className="text-slate-500 mb-4 text-sm">
              Designed for active scientific workflows.
            </p>
            <p className="text-3xl font-bold mb-6">$99/mo</p>
            <ul className="space-y-2 text-sm text-slate-600">
              <li>✔ GPU accelerated runs</li>
              <li>✔ High-resolution outputs</li>
              <li>✔ Priority compute</li>
            </ul>
          </div>

          {/* PLAN 3 */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <h2 className="text-xl font-semibold mb-2">Enterprise</h2>
            <p className="text-slate-500 mb-4 text-sm">
              Agencies and large-scale projects.
            </p>
            <p className="text-3xl font-bold mb-6">Custom</p>
            <ul className="space-y-2 text-sm text-slate-600">
              <li>✔ Dedicated infrastructure</li>
              <li>✔ Custom integrations</li>
              <li>✔ Support & onboarding</li>
            </ul>
          </div>

        </div>

      </div>

    </main>
  );
}