import React, { useState } from "react";
import { ShieldCheck, Check } from "lucide-react";
import Stage1DeviceSelect from "./Stage1DeviceSelect.jsx";
import Stage2CameraCapture from "./Stage2CameraCapture.jsx";
import Stage3AiScanning from "./Stage3AiScanning.jsx";
import Stage4ResultToken from "./Stage4ResultToken.jsx";
import { claimAndVerifyDevice } from "../../services/api.js";
import { useWallet } from "../../context/WalletContext.jsx";

export default function VerifyWizard({ onNavigate }) {
  const { userId, refreshWallet } = useWallet();

  const [currentStage, setCurrentStage] = useState(1);
  const [claimedDevice, setClaimedDevice] = useState(null);
  const [capturedImage, setCapturedImage] = useState(null);
  const [verificationResult, setVerificationResult] = useState(null);
  const [educationalContent, setEducationalContent] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);

  // Stage 1 -> 2
  const handleSelectDevice = (device) => {
    setClaimedDevice(device);
    setCurrentStage(2);
  };

  // Stage 2 -> 3 -> 4
  const handleCaptureImage = async (dataUrl) => {
    setCapturedImage(dataUrl);
    setCurrentStage(3);
    setErrorMessage(null);

    try {
      const res = await claimAndVerifyDevice({
        userId,
        claimedCategory: claimedDevice?.category || "Smartphone",
        claimedBrand: claimedDevice?.brand || "Apple",
        claimedModel: claimedDevice?.model || "iPhone 13",
        deviceId: claimedDevice?.id || claimedDevice?.deviceId || null,
        image: dataUrl
      });

      if (res.ok) {
        setVerificationResult(res);
        // Extract educational content from verification result if available
        if (res.aiVerification && res.aiVerification.educationalContent) {
          setEducationalContent(res.aiVerification.educationalContent);
        }
        await refreshWallet();
        setCurrentStage(4);
      } else {
        setErrorMessage(res.error || "Verification failed");
        setCurrentStage(2);
      }
    } catch (err) {
      console.warn("AI verification error:", err.message);
      setErrorMessage(err.message || "Failed to process image with AI");
      setCurrentStage(2);
    }
  };

  const handleReset = () => {
    setCurrentStage(1);
    setClaimedDevice(null);
    setCapturedImage(null);
    setVerificationResult(null);
    setErrorMessage(null);
  };

  const steps = [
    { num: 1, label: "Select Device" },
    { num: 2, label: "Visual Capture" },
    { num: 3, label: "AI Analysis" },
    { num: 4, label: "QR Token" }
  ];

  return (
    <div className="verify-wizard-root">
      <div className="verify-header text-center">
        <div className="badge badge-emerald text-xs mb-2">
          <ShieldCheck size={14} />
          <span>AI Optical Verification Engine</span>
        </div>
        <h2>Device Claim & Verification</h2>
        <p className="text-sm text-muted max-w-xl mx-auto">
          Select your device model, capture visual proof, and generate your estimated recycling credit transaction token.
        </p>
      </div>

      {/* Stepper Navigation */}
      <div className="stepper-bar">
        {steps.map((s, idx) => {
          const isDone = currentStage > s.num;
          const isActive = currentStage === s.num;

          return (
            <React.Fragment key={s.num}>
              <div className={`step-node ${isActive ? "active" : ""} ${isDone ? "done" : ""}`}>
                <div className="step-circle">
                  {isDone ? <Check size={14} /> : s.num}
                </div>
                <span className="step-label">{s.label}</span>
              </div>
              {idx < steps.length - 1 && (
                <div className={`step-connector ${currentStage > s.num ? "active" : ""}`}></div>
              )}
            </React.Fragment>
          );
        })}
      </div>

      {errorMessage && (
        <div className="error-alert-banner">
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Stage Views */}
      <div className="stage-content-wrap">
        {currentStage === 1 && (
          <Stage1DeviceSelect onSelectDevice={handleSelectDevice} />
        )}

        {currentStage === 2 && (
          <Stage2CameraCapture
            claimedDevice={claimedDevice}
            onCaptureImage={handleCaptureImage}
            onBack={() => setCurrentStage(1)}
          />
        )}

        {currentStage === 3 && (
          <Stage3AiScanning claimedDevice={claimedDevice} />
        )}

        {currentStage === 4 && (
          <Stage4ResultToken
            verificationResult={verificationResult}
            onReset={handleReset}
            onNavigate={onNavigate}
          />
        )}
      </div>

      <style>{`
        .verify-wizard-root {
          max-width: 820px;
          margin: 0 auto;
          display: flex;
          flex-direction: column;
          gap: 28px;
          padding: 0 16px;
          box-sizing: border-box;
          width: 100%;
        }
        .verify-header {
          text-align: center;
          padding: 0 16px;
          margin-bottom: 20px;
        }
        .verify-header h2 {
          font-size: 1.8rem;
          margin-bottom: 6px;
          line-height: 1.2;
        }
        .verify-header p {
          font-size: 0.95rem;
          line-height: 1.5;
          color: var(--text-secondary);
          max-width: 600px;
          margin: 0 auto;
        }
        .stepper-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: var(--bg-surface);
          border: 1px solid var(--border-card);
          border-radius: var(--radius-full);
          padding: 12px 24px;
          flex-wrap: wrap;
          gap: 8px;
          margin-bottom: 24px;
        }
        .step-node {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
          min-width: 60px;
          flex: 1;
        }
        .step-circle {
          width: 28px;
          height: 28px;
          border-radius: var(--radius-full);
          background: var(--bg-muted);
          color: var(--text-muted);
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 0.8rem;
          border: 1px solid var(--border-subtle);
          flex-shrink: 0;
        }
        .step-label {
          font-size: 0.75rem;
          font-weight: 600;
          color: var(--text-muted);
          text-align: center;
          margin-top: 4px;
          line-height: 1.2;
        }
        .step-node.active .step-circle {
          background: var(--primary);
          color: #ffffff;
          border-color: var(--primary);
        }
        .step-node.active .step-label {
          color: var(--text-primary);
        }
        .step-node.done .step-circle {
          background: var(--primary-light);
          color: var(--primary);
          border-color: var(--primary-border);
        }
        .step-connector {
          flex: 1;
          height: 2px;
          background: var(--border-subtle);
        }
        .step-connector.active {
          background: var(--primary);
        }
        .error-alert-banner {
          background: var(--error-light);
          color: var(--error);
          border: 1px solid rgba(220, 38, 38, 0.3);
          padding: 12px 18px;
          border-radius: var(--radius-md);
          font-size: 0.875rem;
          font-weight: 600;
          text-align: center;
          margin-bottom: 16px;
        }
        .stage-content-wrap {
          flex: 1;
          width: 100%;
        }
        @media (max-width: 768px) {
          .verify-wizard-root {
            gap: 20px;
            padding: 0 12px;
          }
          .verify-header {
            margin-bottom: 16px;
            padding: 0 12px;
          }
          .verify-header h2 {
            font-size: 1.5rem;
          }
          .verify-header p {
            font-size: 0.85rem;
          }
          .stepper-bar {
            padding: 10px 16px;
            gap: 6px;
          }
          .step-node {
            min-width: 50px;
          }
          .step-circle {
            width: 24px;
            height: 24px;
            font-size: 0.7rem;
          }
          .step-label {
            font-size: 0.65rem;
          }
          .error-alert-banner {
            padding: 10px 14px;
            font-size: 0.8rem;
          }
          .stage-content-wrap {
            padding: 0 8px;
          }
        }
        @media (max-width: 480px) {
          .verify-wizard-root {
            gap: 16px;
            padding: 0 8px;
          }
          .verify-header {
            margin-bottom: 12px;
            padding: 0 8px;
          }
          .verify-header h2 {
            font-size: 1.3rem;
          }
          .verify-header p {
            font-size: 0.8rem;
          }
          .stepper-bar {
            flex-direction: column;
            align-items: stretch;
          }
          .step-node {
            flex-direction: row;
            width: 100%;
            justify-content: flex-start;
            gap: 8px;
            padding: 6px 0;
            border-bottom: 1px solid var(--border-subtle);
            min-width: auto;
          }
          .step-node:last-child {
            border-bottom: none;
          }
          .step-circle {
            width: 24px;
            height: 24px;
            font-size: 0.75rem;
          }
          .step-label {
            font-size: 0.7rem;
            text-align: left;
            margin-top: 2px;
          }
          .step-connector {
            display: none;
          }
          .error-alert-banner {
            padding: 8px 12px;
            font-size: 0.75rem;
            margin-bottom: 12px;
          }
          .stage-content-wrap {
            padding: 0 4px;
          }
        }
        @media (max-width: 360px) {
          .verify-header h2 {
            font-size: 1.1rem;
          }
          .verify-header p {
            font-size: 0.75rem;
          }
          .step-circle {
            width: 20px;
            height: 20px;
            font-size: 0.65rem;
          }
          .step-label {
            font-size: 0.6rem;
          }
          .error-alert-banner {
            font-size: 0.7rem;
          }
        }
      `}</style>
    </div>
  );
}
