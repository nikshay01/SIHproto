import React, { useRef, useState, useEffect } from "react";
import {
  Camera,
  Video,
  StopCircle,
  Upload,
  Sparkles,
  RotateCw,
  Award,
  Truck,
  ShieldCheck,
  Coins,
  Leaf,
  Layers
} from "lucide-react";
import { analyzeGeneralImage } from "../../services/api.js";

export default function EvaluateScanner({ onOpenCert, onOpenPickup, onNavigate }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);

  const [cameraActive, setCameraActive] = useState(false);
  const [stream, setStream] = useState(null);
  const [loading, setLoading] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [error, setError] = useState(null);
  const [dragOver, setDragOver] = useState(false);

  const startCamera = async () => {
    try {
      const newStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } }
      });
      if (videoRef.current) {
        videoRef.current.srcObject = newStream;
      }
      setStream(newStream);
      setCameraActive(true);
    } catch (err) {
      alert("Unable to open camera. You can upload an image file instead.");
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
    setCameraActive(false);
  };

  const handleCapture = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const video = videoRef.current;

    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;

    const ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.85);

    stopCamera();
    runClassification(dataUrl);
  };

  const handleFileUpload = (file) => {
    if (!file || !file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      stopCamera();
      runClassification(e.target.result);
    };
    reader.readAsDataURL(file);
  };

  const runClassification = async (dataUrl) => {
    setLoading(true);
    setError(null);
    try {
      const res = await analyzeGeneralImage(dataUrl);
      setAnalysisResult(res);
    } catch (err) {
      setError(err.response?.data?.error || err.message || "Classification failed");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    return () => {
      if (stream) stream.getTracks().forEach((track) => track.stop());
    };
  }, [stream]);

  // Economic Scrap Valuation Heuristics
  const getEstimatedScrapValue = (item = "", cat = "") => {
    const text = (item + " " + cat).toLowerCase();
    if (text.includes("laptop") || text.includes("computer")) return "₹450 - ₹1,200";
    if (text.includes("smartphone") || text.includes("phone") || text.includes("tablet")) return "₹200 - ₹550";
    if (text.includes("cable") || text.includes("charger") || text.includes("adapter")) return "₹80 - ₹280";
    if (text.includes("battery")) return "₹120 - ₹350";
    if (text.includes("circuit") || text.includes("pcb")) return "₹150 - ₹600";
    return "₹150 - ₹450";
  };

  return (
    <div className="evaluate-root">
      <div className="evaluate-header text-center">
        <div className="badge badge-emerald text-xs mb-2">
          <Sparkles size={14} />
          <span>Multimodal Item Scanner</span>
        </div>
        <h2>General E-Waste Identification & Valuation</h2>
        <p className="text-sm text-muted max-w-xl mx-auto">
          Scan any electronic scrap item to identify material composition, scrap market value, and generate statutory compliance certificates.
        </p>
      </div>

      <div className="evaluate-grid-layout">
        {/* Left Column: Camera Viewport & Dropzone */}
        <div className="glass-card evaluate-left-card">
          <div className="section-title-row">
            <h4>Capture Electronic Item</h4>
            <span className="badge badge-emerald text-xs">Ready</span>
          </div>

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
                <Camera size={36} className="text-muted mb-2" />
                <h4>Camera Ready</h4>
                <p className="text-xs text-muted max-w-sm">
                  Start camera or upload photo to identify scrap value
                </p>
              </div>
            )}
          </div>

          <div className="camera-controls-bar">
            {!cameraActive ? (
              <button className="btn btn-secondary btn-lg flex-1" onClick={startCamera}>
                <Video size={18} />
                <span>Start Camera</span>
              </button>
            ) : (
              <button className="btn btn-primary btn-lg flex-1" onClick={handleCapture}>
                <Camera size={18} />
                <span>Capture & Classify</span>
              </button>
            )}

            {cameraActive && (
              <button className="btn btn-secondary btn-lg" onClick={stopCamera}>
                <StopCircle size={18} />
                <span>Stop</span>
              </button>
            )}
          </div>

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
              <span><strong>Upload scrap image</strong> or drag & drop</span>
              <small className="text-muted">JPG, PNG, WebP supported</small>
            </div>
          </div>
        </div>

        {/* Right Column: AI Analysis Result */}
        <div className="glass-card evaluate-right-card">
          <div className="section-title-row">
            <h4>Forensic Classification Result</h4>
            {analysisResult && (
              <button className="btn-text-sm" onClick={() => setAnalysisResult(null)}>
                <RotateCw size={13} />
                <span>Clear</span>
              </button>
            )}
          </div>

          {loading ? (
            <div className="evaluate-loading-box">
              <Sparkles size={32} className="animate-spin text-primary mb-2" />
              <h4>Analyzing Image with NVIDIA Llama 3.2 Vision...</h4>
              <p className="text-xs text-muted">Classifying electronic components & physical condition</p>
            </div>
          ) : error ? (
            <div className="error-alert-banner">
              <span>{error}</span>
            </div>
          ) : !analysisResult ? (
            <div className="evaluate-standby-box">
              <Layers size={40} className="text-muted mb-3" />
              <h4>Standby for Visual Input</h4>
              <p className="text-xs text-muted max-w-sm text-center">
                Capture a photo or upload an image on the left to view detailed e-waste classification and estimated recovery value.
              </p>
            </div>
          ) : (
            <div className="analysis-result-content">
              {/* Verdict Banner */}
              <div className="badge badge-emerald py-2 px-4 text-sm w-full justify-center">
                <span>E-Waste Item Identified • {analysisResult.item}</span>
              </div>

              {/* 4-Point Metadata Grid */}
              <div className="meta-specs-grid">
                <div className="spec-box">
                  <span className="spec-label">Item</span>
                  <strong className="spec-data">{analysisResult.item}</strong>
                </div>
                <div className="spec-box">
                  <span className="spec-label">Category</span>
                  <strong className="spec-data">{analysisResult.category}</strong>
                </div>
                <div className="spec-box">
                  <span className="spec-label">Subcategory</span>
                  <strong className="spec-data">{analysisResult.subcategory}</strong>
                </div>
                <div className="spec-box">
                  <span className="spec-label">Condition</span>
                  <strong className="spec-data text-emerald-500">{analysisResult.condition}</strong>
                </div>
              </div>

              {/* Economic & Environmental Intelligence */}
              <div className="eco-intel-grid">
                <div className="intel-card">
                  <span className="intel-label">Est. Scrap Value</span>
                  <div className="intel-value font-mono text-primary">
                    {getEstimatedScrapValue(analysisResult.item, analysisResult.category)}
                  </div>
                </div>
                <div className="intel-card">
                  <span className="intel-label">Carbon Offset</span>
                  <div className="intel-value font-mono text-emerald-500">
                    24.5 kg CO₂e
                  </div>
                </div>
              </div>

              {/* Confidence Gauge */}
              <div className="confidence-panel">
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span>Visual Confidence</span>
                  <span className="font-mono">{Math.round(analysisResult.confidence * 100)}%</span>
                </div>
                <div className="confidence-track">
                  <div className="confidence-bar" style={{ width: `${Math.round(analysisResult.confidence * 100)}%` }}></div>
                </div>
                <p className="text-xs text-muted mt-2">{analysisResult.description}</p>
              </div>

              {/* Action Buttons */}
              <div className="evaluate-action-buttons">
                <button className="btn btn-primary w-full" onClick={() => onNavigate("verify")}>
                  <ShieldCheck size={16} />
                  <span>Claim & Verify this Device for Rewards</span>
                </button>

                <div className="flex gap-2">
                  <button
                    className="btn btn-secondary btn-sm flex-1"
                    onClick={() => onOpenPickup && onOpenPickup(analysisResult.item)}
                  >
                    <Truck size={14} />
                    <span>Schedule Pickup</span>
                  </button>
                  <button
                    className="btn btn-secondary btn-sm flex-1"
                    onClick={() => onOpenCert && onOpenCert(analysisResult)}
                  >
                    <Award size={14} />
                    <span>EPR Certificate</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <style>{`
        .evaluate-root {
          max-width: 1200px;
          margin: 0 auto;
          display: flex;
          flex-direction: column;
          gap: 24px;
        }
        .evaluate-header h2 {
          font-size: 2rem;
          margin-bottom: 6px;
        }
        .evaluate-grid-layout {
          display: grid;
          grid-template-columns: 460px 1fr;
          gap: 24px;
        }
        .evaluate-left-card, .evaluate-right-card {
          padding: 24px;
          display: flex;
          flex-direction: column;
          gap: 18px;
        }
        .section-title-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .meta-specs-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }
        .spec-box {
          background: var(--bg-muted);
          border: 1px solid var(--border-card);
          border-radius: var(--radius-md);
          padding: 12px 14px;
          display: flex;
          flex-direction: column;
        }
        .spec-label {
          font-size: 0.72rem;
          text-transform: uppercase;
          color: var(--text-muted);
          font-weight: 700;
        }
        .spec-data {
          font-size: 0.95rem;
        }
        .eco-intel-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }
        .intel-card {
          background: var(--bg-muted);
          border: 1px solid var(--border-card);
          border-radius: var(--radius-md);
          padding: 12px 14px;
        }
        .intel-label {
          font-size: 0.72rem;
          text-transform: uppercase;
          color: var(--text-muted);
          font-weight: 700;
        }
        .intel-value {
          font-size: 1.15rem;
          font-weight: 800;
        }
        .evaluate-loading-box, .evaluate-standby-box {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 340px;
        }
        .analysis-result-content {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .evaluate-action-buttons {
          display: flex;
          flex-direction: column;
          gap: 10px;
          margin-top: 8px;
        }
        @media (max-width: 1024px) {
          .evaluate-grid-layout {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}
