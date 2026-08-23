import React from "react";
import { Battery, Cpu, MemoryStick, AlertTriangle, ShieldAlert, Sparkles } from "lucide-react";

export default function HazardGrid({ onOpenHazard }) {
  const hazards = [
    {
      id: "lithium",
      symbol: "Li",
      name: "Lithium",
      category: "Rechargeable Batteries",
      desc: "Found in modern smartphones, power banks, and laptops. Highly reactive when punctured.",
      icon: Battery,
      color: "text-red-500",
      bgLight: "bg-red-500/10",
      border: "border-red-500/30",
      harm: "Causes explosive landfill fires and leaches caustic chemicals into underground aquifers.",
      benefit: "Recovered lithium, nickel, and cobalt can directly be refined into new EV and device battery cells."
    },
    {
      id: "cadmium",
      symbol: "Cd",
      name: "Cadmium",
      category: "Semiconductors & Resistors",
      desc: "Common in older rechargeable batteries, chip resistors, and infrared detectors.",
      icon: Cpu,
      color: "text-amber-500",
      bgLight: "bg-amber-500/10",
      border: "border-amber-500/30",
      harm: "Severe human carcinogen that degrades kidney function and contaminates agricultural soils.",
      benefit: "Safely extracted in closed-loop smelters to prevent bioaccumulation in the food chain."
    },
    {
      id: "lead",
      symbol: "Pb",
      name: "Lead",
      category: "Circuit Board Solder & CRT",
      desc: "Historical standard for electronic soldering, printed circuit boards, and cathode ray tubes.",
      icon: MemoryStick,
      color: "text-purple-500",
      bgLight: "bg-purple-500/10",
      border: "border-purple-500/30",
      harm: "Potent neurotoxin causing irreversible cognitive damage, nervous system failure, and water poisoning.",
      benefit: "Infinitely recyclable with 98% purity recovery in authorized pyrometallurgical facilities."
    },
    {
      id: "mercury",
      symbol: "Hg",
      name: "Mercury",
      category: "Display CCFL Lamps & Switches",
      desc: "Used in flat panel backlights, switches, and printed wiring assemblies.",
      icon: AlertTriangle,
      color: "text-teal-500",
      bgLight: "bg-teal-500/10",
      border: "border-teal-500/30",
      harm: "Vaporizes into toxic atmospheric fumes and biomagnifies into methylmercury in fish and wildlife.",
      benefit: "Distilled safely under vacuum retort systems into pure elemental mercury for dental/industrial reuse."
    }
  ];

  return (
    <div className="learn-page-root">
      <div className="learn-header text-center">
        <div className="badge badge-emerald text-xs mb-2">
          <Sparkles size={14} />
          <span>Educational Impact Center</span>
        </div>
        <h2>Hidden Hazards in Electronics</h2>
        <p className="text-sm text-muted max-w-xl mx-auto">
          Understand the toxic materials lurking in everyday electronics and the profound benefits of ethical recycling.
        </p>
      </div>

      <div className="hazards-grid">
        {hazards.map((h) => {
          const Icon = h.icon;
          return (
            <div
              key={h.id}
              className="glass-card hazard-card"
              onClick={() => onOpenHazard && onOpenHazard(h)}
            >
              <div className="hazard-top-row">
                <div className={`hazard-icon-box ${h.bgLight} ${h.border}`}>
                  <Icon size={24} className={h.color} />
                </div>
                <span className="hazard-symbol font-mono">{h.symbol}</span>
              </div>

              <h3 className="hazard-title">{h.name}</h3>
              <span className="hazard-category">{h.category}</span>
              <p className="hazard-desc">{h.desc}</p>

              <div className="hazard-card-footer">
                <span>View Toxic Impacts & Recycling Benefits →</span>
              </div>
            </div>
          );
        })}
      </div>

      <style>{`
        .learn-page-root {
          max-width: 1200px;
          margin: 0 auto;
          display: flex;
          flex-direction: column;
          gap: 28px;
        }
        .learn-header h2 {
          font-size: 2rem;
          margin-bottom: 6px;
        }
        .hazards-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(270px, 1fr));
          gap: 20px;
        }
        .hazard-card {
          padding: 24px;
          display: flex;
          flex-direction: column;
          cursor: pointer;
          transition: transform var(--transition-fast);
        }
        .hazard-card:hover {
          transform: translateY(-3px);
        }
        .hazard-top-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 16px;
        }
        .hazard-icon-box {
          width: 48px;
          height: 48px;
          border-radius: var(--radius-md);
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1px solid;
        }
        .hazard-symbol {
          font-size: 1.5rem;
          font-weight: 800;
          color: var(--text-muted);
        }
        .hazard-title {
          font-size: 1.25rem;
          margin-bottom: 2px;
        }
        .hazard-category {
          font-size: 0.78rem;
          color: var(--primary);
          font-weight: 600;
          margin-bottom: 10px;
        }
        .hazard-desc {
          font-size: 0.85rem;
          color: var(--text-secondary);
          line-height: 1.5;
          margin-bottom: 18px;
          flex: 1;
        }
        .hazard-card-footer {
          font-size: 0.8rem;
          font-weight: 600;
          color: var(--primary);
          padding-top: 12px;
          border-top: 1px solid var(--border-subtle);
        }
      `}</style>
    </div>
  );
}
