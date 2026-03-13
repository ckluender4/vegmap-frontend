"use client";

import { Suspense } from "react";
import ToolWorkspace from "./tool-workspace";

export default function ToolPage() {
  return (
    <Suspense fallback={<div className="p-10">Loading workspace...</div>}>
      <ToolWorkspace />
    </Suspense>
  );
}