import React, { useState, useEffect } from "react";
import { Laptop, Smartphone, Sparkles, ArrowRight, ShieldCheck, Cpu } from "lucide-react";
import { getDeviceCategories, getDeviceBrands, getDeviceList, getDeviceById } from "../../services/api.js";

export default function Stage1DeviceSelect({ onSelectDevice }) {
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [models, setModels] = useState([]);
  
  const [selectedCategory, setSelectedCategory] = useState("Smartphone");
  const [selectedBrand, setSelectedBrand] = useState("Apple");
  const [selectedModelId, setSelectedModelId] = useState("");
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [loading, setLoading] = useState(false);

  // Load Categories on mount
  useEffect(() => {
    async function loadCats() {
      try {
        const res = await getDeviceCategories();
        if (res.ok) setCategories(res.categories || []);
      } catch (err) {
        console.warn("Failed to load categories:", err.message);
      }
    }
    loadCats();
  }, []);

  // Load Brands when Category changes
  useEffect(() => {
    async function loadBrandsList() {
      try {
        const res = await getDeviceBrands(selectedCategory);
        if (res.ok) {
          setBrands(res.brands || []);
          if (res.brands && res.brands.length > 0 && !res.brands.includes(selectedBrand)) {
            setSelectedBrand(res.brands[0]);
          }
        }
      } catch (err) {
        console.warn("Failed to load brands:", err.message);
      }
    }
    if (selectedCategory) loadBrandsList();
  }, [selectedCategory]);

  // Load Models when Category or Brand changes
  useEffect(() => {
    async function loadModelsList() {
      setLoading(true);
      try {
        const res = await getDeviceList({ category: selectedCategory, brand: selectedBrand });
        if (res.ok) {
          setModels(res.devices || []);
          if (res.devices && res.devices.length > 0) {
            setSelectedModelId(res.devices[0].id);
          }
        }
      } catch (err) {
        console.warn("Failed to load models:", err.message);
      } finally {
        setLoading(false);
      }
    }
    if (selectedCategory && selectedBrand) loadModelsList();
  }, [selectedCategory, selectedBrand]);

  // Fetch full device metadata when model selected
  useEffect(() => {
    async function fetchDetails() {
      if (!selectedModelId) return;
      try {
        const res = await getDeviceById(selectedModelId);
        if (res.ok && res.device) {
          setSelectedDevice(res.device);
        }
      } catch (err) {
        console.warn("Failed to fetch device details:", err.message);
      }
    }
    fetchDetails();
  }, [selectedModelId]);

  const handleProceed = () => {
    if (selectedDevice) {
      onSelectDevice(selectedDevice);
    } else {
      // Fallback
      onSelectDevice({
        category: selectedCategory,
        brand: selectedBrand,
        model: models.find(m => m.id === selectedModelId)?.model || "Standard Device",
        calculatedCredits: 129
      });
    }
  };

  return (
    <div className="glass-card verify-stage-card">
      <div className="stage-card-head">
        <div className="flex items-center gap-3">
          <div className="stage-icon-wrap">
            <Cpu size={22} className="text-primary" />
          </div>
          <div>
            <h3 className="stage-title">Step 1: Select Your Claimed Device</h3>
            <p className="stage-subtitle">Search our electronic composition database to inspect recoverable materials</p>
          </div>
        </div>
        <span className="badge badge-emerald text-xs">Catalog Verified</span>
      </div>

      <div className="selection-grid-3">
        {/* Category */}
        <div className="input-group">
          <label className="input-label">1. Device Category</label>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="input-field"
          >
            {categories.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        {/* Brand */}
        <div className="input-group">
          <label className="input-label">2. Brand</label>
          <select
            value={selectedBrand}
            onChange={(e) => setSelectedBrand(e.target.value)}
            className="input-field"
          >
            {brands.map((b) => (
              <option key={b} value={b}>{b}</option>
            ))}
          </select>
        </div>

        {/* Model */}
        <div className="input-group">
          <label className="input-label">3. Specific Model</label>
          <select
            value={selectedModelId}
            onChange={(e) => setSelectedModelId(e.target.value)}
            className="input-field"
            disabled={loading || models.length === 0}
          >
            {models.map((m) => (
              <option key={m.id} value={m.id}>
                {m.model} ({m.calculatedCredits || 0} Credits)
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Selected Device Preview Card */}
      {selectedDevice && (
        <div className="claimed-device-preview">
          <div className="device-meta-left">
            <div className="device-badge-tag">CLAIMED DEVICE</div>
            <h4 className="preview-title">{selectedDevice.brand} {selectedDevice.model}</h4>
            <p className="preview-features">
              {selectedDevice.visualFeatures || "Standard chassis profile and integrated electronic circuitry."}
            </p>
            <div className="preview-weight font-mono text-xs text-muted">
              Weight: {selectedDevice.weightGrams}g • Release: {selectedDevice.releaseYear || "N/A"}
            </div>
          </div>

          <div className="device-credits-right">
            <span className="credits-label">Base Potential</span>
            <div className="credits-big font-mono">
              <strong>{selectedDevice.calculatedCredits || 129}</strong>
              <small>Credits</small>
            </div>
          </div>
        </div>
      )}

      {/* Action Row */}
      <div className="stage-actions-row">
        <button className="btn btn-primary btn-lg w-full" onClick={handleProceed}>
          <span>Confirm Claim & Proceed to Optical Scan</span>
          <ArrowRight size={18} />
        </button>
      </div>

      <style>{`
        .verify-stage-card {
          padding: 32px;
          display: flex;
          flex-direction: column;
          gap: 24px;
        }
        .stage-card-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 16px;
        }
        .stage-icon-wrap {
          width: 44px;
          height: 44px;
          border-radius: var(--radius-md);
          background: var(--primary-light);
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .stage-title {
          font-size: 1.25rem;
          margin-bottom: 2px;
        }
        .stage-subtitle {
          font-size: 0.85rem;
          color: var(--text-muted);
        }
        .selection-grid-3 {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
        }
        .claimed-device-preview {
          background: var(--bg-muted);
          border: 1px solid var(--border-card);
          border-radius: var(--radius-lg);
          padding: 20px 24px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 20px;
        }
        .device-badge-tag {
          font-size: 0.7rem;
          font-weight: 700;
          letter-spacing: 0.05em;
          color: var(--primary);
          margin-bottom: 4px;
        }
        .preview-title {
          font-size: 1.2rem;
          font-weight: 800;
          margin-bottom: 4px;
        }
        .preview-features {
          font-size: 0.85rem;
          color: var(--text-secondary);
          max-width: 480px;
          margin-bottom: 6px;
        }
        .device-credits-right {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
        }
        .credits-label {
          font-size: 0.75rem;
          font-weight: 600;
          text-transform: uppercase;
          color: var(--text-muted);
        }
        .credits-big {
          font-size: 2.2rem;
          font-weight: 800;
          color: var(--primary);
          line-height: 1;
        }
        .credits-big small {
          font-size: 0.9rem;
          font-weight: 500;
          color: var(--text-muted);
          margin-left: 4px;
        }
        .stage-actions-row {
          margin-top: 8px;
        }
        .w-full {
          width: 100%;
        }
        @media (max-width: 768px) {
          .selection-grid-3 {
            grid-template-columns: 1fr;
          }
          .device-credits-right {
            align-items: flex-start;
          }
        }
      `}</style>
    </div>
  );
}
