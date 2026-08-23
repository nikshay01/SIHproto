import React, { useEffect, useState } from "react";
import { X, Activity, Server, Database, Layers, Zap, RefreshCw } from "lucide-react";
import { getSystemMetrics } from "../../services/api.js";

export default function SystemMetricsModal({ isOpen, onClose }) {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchMetrics = async () => {
    setLoading(true);
    try {
      const data = await getSystemMetrics();
      if (data.ok) setMetrics(data);
    } catch (err) {
      console.warn("Metrics fetch error:", err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchMetrics();
      const interval = setInterval(fetchMetrics, 4000);
      return () => clearInterval(interval);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container modal-container-lg" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="flex items-center gap-2">
            <Activity className="text-primary" size={22} />
            <div>
              <h3 className="text-lg">System Design & Architecture Telemetry</h3>
              <p className="text-xs text-muted">Real-time Cluster Load Balancer, 6 Database Shards & LRU Cache</p>
            </div>
          </div>
          <button className="btn-icon" onClick={onClose}><X size={18} /></button>
        </div>

        <div className="modal-body space-y-6">
          {/* Top 3 KPI Stats */}
          <div className="grid grid-cols-3 gap-4">
            <div className="stat-card">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-muted uppercase font-semibold">Cluster Worker</span>
                <Server size={14} className="text-primary" />
              </div>
              <div className="text-xl font-bold font-mono">{metrics?.process?.workerId || "worker-1"}</div>
              <div className="text-xs text-muted">PID: {metrics?.process?.pid || "--"} • Heap: {metrics?.process?.heapUsedMb || 0} MB</div>
            </div>

            <div className="stat-card">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-muted uppercase font-semibold">MongoDB Atlas</span>
                <Database size={14} className="text-primary" />
              </div>
              <div className="text-xl font-bold font-mono text-emerald-500">
                {metrics?.database?.connected ? "ONLINE" : "FALLBACK"}
              </div>
              <div className="text-xs text-muted">{metrics?.database?.databaseName || "ecycle_india"}</div>
            </div>

            <div className="stat-card">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-muted uppercase font-semibold">LRU Cache Hit Rate</span>
                <Zap size={14} className="text-amber-500" />
              </div>
              <div className="text-xl font-bold font-mono text-amber-500">
                {metrics?.caching?.facilitiesCache?.hitRate || "0.0%"}
              </div>
              <div className="text-xs text-muted">{metrics?.caching?.facilitiesCache?.hits || 0} hits • {metrics?.caching?.facilitiesCache?.size || 0} keys</div>
            </div>
          </div>

          {/* 6 Regional Database Shards */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 font-semibold text-sm">
                <Layers size={16} className="text-primary" />
                <span>Regional Database Shards (6 Partitions)</span>
              </div>
              <span className="badge badge-emerald text-xs">100% Active</span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {(metrics?.sharding?.shards || []).map((shard) => (
                <div key={shard.shardId} className="shard-card">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-sm">{shard.name}</span>
                    <span className="font-mono text-xs text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">
                      {shard.avgLatencyMs} ms
                    </span>
                  </div>
                  <div className="text-xs text-muted mb-2">
                    {shard.statesCovered} States/UTs • {shard.totalQueriesExecuted} Queries executed
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {shard.statesList.slice(0, 4).map((st) => (
                      <span key={st} className="state-tag">{st}</span>
                    ))}
                    {shard.statesList.length > 4 && (
                      <span className="state-tag text-primary">+{shard.statesList.length - 4} more</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Cache & Concurrency Layers */}
          <div className="bg-muted/40 p-4 rounded-xl border border-subtle">
            <h4 className="text-sm font-semibold mb-2">Architectural Summary</h4>
            <ul className="text-xs text-muted space-y-1.5 list-disc list-inside">
              <li><strong>Load Balancer:</strong> Multi-core master supervisor with round-robin request dispatch.</li>
              <li><strong>Database Sharding:</strong> State-level geographic partitioning with 2dsphere index lookups.</li>
              <li><strong>Concurrency Safety:</strong> Atomic wallet balance increments ($inc) to prevent double-spending.</li>
              <li><strong>Forensic AI Relay:</strong> NVIDIA Llama 3.2 11B Vision Instruct multimodal analysis.</li>
            </ul>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary btn-sm" onClick={fetchMetrics} disabled={loading}>
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            <span>Refresh</span>
          </button>
          <button className="btn btn-primary btn-sm" onClick={onClose}>Close</button>
        </div>
      </div>

      <style>{`
        .stat-card {
          background: var(--bg-muted);
          border: 1px solid var(--border-card);
          border-radius: var(--radius-md);
          padding: 14px;
        }
        .shard-card {
          background: var(--bg-surface);
          border: 1px solid var(--border-card);
          border-radius: var(--radius-md);
          padding: 12px;
        }
        .state-tag {
          font-size: 0.68rem;
          background: var(--bg-muted);
          color: var(--text-secondary);
          padding: 2px 6px;
          border-radius: var(--radius-sm);
        }
        .grid-cols-3 {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
        }
        .grid-cols-2 {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
        }
        .gap-4 { gap: 16px; }
        .gap-3 { gap: 12px; }
        .gap-2 { gap: 8px; }
        .space-y-6 > * + * { margin-top: 24px; }
        @media (max-width: 640px) {
          .grid-cols-3, .grid-cols-2 {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}
