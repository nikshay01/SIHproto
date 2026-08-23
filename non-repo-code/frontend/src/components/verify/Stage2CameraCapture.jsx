import React, { useRef, useState, useEffect } from "react";
import { Camera, Video, StopCircle, Upload, ArrowLeft, RotateCw, CheckCircle2 } from "lucide-react";

export default function Stage2CameraCapture({ claimedDevice, onCaptureImage, onBack }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);

  const [cameraActive, setCameraActive] = useState(false);
  const [facingMode, setFacingMode] = useState("environment"); // "user" or "environment"
  const [activeGuideStep, setActiveGuideStep] = useState(1);
  const [stream, setStream] = useState(null);
  const [dragOver, setDragOver] = useState(false);

  // Start Camera
  const startCamera = async (mode = facingMode) => {
    try {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
      const newStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: mode, width: { ideal: 1280 }, height: { ideal: 720 } }
      });
      if (videoRef.current) {
        videoRef.current.srcObject = newStream;
      }
      setStream(newStream);
      setCameraActive(true);
    } catch (err) {
      console.warn("Camera access denied or unavailable:", err.message);
      alert("Unable to access camera. You can upload an image file instead.");
    }
  };

  // Stop Camera
  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
    setCameraActive(false);
  };

  // Switch Front/Rear Camera
  const toggleFacingMode = () => {
    const nextMode = facingMode === "environment" ? "user" : "environment";
    setFacingMode(nextMode);
    if (cameraActive) {
      startCamera(nextMode);
    }
  };

  // Capture Frame
  const handleCapture = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;

    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;

    const ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.85);

    stopCamera();
    onCaptureImage(dataUrl);
  };

  // File Upload Handler
  const handleFileUpload = (file) => {
    if (!file || !file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      stopCamera();
      onCaptureImage(e.target.result);
    };
    reader.readAsDataURL(file);
  };

  // Clean up stream on unmount
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [stream]);

  return (
    <div className="glass-card verify-stage-card">
      <div className="stage-card-head">
        <div className="flex items-center gap-3">
          <button className="btn-icon" onClick={onBack} title="Back to Device Selection">
            <ArrowLeft size={18} />
          </button>
          <div>
            <h3 className="stage-title">Step 2: Optical Device Evidence</h3>
            <p className="stage-subtitle">
              Claiming: <strong>{claimedDevice?.brand} {claimedDevice?.model}</strong>
            </p>
          </div>
        </div>
        <span className="badge badge-teal text-xs">Live Inspection</span>
      </div>

      {/* Multi-angle Step Guidance Bar */}
      <div className="guidance-bar">
        {[
          { step: 1, label: "1. Front Screen" },
          { step: 2, label: "2. Rotate Profile" },
          { step: 3, label: "3. Rear Camera Array" },
          { step: 4, label: "4. Keep in Frame" }
        ].map((g) => (
          <button
            key={g.step}
            className={`guide-pill ${activeGuideStep === g.step ? "active" : ""}`}
            onClick={() => setActiveGuideStep(g.step)}
          >
            {g.label}
          </button>
        ))}
      </div>

      {/* Camera Viewport */}
      <div className="camera-viewport-wrap">
        <div className="viewport-screen">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className={`camera-video ${cameraActive ? "active" : "hidden"}`}
          />
          <canvas ref={canvasRef} style={{ display: "none" }} />

          {!cameraActive && (
            <div className="viewport-placeholder">
              <div className="placeholder-icon-wrap">
                <Camera size={36} className="text-muted" />
              </div>
              <h4>Camera Ready</h4>
              <p className="text-xs text-muted max-w-sm">
                Start live camera to capture device proof, or upload a photo below.
              </p>
            </div>
          )}

          {/* Viewfinder Target Brackets */}
          <div className="viewfinder-brackets">
            <div className="corner-bracket top-left"></div>
            <div className="corner-bracket top-right"></div>
            <div className="corner-bracket bottom-left"></div>
            <div className="corner-bracket bottom-right"></div>
            <div className="viewfinder-tag">
              Center {claimedDevice?.brand} {claimedDevice?.model} inside frame
            </div>
          </div>

          {/* Switch Camera Button */}
          {cameraActive && (
            <button
              className="btn-switch-cam"
              onClick={toggleFacingMode}
              title="Switch Front / Rear Camera"
            >
              <RotateCw size={18} />
            </button>
          )}
        </div>

        {/* Camera Action Buttons */}
        <div className="camera-controls-bar">
          {!cameraActive ? (
            <button className="btn btn-secondary btn-lg" onClick={() => startCamera()}>
              <Video size={18} />
              <span>Start Camera</span>
            </button>
          ) : (
            <button className="btn btn-primary btn-lg" onClick={handleCapture}>
              <CheckCircle2 size={18} />
              <span>Capture & Verify Device</span>
            </button>
          )}

          {cameraActive && (
            <button className="btn btn-secondary btn-lg" onClick={stopCamera}>
              <StopCircle size={18} />
              <span>Stop</span>
            </button>
          )}
        </div>

        {/* Dropzone File Upload */}
        <div
          className={`dropzone-box ${dragOver ? "drag-over" : ""}`}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            if (e.dataTransfer.files?.[0]) handleFileUpload(e.dataTransfer.files[0]);
          }}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            type="file"
            ref={fileInputRef}
            accept="image/*"
            style={{ display: "none" }}
            onChange={(e) => {
              if (e.target.files?.[0]) handleFileUpload(e.target.files[0]);
            }}
          />
          <Upload size={20} className="text-primary" />
          <div className="dropzone-text">
            <span><strong>Upload photo</strong> or drop file here</span>
            <small className="text-muted">JPG, PNG, WebP supported</small>
          </div>
        </div>
      </div>

      <style>{`
        .guidance-bar {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }
        .guide-pill {
          padding: 6px 14px;
          border-radius: var(--radius-full);
          font-size: 0.78rem;
          font-weight: 600;
          background: var(--bg-muted);
          color: var(--text-secondary);
          border: 1px solid var(--border-card);
        }
        .guide-pill.active {
          background: var(--primary-light);
          color: var(--primary);
          border-color: var(--primary-border);
        }
        .camera-viewport-wrap {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .viewport-screen {
          position: relative;
          width: 100%;
          height: 380px;
          border-radius: var(--radius-lg);
          background: #000000;
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1px solid var(--border-card);
        }
        .camera-video {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .camera-video.hidden {
          display: none;
        }
        .viewport-placeholder {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          gap: 10px;
          color: #ffffff;
        }
        .placeholder-icon-wrap {
          width: 64px;
          height: 64px;
          border-radius: var(--radius-full);
          background: rgba(255, 255, 255, 0.1);
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .viewfinder-brackets {
          position: absolute;
          inset: 30px;
          pointer-events: none;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .corner-bracket {
          position: absolute;
          width: 24px;
          height: 24px;
          border-color: var(--primary);
          border-style: solid;
        }
        .corner-bracket.top-left { top: 0; left: 0; border-width: 3px 0 0 3px; }
        .corner-bracket.top-right { top: 0; right: 0; border-width: 3px 3px 0 0; }
        .corner-bracket.bottom-left { bottom: 0; left: 0; border-width: 0 0 3px 3px; }
        .corner-bracket.bottom-right { bottom: 0; right: 0; border-width: 0 3px 3px 0; }
        .viewfinder-tag {
          background: rgba(0, 0, 0, 0.65);
          color: #ffffff;
          padding: 4px 12px;
          border-radius: var(--radius-full);
          font-size: 0.78rem;
          font-weight: 600;
          backdrop-filter: blur(4px);
        }
        .btn-switch-cam {
          position: absolute;
          top: 14px;
          right: 14px;
          width: 38px;
          height: 38px;
          border-radius: var(--radius-full);
          background: rgba(0, 0, 0, 0.6);
          color: #ffffff;
          display: flex;
          align-items: center;
          justify-content: center;
          backdrop-filter: blur(4px);
        }
        .camera-controls-bar {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .dropzone-box {
          border: 2px dashed var(--border-card);
          border-radius: var(--radius-lg);
          padding: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          cursor: pointer;
          transition: all var(--transition-fast);
          background: var(--bg-muted);
        }
        .dropzone-box:hover, .dropzone-box.drag-over {
          border-color: var(--primary);
          background: var(--primary-light);
        }
        .dropzone-text {
          display: flex;
          flex-direction: column;
          font-size: 0.88rem;
        }
      `}</style>
    </div>
  );
}
