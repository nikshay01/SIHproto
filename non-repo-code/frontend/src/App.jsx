import React, { useState } from "react";
import { ThemeProvider } from "./context/ThemeContext.jsx";
import { LocationProvider } from "./context/LocationContext.jsx";
import { WalletProvider } from "./context/WalletContext.jsx";
import { FacilityProvider } from "./context/FacilityContext.jsx";

// Layout Components
import Navbar from "./components/layout/Navbar.jsx";
import Footer from "./components/layout/Footer.jsx";
import SystemMetricsModal from "./components/layout/SystemMetricsModal.jsx";

// Section Components
import LandingHero from "./components/landing/LandingHero.jsx";
import StatsBar from "./components/landing/StatsBar.jsx";
import BentoGrid from "./components/landing/BentoGrid.jsx";
import HowItWorks from "./components/landing/HowItWorks.jsx";
import LocatorView from "./components/locator/LocatorView.jsx";
import VerifyWizard from "./components/verify/VerifyWizard.jsx";
import FacilityTerminal from "./components/facility/FacilityTerminal.jsx";
import WalletDashboard from "./components/wallet/WalletDashboard.jsx";
import EvaluateScanner from "./components/evaluate/EvaluateScanner.jsx";
import HazardGrid from "./components/learn/HazardGrid.jsx";

// Modals
import FacilityDetailModal from "./components/modals/FacilityDetailModal.jsx";
import PickupScheduleModal from "./components/modals/PickupScheduleModal.jsx";
import EprCertificateModal from "./components/modals/EprCertificateModal.jsx";
import QrReceiptModal from "./components/modals/QrReceiptModal.jsx";
import HazardDetailModal from "./components/modals/HazardDetailModal.jsx";

function AppContent() {
  const [activeSection, setActiveSection] = useState("landing");

  // Global Modals State
  const [metricsModalOpen, setMetricsModalOpen] = useState(false);
  const [detailFacility, setDetailFacility] = useState(null);
  const [pickupFacility, setPickupFacility] = useState(null);
  const [certData, setCertData] = useState(null);
  const [receiptTx, setReceiptTx] = useState(null);
  const [selectedHazard, setSelectedHazard] = useState(null);

  const handleNavigate = (sectionId) => {
    setActiveSection(sectionId);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="app-container">
      {/* Top Navbar */}
      <Navbar
        activeSection={activeSection}
        onNavigate={handleNavigate}
        onOpenMetrics={() => setMetricsModalOpen(true)}
      />

      {/* Main Dynamic Section View */}
      <main className="main-content">
        {activeSection === "landing" && (
          <div className="landing-view-stack animate-fadeIn">
            <LandingHero onNavigate={handleNavigate} />
            <StatsBar />
            <BentoGrid onNavigate={handleNavigate} />
            <HowItWorks />
          </div>
        )}

        {activeSection === "locate" && (
          <div className="locate-view-stack animate-fadeIn">
            <LocatorView onOpenDetail={(fac) => setDetailFacility(fac)} />
          </div>
        )}

        {activeSection === "verify" && (
          <div className="verify-view-stack animate-fadeIn">
            <VerifyWizard onNavigate={handleNavigate} />
          </div>
        )}

        {activeSection === "facility" && (
          <div className="facility-view-stack animate-fadeIn">
            <FacilityTerminal />
          </div>
        )}

        {activeSection === "wallet" && (
          <div className="wallet-view-stack animate-fadeIn">
            <WalletDashboard onOpenReceipt={(tx) => setReceiptTx(tx)} />
          </div>
        )}

        {activeSection === "evaluate" && (
          <div className="evaluate-view-stack animate-fadeIn">
            <EvaluateScanner
              onOpenCert={(data) => setCertData(data)}
              onOpenPickup={(item) => setPickupFacility({ name: "Authorized Partner Recycler", item })}
              onNavigate={handleNavigate}
            />
          </div>
        )}

        {activeSection === "learn" && (
          <div className="learn-view-stack animate-fadeIn">
            <HazardGrid onOpenHazard={(h) => setSelectedHazard(h)} />
          </div>
        )}
      </main>

      {/* Site Footer */}
      <Footer onNavigate={handleNavigate} />

      {/* =================================================================== */}
      {/* GLOBAL MODALS */}
      {/* =================================================================== */}
      
      {/* Architecture & Sharding Telemetry Modal */}
      <SystemMetricsModal
        isOpen={metricsModalOpen}
        onClose={() => setMetricsModalOpen(false)}
      />

      {/* Facility Detail Modal */}
      <FacilityDetailModal
        facility={detailFacility}
        isOpen={Boolean(detailFacility)}
        onClose={() => setDetailFacility(null)}
        onBookPickup={(fac) => setPickupFacility(fac)}
      />

      {/* Doorstep Pickup Modal */}
      <PickupScheduleModal
        facility={pickupFacility}
        isOpen={Boolean(pickupFacility)}
        onClose={() => setPickupFacility(null)}
      />

      {/* EPR Certificate Modal */}
      <EprCertificateModal
        itemData={certData}
        isOpen={Boolean(certData)}
        onClose={() => setCertData(null)}
      />

      {/* QR Receipt Modal */}
      <QrReceiptModal
        transaction={receiptTx}
        isOpen={Boolean(receiptTx)}
        onClose={() => setReceiptTx(null)}
      />

      {/* Hazard Details Modal */}
      <HazardDetailModal
        hazard={selectedHazard}
        isOpen={Boolean(selectedHazard)}
        onClose={() => setSelectedHazard(null)}
        onLocate={() => {
          setSelectedHazard(null);
          handleNavigate("locate");
        }}
      />
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <LocationProvider>
        <WalletProvider>
          <FacilityProvider>
            <AppContent />
          </FacilityProvider>
        </WalletProvider>
      </LocationProvider>
    </ThemeProvider>
  );
}
