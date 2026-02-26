export default function ToolPage() {
  return (
    <main className="h-[calc(100vh-72px)] flex bg-slate-50">

      {/* LEFT PANEL */}
      <aside className="w-80 border-r border-slate-200 bg-white p-6">

        <h2 className="text-xl font-semibold text-blue-700 mb-4">
          Mapping Tool
        </h2>

        <p className="text-sm text-slate-600 mb-6">
          Upload imagery and configure model settings.
        </p>

        <div className="space-y-4">

          <div className="border border-slate-200 rounded-lg p-4">
            <h3 className="font-medium mb-2">Input Data</h3>
            <p className="text-xs text-slate-500">
              Upload imagery (GeoTIFF or RGB).
            </p>
          </div>

          <div className="border border-slate-200 rounded-lg p-4">
            <h3 className="font-medium mb-2">Model Settings</h3>
            <p className="text-xs text-slate-500">
              Parameters will appear here later.
            </p>
          </div>

        </div>

      </aside>

      {/* MAIN WORKSPACE */}
      <section className="flex-1 p-8">

        <h1 className="text-3xl font-bold mb-4 text-slate-900">
          Workspace
        </h1>

        <p className="text-slate-600 mb-6">
          Model outputs and map preview will appear here.
        </p>

        <div className="h-[70vh] border border-dashed border-slate-300 rounded-xl bg-white flex items-center justify-center text-slate-400">
          Future map / output viewer
        </div>

      </section>

    </main>
  );
}