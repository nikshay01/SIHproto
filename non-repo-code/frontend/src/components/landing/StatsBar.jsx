import React from "react";
import { Building, TrendingUp, Map, Sparkles } from "lucide-react";

export default function StatsBar() {
  const stats = [
    {
      label: "Authorized Facilities",
      value: "421",
      sub: "100% CPCB / SPCB Verified",
      icon: Building,
      highlight: false
    },
    {
      label: "National Capacity",
      value: "1.66M",
      sub: "Metric Tonnes / Year",
      icon: TrendingUp,
      highlight: false
    },
    {
      label: "Nationwide Coverage",
      value: "36 / 36",
      sub: "All States & Union Territories",
      icon: Map,
      highlight: false
    },
    {
      label: "AI Anti-Fraud Model",
      value: "Llama 3.2",
      sub: "NVIDIA Vision Multimodal",
      icon: Sparkles,
      highlight: true
    }
  ];

  return (
    <section className="stats-bar-grid">
      {stats.map((stat, idx) => {
        const Icon = stat.icon;
        return (
          <div key={idx} className="glass-card stat-item-box">
            <div className="stat-icon-wrap">
              <Icon size={18} className={stat.highlight ? "text-primary" : "text-muted"} />
            </div>
            <div className="stat-content">
              <span className="stat-label">{stat.label}</span>
              <div className={`stat-value ${stat.highlight ? "text-primary font-mono" : ""}`}>
                {stat.value}
              </div>
              <span className="stat-sub">{stat.sub}</span>
            </div>
          </div>
        );
      })}

      <style>{`
        .stats-bar-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 16px;
          margin: 32px 0;
        }
        .stat-item-box {
          display: flex;
          align-items: flex-start;
          gap: 14px;
          padding: 20px;
        }
        .stat-icon-wrap {
          width: 36px;
          height: 36px;
          border-radius: var(--radius-sm);
          background: var(--bg-muted);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .stat-content {
          display: flex;
          flex-direction: column;
        }
        .stat-label {
          font-size: 0.78rem;
          font-weight: 600;
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 0.04em;
          margin-bottom: 4px;
        }
        .stat-value {
          font-size: 1.75rem;
          font-weight: 800;
          color: var(--text-primary);
          line-height: 1.1;
          margin-bottom: 4px;
        }
        .stat-sub {
          font-size: 0.76rem;
          color: var(--text-dim);
        }
        @media (max-width: 1024px) {
          .stats-bar-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }
        @media (max-width: 640px) {
          .stats-bar-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </section>
  );
}
