export default function ContactPage() {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 px-8 py-20">

      <div className="max-w-4xl mx-auto">

        <h1 className="text-4xl font-bold mb-4">
          Contact
        </h1>

        <p className="text-slate-600 mb-10 max-w-2xl">
          Questions about VegMap, partnerships, or scientific collaborations?
          Reach out and we’ll get back to you.
        </p>

        <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm space-y-6">

          <div>
            <h2 className="font-semibold text-lg mb-1">Email</h2>
            <p className="text-slate-600">rangescapes1@gmail.com</p>
          </div>

          <div>
            <h2 className="font-semibold text-lg mb-1">Organization</h2>
            <p className="text-slate-600">
              VegMap Scientific Tools
            </p>
          </div>

          <div>
            <h2 className="font-semibold text-lg mb-1">Response Time</h2>
            <p className="text-slate-600">
              Typically within 1–2 business days.
            </p>
          </div>

        </div>

      </div>

    </main>
  );
}