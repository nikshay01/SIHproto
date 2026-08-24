import React, { useEffect, useState } from "react";
import { Cpu, Sparkles, ShieldAlert, CheckCircle2 } from "lucide-react";
import { generateEwasteEducationalContent } from "../../services/api.js";

export default function Stage3AiScanning({ claimedDevice }) {
  const [educationalContent, setEducationalContent] = useState(null);
  const [isLoadingEducation, setIsLoadingEducation] = useState(false);

  useEffect(() => {
    if (claimedDevice) {
      const fetchEducationalContent = async () => {
        setIsLoadingEducation(true);
        try {
          const content = await generateEwasteEducationalContent(
            claimedDevice.model || `${claimedDevice.brand} ${claimedDevice.model}`,
            claimedDevice.category
          );
          setEducationalContent(content);
        } catch (error) {
          console.warn("Failed to load educational content:", error);
          // Provide fallback content
          setEducationalContent({
            title: `${claimedDevice.model || `${claimedDevice.brand} ${claimedDevice.model}`} Recycling Information`,
            content: [
              `Recycling ${claimedDevice.model || `${claimedDevice.brand} ${claimedDevice.model}`} helps recover valuable materials and prevents environmental contamination.`,
              `Proper e-waste recycling conserves natural resources and reduces the need for mining.`,
              `Many electronics contain hazardous materials that require specialized handling.`,
              `Recycling one ${claimedDevice.model || `${claimedDevice.brand} ${claimedDevice.model}`} can save significant energy compared to manufacturing from raw materials.`
            ],
            impact: `Recycling ${claimedDevice.model || `${claimedDevice.brand} ${claimedDevice.model}`} reduces landfill waste and recovers precious metals for reuse in new products.`
          });
        } finally {
          setIsLoadingEducation(false);
        }
      };

      fetchEducationalContent();
    }
  }, [claimedDevice]);

  return (
    <div className="glass-card verify-stage-card text-center scanning-stage-card">
      <div className="radar-animation-box">
        <div className="radar-ring radar-ring-1"></div>
        <div className="radar-ring radar-ring-2"></div>
        <div className="radar-ring radar-ring-3"></div>
        <div className="radar-core">
          <Cpu size={32} className="text-primary animate-pulse" />
        </div>
      </div>

      <h3 className="scanning-title">AI Vision Forensics in Progress...</h3>
      <p className="scanning-subtitle">
        Comparing visual hardware cues against <strong>{claimedDevice?.brand} {claimedDevice?.model}</strong>
      </p>

      {/* Educational Content Popup */}
      {educationalContent && !isLoadingEducation && (
        <div className="educational-popup">
          <div className="educational-header">
            <h4>📚 {educationalContent.title}</h4>
            <button className="btn-close" onClick={() => setEducationalContent(null)}>
              <span>×</span>
            </button>
          </div>
          <div className="educational-content">
            {educationalContent.content.map((item, index) => (
              <p key={index}>• {item}</p>
            ))}
          </div>
          <div className="educational-impact">
            <p><strong>Impact:</strong> {educationalContent.impact}</p>
          </div>
        </div>
      )}

      <div className="scanning-log-box font-mono">
        <div className="log-line">
          <Sparkles size={12} className="text-primary" />
          <span>Multimodal inspection via NVIDIA Llama 3.2 Vision...</span>
        </div>
        <div className="log-line">
          <Sparkles size={12} className="text-secondary" />
          <span>Forensic validation of camera bump array and edge profile...</span>
        </div>
        <div className="log-line text-primary">
          <Sparkles size={12} className="text-primary" />
          <span>Computing anti-fraud mismatch matrix...</span>
        </div>
      </div>
      {isLoadingEducation && (
        <div className="scanning-log-box font-mono">
          <div className="log-line">
            <Sparkles size={12} className="text-info" />
            <span>Fetching educational information about e-waste recycling...</span>
          </div>
        </div>
      )}

      <style>{`
        .scanning-stage-card {
          padding: 48px 20px;
          display: flex;
          flex-direction: column;
          align-items: center;
          position: relative;
          min-height: 0;
        }
        .radar-animation-box {
          position: relative;
          width: 100px;
          height: 100px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 24px;
        }
        .radar-ring {
          position: absolute;
          border-radius: 50%;
          border: 1px solid var(--primary);
          animation: radarPulse 2s cubic-bezier(0.215, 0.61, 0.355, 1) infinite;
        }
        .radar-ring-1 { width: 50px; height: 50px; animation-delay: 0s; }
        .radar-ring-2 { width: 75px; height: 75px; animation-delay: 0.3s; }
        .radar-ring-3 { width: 100px; height: 100px; animation-delay: 0.6s; }
        .radar-core {
          width: 48px;
          height: 48px;
          border-radius: var(--radius-full);
          background: var(--primary-light);
          border: 1px solid var(--primary-border);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 2;
        }
        @keyframes radarPulse {
          0% { transform: scale(0.6); opacity: 0.8; }
          100% { transform: scale(1.4); opacity: 0; }
        }
        .scanning-title {
          font-size: 1.25rem;
          font-weight: 800;
          margin-bottom: 4px;
          text-align: center;
        }
        .scanning-subtitle {
          font-size: 0.85rem;
          color: var(--text-secondary);
          margin-bottom: 20px;
          text-align: center;
        }
        .scanning-log-box {
          background: var(--bg-surface);
          border: 1px solid var(--border-card);
          border-radius: var(--radius-md);
          padding: 12px 16px;
          font-size: 0.75rem;
          display: flex;
          flex-direction: column;
          gap: 4px;
          text-align: left;
          max-width: 100%;
          width: 100%;
          margin-bottom: 16px;
        }
        .log-line {
          display: flex;
          align-items: center;
          gap: 6px;
          color: var(--text-muted);
          font-size: 0.75rem;
        }
        .educational-popup {
          position: relative;
          top: 0;
          left: 0;
          right: 0;
          margin: 0 auto 20px auto;
          width: 100%;
          max-width: 100%;
          background: var(--primary-light);
          border: 1px solid var(--primary-border);
          border-radius: var(--radius-lg);
          padding: 16px;
          z-index: 10;
          animation: slideDown 0.3s ease-out;
          box-shadow: var(--shadow-sm);
        }
        .educational-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 12px;
          flex-wrap: wrap;
        }
        .educational-header h4 {
          margin: 0 0 4px 0;
          font-size: 0.95rem;
          font-weight: 600;
          color: var(--text-primary);
        }
        .btn-close {
          background: none;
          border: none;
          font-size: 1.1rem;
          line-height: 1;
          cursor: pointer;
          color: var(--text-muted);
          width: 22px;
          height: 22px;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0;
        }
        .educational-content {
          font-size: 0.8rem;
          color: var(--text-secondary);
          line-height: 1.5;
          margin-bottom: 10px;
        }
        .educational-content p {
          margin: 3px 0;
          line-height: 1.4;
        }
        .educational-impact {
          font-size: 0.75rem;
          font-style: italic;
          color: var(--text-muted);
          border-top: 1px solid var(--border-subtle);
          padding-top: 6px;
        }
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @media (max-width: 480px) {
          .scanning-stage-card {
            padding: 36px 16px;
          }
          .radar-animation-box {
            width: 90px;
            height: 90px;
            margin-bottom: 20px;
          }
          .scanning-title {
            font-size: 1.1rem;
          }
          .scanning-subtitle {
            font-size: 0.8rem;
          }
          .scanning-log-box {
            padding: 10px 14px;
            gap: 3px;
          }
          .educational-popup {
            margin-bottom: 16px;
            padding: 14px;
          }
          .educational-header h4 {
            font-size: 0.9rem;
          }
          .educational-content {
            font-size: 0.75rem;
          }
          .educational-impact {
            font-size: 0.7rem;
          }
        }
        @media (max-width: 360px) {
          .scanning-stage-card {
            padding: 28px 12px;
          }
          .radar-animation-box {
            width: 80px;
            height: 80px;
            margin-bottom: 16px;
          }
          .scanning-title {
            font-size: 1rem;
          }
          .scanning-subtitle {
            font-size: 0.75rem;
          }
          .scanning-log-box {
            font-size: 0.7rem;
          }
          .educational-popup {
            padding: 12px;
          }
          .educational-header h4 {
            font-size: 0.85rem;
          }
          .btn-close {
            font-size: 1rem;
          }
        }
      `}</style>
    </div>
  );
}
