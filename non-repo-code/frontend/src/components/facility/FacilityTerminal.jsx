import React, { useState, useEffect, useRef } from "react";
import {
  Building2,
  QrCode,
  Search,
  Camera,
  CheckCircle,
  Clock,
  ShieldCheck,
  StopCircle,
  Loader2
} from "lucide-react";
import { Html5Qrcode } from "html5-qrcode";
import InspectionDecisionPanel from "./InspectionDecisionPanel.jsx";
import { getTransactionById, getFacilities } from "../../services/api.js";

export default function FacilityTerminal() {
  const [facilities, setFacilities] = useState([]);
  const [activeFacilityId, setActiveFacilityId] = useState("FAC-DEL-004");
  const [searchTxId, setSearchTxId] = useState("");
  const [loadedTx, setLoadedTx] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // QR Scanner State
  const [scannerActive, setScannerActive] = useState(false);
  const html5QrCodeRef = useRef(null);

  // Load facilities for staff picker
  useEffect(() => {
    async function loadFacs() {
      try {
        const res = await getFacilities({ limit: 20 });
        if (res.ok && res.facilities) {
          setFacilities(res.facilities);
          if (res.facilities.length > 0) {
            setActiveFacilityId(res.facilities[0].id || res.facilities[0].facilityId);
          }
        }
      } catch (err) {
        console.warn("Failed to load facilities for portal:", err.message);
      }
    }
    loadFacs();
  }, []);

  const activeFacility = facilities.find(f => (f.id === activeFacilityId || f.facilityId === activeFacilityId)) || {
    id: "FAC-DEL-004",
    name: "ETCO E-Waste Recyclers Pvt Ltd"
  };

  const handleLookup = async (idToSearch = searchTxId) => {
    if (!idToSearch.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await getTransactionById(idToSearch.trim());
      if (res.ok && res.transaction) {
        setLoadedTx(res.transaction);
      } else {
        setError(`Transaction '${idToSearch}' not found.`);
        setLoadedTx(null);
      }
    } catch (err) {
      setError(err.response?.data?.error || err.message || "Failed to lookup transaction");
      setLoadedTx(null);
    } finally {
      setLoading(false);
    }
  };

  // Start QR Scanner via Camera
  const startQrScanner = async () => {
    setError(null);
    setScannerActive(true);

    try {
      const qrScanner = new Html5Qrcode("terminal-qr-reader");
      html5QrCodeRef.current = qrScanner;

      await qrScanner.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (decodedText) => {
          // Success callback
          setSearchTxId(decodedText);
          stopQrScanner();
          handleLookup(decodedText);
        },
        () => {
          // Frame error (ignore)
        }
      );
    } catch (err) {
      console.warn("Camera QR Scanner error:", err);
      setError("Unable to access camera for QR scanning.");
      setScannerActive(false);
    }
  };

  const stopQrScanner = async () => {
    if (html5QrCodeRef.current) {
      try {
        await html5QrCodeRef.current.stop();
        html5QrCodeRef.current.clear();
      } catch (e) {}
      html5QrCodeRef.current = null;
    }
    setScannerActive(false);
  };

  useEffect(() => {
    return () => {
      stopQrScanner();
    };
  }, []);

  return (
    <div className="facility-terminal-root">
      <div className="terminal-page-header text-center">
        <div className="badge badge-teal text-xs mb-2">
          <Building2 size={14} />
          <span>Authorized Recycler Terminal</span>
        </div>
        <h2>Facility Physical Inspection & Verification</h2>
        <p className="text-sm text-muted max-w-xl mx-auto">
          Scan drop-off customer QR codes, inspect physical electronic devices, and officially issue verified reward credits.
        </p>
      </div>

      <div className="terminal-grid-layout">
        {/* Left Column: Authorized Unit & Scan Terminal */}
        <div className="glass-card terminal-left-panel">
          <div className="panel-section-head">
            <div className="flex items-center gap-2">
              <Building2 size={18} className="text-secondary" />
              <h4>Active Authorized Facility</h4>
            </div>
            <span className="badge badge-emerald text-xs">ONLINE</span>
          </div>

          <div className="input-group">
            <label className="input-label">Select Authorized Unit Terminal</label>
            <select
              value={activeFacilityId}
              onChange={(e) => setActiveFacilityId(e.target.value)}
              className="input-field"
            >
              {facilities.map((f) => (
                <option key={f.id || f.facilityId} value={f.id || f.facilityId}>
                  {f.name} ({f.state})
                </option>
              ))}
            </select>
          </div>

          <hr className="terminal-divider" />

          {/* Search / Scan Controls */}
          <div className="panel-section-head">
            <div className="flex items-center gap-2">
              <QrCode size={18} className="text-primary" />
              <h4>Scan Customer Drop-Off Token</h4>
            </div>
          </div>

          <form
            className="search-tx-form"
            onSubmit={(e) => {
              e.preventDefault();
              handleLookup();
            }}
          >
            <input
              type="text"
              placeholder="Enter Transaction ID (e.g. EW-2026-XXXXXX)"
              value={searchTxId}
              onChange={(e) => setSearchTxId(e.target.value)}
              className="input-field font-mono"
            />
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
              <span>Inspect</span>
            </button>
          </form>

          {/* Camera QR Scanner Box */}
          <div className="scanner-container-box">
            <div id="terminal-qr-reader" className={`qr-reader-viewport ${scannerActive ? "active" : ""}`} />

            {!scannerActive ? (
              <button className="btn btn-secondary btn-lg w-full" onClick={startQrScanner}>
                <Camera size={18} />
                <span>Start Camera QR Scanner</span>
              </button>
            ) : (
              <button className="btn btn-danger btn-lg w-full" onClick={stopQrScanner}>
                <StopCircle size={18} />
                <span>Stop Scanner</span>
              </button>
            )}
          </div>

          {error && (
            <div className="error-alert-banner">
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* Right Column: Inspection Decision Terminal */}
        <div className="terminal-right-panel">
          <InspectionDecisionPanel
            transaction={loadedTx}
            activeFacility={activeFacility}
            onActionComplete={(updatedTx) => setLoadedTx(updatedTx)}
          />
        </div>
      </div>

      <style>{`
        .facility-terminal-root {
          max-width: 1200px;
          margin: 0 auto;
          display: flex;
          flex-direction: column;
          gap: 24px;
        }
        .terminal-page-header h2 {
          font-size: 2rem;
          margin-bottom: 6px;
        }
        .terminal-grid-layout {
          display: grid;
          grid-template-columns: 460px 1fr;
          gap: 24px;
        }
        .terminal-left-panel {
          padding: 28px;
          display: flex;
          flex-direction: column;
          gap: 20px;
        }
        .panel-section-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .terminal-divider {
          border: none;
          border-top: 1px solid var(--border-subtle);
          margin: 4px 0;
        }
        .search-tx-form {
          display: flex;
          gap: 8px;
        }
        .scanner-container-box {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .qr-reader-viewport {
          width: 100%;
          border-radius: var(--radius-md);
          overflow: hidden;
          background: #000000;
          display: none;
        }
        .qr-reader-viewport.active {
          display: block;
          min-height: 250px;
        }
        .terminal-right-panel {
          height: 100%;
        }
        .w-full { width: 100%; }
        @media (max-width: 1024px) {
          .terminal-grid-layout {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}
