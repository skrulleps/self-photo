"use client";
import { useEffect, useRef } from "react";
import { renderPrint, type Photo } from "@/lib/render/render";
import type { Template } from "@/lib/template/types";

export default function PrintPreview({ template, photos = [] }: { template: Template; photos?: Photo[] }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = ref.current, ctx = c?.getContext("2d");
    if (!c || !ctx) return;
    c.width = template.size.width;
    c.height = template.size.height;
    renderPrint(ctx, template, photos);
  }, [template, photos]);
  return <canvas ref={ref} style={{ maxHeight: "80vh", width: "auto", maxWidth: "100%" }} />;
}