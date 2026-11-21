import { useCallback, useEffect, useRef, useState } from "react";

// tanpa batasan ini browser kasih 640x480, jadi hasil crop ke slot kelihatan buram.
// "ideal" bukan wajib: kamera yang nggak sanggup tetap jalan di resolusi terbaiknya. 4:3 biar nggak banyak terpotong.
const CAMERA: MediaTrackConstraints = {
  facingMode: "user",
  width: { ideal: 1920 },
  height: { ideal: 1440 },
};

export function useCamera() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);

  const stop = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
  }, []);

  const start = useCallback(async () => {
    setError(null);
    stop();
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: CAMERA, audio: false });
      streamRef.current = stream;
      if (!videoRef.current) throw new Error("Elemen video belum siap");
      videoRef.current.srcObject = stream;
      await videoRef.current.play();
      return true;
    } catch (e) {
      stop();
      setError(e instanceof DOMException && e.name === "NotAllowedError"
        ? "Izin kamera ditolak. Izinkan kamera di pengaturan browser, lalu coba lagi."
        : "Kamera nggak bisa dinyalakan. Pastikan nggak lagi dipakai aplikasi lain, lalu coba lagi.");
      return false;
    }
  }, [stop]);

  // matiin kamera kalau komponen di-unmount
  useEffect(() => stop, [stop]);

  return { videoRef, start, stop, error };
}
