import React, { useState } from "react";
import { X, Truck, Calendar, User, Phone, MapPin, CheckCircle2, Loader2 } from "lucide-react";
import { schedulePickup } from "../../services/api.js";

export default function PickupScheduleModal({ facility, isOpen, onClose }) {
  const [userName, setUserName] = useState("Rahul Sharma");
  const [userPhone, setUserPhone] = useState("+91 9876543210");
  const [userAddress, setUserAddress] = useState("Sector 62, Noida, Uttar Pradesh");
  const [pickupDate, setPickupDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().slice(0, 10);
  });
  const [itemType, setItemType] = useState("Laptops, Batteries & Smartphones");
  
  const [loading, setLoading] = useState(false);
  const [confirmedTicket, setConfirmedTicket] = useState(null);
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await schedulePickup({
        facilityId: facility?.id || facility?.facilityId || "FAC-GEN-01",
        facilityName: facility?.name || "Nearest Authorized Recycling Center",
        userName,
        userPhone,
        userAddress,
        pickupDate,
        itemType
      });

      if (res.ok && res.pickup) {
        setConfirmedTicket(res.pickup);
      }
    } catch (err) {
      setError(err.response?.data?.error || err.message || "Failed to schedule pickup");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container modal-container-sm" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="flex items-center gap-2">
            <Truck className="text-primary" size={20} />
            <div>
              <h3 className="text-lg">Schedule Doorstep Pickup</h3>
              <p className="text-xs text-muted">Authorized logistics channelization</p>
            </div>
          </div>
          <button className="btn-icon" onClick={onClose}><X size={18} /></button>
        </div>

        {confirmedTicket ? (
          <div className="modal-body text-center space-y-4 py-8">
            <CheckCircle2 size={48} className="text-emerald-500 mx-auto" />
            <h3>Pickup Request Confirmed!</h3>
            <p className="text-xs text-muted">
              An authorized logistics executive has been scheduled for doorstep collection.
            </p>

            <div className="ticket-box font-mono">
              <span className="text-xs text-muted block">DISPATCH TRACKING TICKET</span>
              <strong className="text-xl text-primary">{confirmedTicket.pickupTicketId}</strong>
              <div className="text-xs text-muted mt-1">Date: {confirmedTicket.pickupDate}</div>
            </div>

            <button className="btn btn-primary w-full mt-4" onClick={onClose}>
              Done
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="modal-body space-y-4">
              {error && (
                <div className="error-alert-banner">
                  <span>{error}</span>
                </div>
              )}

              <div className="input-group">
                <label className="input-label">Assigned Authorized Facility</label>
                <input
                  type="text"
                  readOnly
                  value={facility?.name || "Nearest Authorized Recycler"}
                  className="input-field bg-muted/60"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="input-group">
                  <label className="input-label"><User size={13} /> Full Name</label>
                  <input
                    type="text"
                    required
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                    className="input-field"
                  />
                </div>

                <div className="input-group">
                  <label className="input-label"><Phone size={13} /> Phone</label>
                  <input
                    type="tel"
                    required
                    value={userPhone}
                    onChange={(e) => setUserPhone(e.target.value)}
                    className="input-field"
                  />
                </div>
              </div>

              <div className="input-group">
                <label className="input-label"><MapPin size={13} /> Doorstep Address</label>
                <textarea
                  rows={2}
                  required
                  value={userAddress}
                  onChange={(e) => setUserAddress(e.target.value)}
                  className="input-field"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="input-group">
                  <label className="input-label"><Calendar size={13} /> Pickup Date</label>
                  <input
                    type="date"
                    required
                    value={pickupDate}
                    onChange={(e) => setPickupDate(e.target.value)}
                    className="input-field"
                  />
                </div>

                <div className="input-group">
                  <label className="input-label">Scrap Item Description</label>
                  <input
                    type="text"
                    value={itemType}
                    onChange={(e) => setItemType(e.target.value)}
                    className="input-field"
                  />
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button type="button" className="btn btn-secondary btn-sm" onClick={onClose}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary btn-sm" disabled={loading}>
                {loading ? <Loader2 size={14} className="animate-spin" /> : <Truck size={14} />}
                <span>Confirm Pickup Dispatch</span>
              </button>
            </div>
          </form>
        )}
      </div>

      <style>{`
        .ticket-box {
          background: var(--bg-muted);
          border: 1px solid var(--primary-border);
          border-radius: var(--radius-md);
          padding: 16px;
          margin: 16px 0;
        }
        .grid-cols-2 {
          display: grid;
          grid-template-columns: 1fr 1fr;
        }
        .gap-3 { gap: 12px; }
        .space-y-4 > * + * { margin-top: 16px; }
        @media (max-width: 640px) {
          .grid-cols-2 { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  );
}
