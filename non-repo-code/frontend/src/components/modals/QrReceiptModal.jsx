import React, { useRef, useEffect } from "react";
import QRCode from "qrcode";
import { X, QrCode as QrIcon, CheckCircle2 } from "lucide-react";

export default function QrReceiptModal({ transaction, isOpen, onClose }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (isOpen && transaction && canvasRef.current) {
      QRCode.toCanvas(canvasRef.current, transaction.transactionId, {
        width: 180,
        margin: 1,
        color: {
          dark: "#0f172a",
          light: "#ffffff"
        }
      });
    }
  }, [isOpen, transaction]);

  if (!isOpen || !transaction) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container modal-container-sm text-center" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="flex items-center gap-2">
            <QrIcon className="text-primary" size={20} />
            <h3 className="text-lg">Recycling Drop-Off QR Token</h3>
          </div>
          <button className="btn-icon" onClick={onClose}><X size={18} /></button>
        </div>

        <div className="modal-body flex flex-col items-center py-6">
          <div className="p-3 bg-white rounded-lg shadow-sm border border-card inline-block mb-3">
            <canvas ref={canvasRef} />
          </div>

          <h4 className="font-mono text-xl text-primary font-bold">{transaction.transactionId}</h4>
          <p className="text-sm font-semibold mt-1">
            {transaction.claimedDevice?.brand} {transaction.claimedDevice?.model}
          </p>

          <span className="badge badge-emerald mt-3">
            {transaction.verificationStatus}
          </span>

          <div className="text-xs text-muted mt-4 max-w-xs">
            Present this QR code at any authorized CPCB/SPCB recycling center counter.
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-primary w-full" onClick={onClose}>Done</button>
        </div>
      </div>
    </div>
  );
}
