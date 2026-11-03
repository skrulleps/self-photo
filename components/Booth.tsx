"use client";
import { useEffect, useReducer, useState } from "react";
import { boothReducer, initialBooth } from "@/lib/booth/machine";
import { useCamera } from "@/lib/camera/useCamera";
import { captureFrame } from "@/lib/camera/capture";
import { PRESETS } from "@/lib/template/presets";
import PrintPreview from "./PrintPreview";

export default function Booth() {
  const template = PRESETS[0];
  const [state, dispatch] = useReducer(boothReducer, initialBooth);
  const [photos, setPhotos] = useState<HTMLCanvasElement[]>([]);
  const { videoRef, start, stop, error } = useCamera();
  const shooting = state.phase === "countdown" || state.phase === "capturing";

  // countdown, capture frame on the last tick
  useEffect(() => {
    if (state.phase !== "countdown") return;
    const id = setTimeout(() => {
      dispatch({ type: "TICK" });
      if (state.count > 1 || !videoRef.current) return;
      const frame = captureFrame(videoRef.current);
      setPhotos((p) => [...p, frame]);
      dispatch({ type: "CAPTURED" });
    }, 1000);
    return () => clearTimeout(id);
  }, [state.phase, state.count, state.shot, videoRef]);

  // selesai: off camera
  useEffect(() => {
    if (state.phase === "review") stop();
  }, [state.phase, stop]);

  async function begin() {
    setPhotos([]);
    if (await start()) dispatch({ type: "START", total: template.slots.length });
  }

  return (
    <main style={{ display: "grid", gap: 16, placeItems: "center", padding: 16 }}>
      <div style={{ position: "relative", width: "min(100%, 640px)", aspectRatio: "4/3", background: "#000" }} hidden={!shooting}>
        <video ref={videoRef} playsInline muted style={{ width: "100%", height: "100%", objectFit: "cover", transform: "scaleX(-1)" }} />
        {state.phase === "countdown" && (
          <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", fontSize: 140, color: "#fff", fontWeight: 700 }}>
            {state.count}
          </div>
        )}
      </div>

      {!shooting && <PrintPreview template={template} photos={photos} />}

      {state.phase === "review"
        ? <button onClick={() => { dispatch({ type: "RETAKE" }); setPhotos([]); }}>Ulangi</button>
        : <button onClick={begin} disabled={shooting}>Mulai jepret</button>}
      {error && <p role="status">{error}</p>}
    </main>
  );
}