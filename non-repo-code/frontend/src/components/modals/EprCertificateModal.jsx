import React, { useRef } from "react";
import { X, Award, Printer, ShieldCheck, QrCode } from "lucide-react";

export default function EprCertificateModal({ itemData, isOpen, onClose }) {
  const certRef = useRef(null);

  if (!isOpen) return null;

  const certId = `EPR-2026-IND-${Math.floor(1000 + Math.random() * 9000)}`;
  const today = new Date().toISOString().slice(0, 10);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container modal-container-lg" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="flex items-center gap-2">
            <Award className="text-primary" size={22} />
            <div>
              <h3 className="text-lg">Statutory EPR Certificate</h3>
              <p className="text-xs text-muted">Ministry of Environment, Forest & Climate Change Compliance</p>
            </div>
          </div>
          <button className="btn-icon" onClick={onClose}><X size={18} /></button>
        </div>

        <div className="modal-body">
          {/* Printable Formal Certificate Card */}
          <div className="printable-area certificate-frame" ref={certRef}>
            <div className="cert-border-outer">
              <div className="cert-border-inner">
                {/* Certificate Header */}
                <div className="cert-header-block">
                  <div className="cert-emblem">
                    <Award size={36} className="text-primary" />
                  </div>
                  <span className="cert-flag-tag">GOVERNMENT OF INDIA STATUTORY COMPLIANCE</span>
                  <h2>Certificate of Responsible Disposal</h2>
                  <p className="cert-rules-title">E-Waste (Management) Rules, 2022 • Form 1(b) Channelization Record</p>
                </div>

                <p className="cert-statement">
                  This document formally certifies that the end-of-life electronic hardware listed below has been verified for ethical channelization, material recovery, and scientific recycling through an authorized CPCB/SPCB processing facility.
                </p>

                {/* Certificate Data Grid */}
                <div className="cert-table-grid">
                  <div className="cert-col">
                    <div className="cert-data-row">
                      <span className="cert-k">Certificate ID:</span>
                      <strong className="cert-v font-mono text-primary">{certId}</strong>
                    </div>
                    <div className="cert-data-row">
                      <span className="cert-k">Item Classified:</span>
                      <strong className="cert-v">{itemData?.item || "Electronic Scrap"}</strong>
                    </div>
                    <div className="cert-data-row">
                      <span className="cert-k">Category:</span>
                      <span className="cert-v">{itemData?.category || "IT Equipment"}</span>
                    </div>
                    <div className="cert-data-row">
                      <span className="cert-k">Physical Condition:</span>
                      <span className="cert-v">{itemData?.condition || "Scrap / Used"}</span>
                    </div>
                  </div>

                  <div className="cert-col">
                    <div className="cert-data-row">
                      <span className="cert-k">Authorized Recycler:</span>
                      <strong className="cert-v">ETCO E-Waste Recyclers Pvt Ltd</strong>
                    </div>
                    <div className="cert-data-row">
                      <span className="cert-k">Regulatory Authority:</span>
                      <span className="cert-v">CPCB / SPCB Registered</span>
                    </div>
                    <div className="cert-data-row">
                      <span className="cert-k">Carbon Offset Factor:</span>
                      <strong className="cert-v font-mono text-emerald-600">24.5 kg CO₂e</strong>
                    </div>
                    <div className="cert-data-row">
                      <span className="cert-k">Date of Issuance:</span>
                      <span className="cert-v font-mono">{today}</span>
                    </div>
                  </div>
                </div>

                {/* Footer QR Stamp & Signature */}
                <div className="cert-seal-row">
                  <div className="cert-qr-stamp font-mono">
                    <QrCode size={40} className="text-primary" />
                    <span>Scan for Digital Verification</span>
                  </div>

                  <div className="cert-signature-box">
                    <div className="signature-line"></div>
                    <span className="sig-title">Authorized Environmental Compliance Officer</span>
                    <span className="sig-sub">National E-Waste Oversight Registry</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary btn-sm" onClick={onClose}>Close</button>
          <button className="btn btn-primary btn-sm" onClick={handlePrint}>
            <Printer size={16} />
            <span>Print / Save as PDF</span>
          </button>
        </div>
      </div>

      <style>{`
        .certificate-frame {
          background: #ffffff;
          color: #0f172a;
          padding: 16px;
          border-radius: var(--radius-lg);
          border: 1px solid #cbd5e1;
        }
        .cert-border-outer {
          border: 2px solid #059669;
          padding: 6px;
          border-radius: var(--radius-md);
        }
        .cert-border-inner {
          border: 1px dashed #059669;
          padding: 28px;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          gap: 18px;
        }
        .cert-header-block {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 6px;
        }
        .cert-flag-tag {
          font-size: 0.72rem;
          font-weight: 800;
          letter-spacing: 0.08em;
          color: #059669;
        }
        .cert-header-block h2 {
          font-size: 1.5rem;
          color: #0f172a;
        }
        .cert-rules-title {
          font-size: 0.8rem;
          color: #475569;
        }
        .cert-statement {
          font-size: 0.825rem;
          color: #334155;
          line-height: 1.6;
          max-width: 620px;
        }
        .cert-table-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
          width: 100%;
          text-align: left;
          background: #f8fafc;
          padding: 16px;
          border-radius: var(--radius-sm);
          border: 1px solid #e2e8f0;
        }
        .cert-col {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .cert-data-row {
          display: flex;
          justify-content: space-between;
          font-size: 0.8rem;
        }
        .cert-k {
          color: #64748b;
        }
        .cert-seal-row {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          width: 100%;
          margin-top: 14px;
        }
        .cert-qr-stamp {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
          font-size: 0.68rem;
          color: #64748b;
        }
        .cert-signature-box {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
        }
        .signature-line {
          width: 200px;
          height: 1px;
          background: #0f172a;
          margin-bottom: 6px;
        }
        .sig-title {
          font-size: 0.75rem;
          font-weight: 700;
          color: #0f172a;
        }
        .sig-sub {
          font-size: 0.68rem;
          color: #64748b;
        }
        @media (max-width: 640px) {
          .cert-table-grid, .cert-seal-row {
            grid-template-columns: 1fr;
            flex-direction: column;
            align-items: center;
            gap: 16px;
          }
        }
      `}</style>
    </div>
  );
}
