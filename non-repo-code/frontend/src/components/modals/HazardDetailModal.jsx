import React from "react";
import { X, AlertTriangle, Leaf, MapPin } from "lucide-react";

export default function HazardDetailModal({ hazard, isOpen, onClose, onLocate }) {
  if (!isOpen || !hazard) return null;

  const Icon = hazard.icon;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container modal-container-md" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="flex items-center gap-3">
            <div className={`hazard-modal-icon ${hazard.bgLight} ${hazard.border}`}>
              <Icon size={24} className={hazard.color} />
            </div>
            <div>
              <h3 className="text-lg">{hazard.name} ({hazard.symbol})</h3>
              <p className="text-xs text-muted">{hazard.category}</p>
            </div>
          </div>
          <button className="btn-icon" onClick={onClose}><X size={18} /></button>
        </div>

        <div className="modal-body space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {/* Toxic Harm */}
            <div className="hazard-impact-box bg-red-500/10 border border-red-500/30">
              <div className="flex items-center gap-2 text-red-500 font-bold text-xs uppercase mb-2">
                <AlertTriangle size={15} />
                <span>Environmental Harm</span>
              </div>
              <p className="text-xs text-secondary leading-relaxed">{hazard.harm}</p>
            </div>

            {/* Recycling Benefit */}
            <div className="hazard-impact-box bg-emerald-500/10 border border-emerald-500/30">
              <div className="flex items-center gap-2 text-emerald-500 font-bold text-xs uppercase mb-2">
                <Leaf size={15} />
                <span>Recycling Benefit</span>
              </div>
              <p className="text-xs text-secondary leading-relaxed">{hazard.benefit}</p>
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary btn-sm" onClick={onClose}>Close</button>
          <button
            className="btn btn-primary btn-sm"
            onClick={() => {
              onClose();
              if (onLocate) onLocate();
            }}
          >
            <MapPin size={14} />
            <span>Locate Recycling Center</span>
          </button>
        </div>
      </div>

      <style>{`
        .hazard-modal-icon {
          width: 44px;
          height: 44px;
          border-radius: var(--radius-md);
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1px solid;
        }
        .hazard-impact-box {
          padding: 16px;
          border-radius: var(--radius-md);
        }
      `}</style>
    </div>
  );
}
