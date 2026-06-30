// ============================================================
// ORACLE VERITY — VISION ENGINE
// ============================================================

let videoElement: HTMLVideoElement | null = null;
let stream: MediaStream | null = null;

export async function initializeCamera(): Promise<boolean> {
  if (stream) return true;
  
  try {
    stream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480 } });
    videoElement = document.createElement('video');
    videoElement.srcObject = stream;
    await videoElement.play();
    return true;
  } catch (error) {
    console.error('Failed to initialize camera:', error);
    return false;
  }
}

export function stopCamera() {
  if (stream) {
    stream.getTracks().forEach(track => track.stop());
    stream = null;
  }
  if (videoElement) {
    videoElement.srcObject = null;
    videoElement = null;
  }
}

export async function captureWebcamFrame(): Promise<string | null> {
  if (!stream || !videoElement) {
    const initialized = await initializeCamera();
    if (!initialized) return null;
  }

  try {
    const canvas = document.createElement('canvas');
    canvas.width = videoElement!.videoWidth || 640;
    canvas.height = videoElement!.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    ctx.drawImage(videoElement!, 0, 0, canvas.width, canvas.height);
    
    // Get base64 string, remove the data:image/jpeg;base64, prefix for Gemini
    const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
    const base64Data = dataUrl.split(',')[1];
    return base64Data;
  } catch (error) {
    console.error('Failed to capture frame:', error);
    return null;
  }
}
