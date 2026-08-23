import React from "react";
import { QrCode, ExternalLink, Clock, CheckCircle2, XCircle } from "lucide-react";
import { useWallet } from "../../context/WalletContext.jsx";

export default function TransactionLedger({ onOpenReceipt }) {
  const { transactions } = useWallet();

  const getStatusBadge = (status) => {
    switch (status) {
      case "CREDITS_ISSUED":
      case "FACILITY_VERIFIED":
        return <span className="badge badge-emerald"><CheckCircle2 size={11} /> Verified</span>;
      case "PENDING_RECYCLING":
        return <span className="badge badge-gold"><Clock size={11} /> Pending</span>;
      case "MANUAL_VERIFICATION_REQUIRED":
        return <span className="badge badge-teal"><Clock size={11} /> Inspection Req</span>;
      case "REJECTED":
      case "AI_VERIFICATION_FAILED":
        return <span className="badge badge-error"><XCircle size={11} /> Rejected</span>;
      default:
        return <span className="badge badge-muted">{status}</span>;
    }
  };

  return (
    <div className="glass-card ledger-card">
      <div className="ledger-card-head">
        <div>
          <h3>Recycling Transaction History ({transactions.length})</h3>
          <p className="text-xs text-muted">Immutable audit log of all device claims and physical verifications</p>
        </div>
      </div>

      <div className="ledger-table-wrap">
        <table className="ledger-table">
          <thead>
            <tr>
              <th>Transaction ID</th>
              <th>Claimed Device</th>
              <th>Date</th>
              <th>Status</th>
              <th>Estimated</th>
              <th>Verified</th>
              <th>Drop-Off Token</th>
            </tr>
          </thead>
          <tbody>
            {transactions.length === 0 ? (
              <tr>
                <td colSpan="7" className="text-center py-8 text-muted">
                  No recycling transactions recorded yet. Verify a device to get started!
                </td>
              </tr>
            ) : (
              transactions.map((tx) => (
                <tr key={tx.transactionId}>
                  <td className="font-mono font-bold text-primary">{tx.transactionId}</td>
                  <td>
                    <div className="flex flex-col">
                      <span className="font-semibold">{tx.claimedDevice?.brand} {tx.claimedDevice?.model}</span>
                      <small className="text-muted">{tx.claimedDevice?.category}</small>
                    </div>
                  </td>
                  <td className="text-xs font-mono">
                    {new Date(tx.createdAt || Date.now()).toLocaleDateString()}
                  </td>
                  <td>{getStatusBadge(tx.verificationStatus)}</td>
                  <td className="font-mono text-muted">{tx.estimatedCredits || 0}</td>
                  <td className="font-mono font-bold text-emerald-500">{tx.verifiedCredits || 0}</td>
                  <td>
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => onOpenReceipt && onOpenReceipt(tx)}
                      title="View QR Token"
                    >
                      <QrCode size={14} />
                      <span>QR Receipt</span>
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <style>{`
        .ledger-card {
          padding: 24px;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .ledger-card-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .ledger-table-wrap {
          overflow-x: auto;
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-md);
        }
        .ledger-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 0.875rem;
          text-align: left;
        }
        .ledger-table th {
          background: var(--bg-muted);
          color: var(--text-secondary);
          font-weight: 600;
          font-size: 0.78rem;
          text-transform: uppercase;
          letter-spacing: 0.04em;
          padding: 12px 16px;
          white-space: nowrap;
        }
        .ledger-table td {
          padding: 12px 16px;
          border-bottom: 1px solid var(--border-subtle);
          color: var(--text-primary);
        }
        .ledger-table tbody tr:hover {
          background: var(--bg-hover);
        }
      `}</style>
    </div>
  );
}
