"use client";

import dynamic from "next/dynamic";
import { useState } from "react";

const Editor = dynamic(
  () => import("@/components/editor/ckeditor").then((m) => m.CustomCKEditor),
  {
    ssr: false,
    loading: () => <p className="text-muted-foreground">Loading editor...</p>,
  },
);

export default function TestEditorPage() {
  const [data, setData] = useState("");
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">CKEditor Test</h1>
      <Editor data={data} onChange={setData} />
    </div>
  );
}
