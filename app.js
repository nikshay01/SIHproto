/**
 * ==========================================================================
 * ECO-LOCATE (E-CYCLE INDIA) - UNIFIED CLIENT ENGINE
 * Features:
 * - Seamless Multi-Section Navigation (Home, Locate, Verify, Facility, Wallet, Evaluate, Learn)
 * - AI Device Verification & Anti-Fraud Decision Matrix (NVIDIA Vision)
 * - Material-Based Estimated Credit Scoring & QR Transaction Tokens
 * - Facility Physical Verification & Anti-Fraud Inspection Terminal
 * - User E-Waste Credits Wallet & Rewards Redemption
 * - Leaflet Nationwide Map with 421 CPCB/SPCB Facilities & Clustering
 * - Address-Based Geolocation (Near Me) with OSM Reverse Geocoding
 * - Statutory Certificate Generator & Doorstep Pickup Dispatch
 * - Dark / Light Zen M3 Theme Management
 * ==========================================================================
 */

// ============================================================================
// GLOBAL APPLICATION STATE
// ============================================================================

let allFacilitiesData = [];
let filteredFacilities = [];
let map = null;
let markerClusterGroup = null;
let facilityMarkersMap = new Map();
let selectedFacilityId = null;
let latestClassification = null;

let currentDataset = "all_facilities.json";
let savedFacilityIds = new Set(JSON.parse(localStorage.getItem("savedFacilities") || "[]"));
let userGeoLocation = null;
let apiBaseUrl = "";

// Persistent User Session ID (for wallet & transaction linking)
let currentUserId = localStorage.getItem("eco_user_id");
if (!currentUserId) {
  currentUserId = "user_" + Math.random().toString(36).substring(2, 9);
  localStorage.setItem("eco_user_id", currentUserId);
}

// Active Device Claim & Verification State
let activeClaim = {
  category: "Smartphone",
  brand: "Apple",
  model: "iPhone 13",
  deviceId: "apple-iphone-13",
  deviceData: null,
  capturedImageData: null,
  lastTransaction: null
};

// Verification Camera State
let verifyStream = null;
let verifyFacingMode = "environment";
let verifyAnalyzing = false;

// General Evaluation Camera State
let evalStream = null;
let evalFacingMode = "environment";
let evalAnalyzing = false;

// HTML5 QR Scanner Instance for Facility Portal
let html5QrScanner = null;

// ============================================================================
// INITIALIZATION
// ============================================================================

document.addEventListener("DOMContentLoaded", () => {
  detectApiBase();
  initTheme();
  initNavigation();
  initMap();
  loadData();
  setupFacilityDirectoryEvents();
  setupDeviceVerificationFlow();
  setupFacilityPortal();
  setupWalletAndRewards();
  setupGeneralEvalScanner();
  setupEcoAndCertEvents();
  checkBackendHealth();
  refreshUserWallet();
});

function detectApiBase() {
  if (window.location.port === "5000" || window.location.protocol === "file:") {
    apiBaseUrl = window.location.protocol === "file:" ? "http://localhost:5000" : "";
  } else {
    apiBaseUrl = "";
  }
}

// ============================================================================
// NAVIGATION CONTROLLER
// ============================================================================

function initNavigation() {
  // Top Navbar Links
  const navButtons = document.querySelectorAll(".nav-link");
  navButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      const section = btn.getAttribute("data-section");
      if (section) navigateToSection(section);
    });
  });

  // Brand Logo Click -> Go Home
  const homeBtn = document.getElementById("navHomeBtn");
  if (homeBtn) {
    homeBtn.addEventListener("click", () => navigateToSection("landing"));
  }

  // Navbar Wallet Pill Click -> Go to Wallet
  const navWalletPill = document.getElementById("navWalletPill");
  if (navWalletPill) {
    navWalletPill.addEventListener("click", () => navigateToSection("wallet"));
  }

  // Bento Cards Navigation
  document.querySelectorAll(".bento-card[data-nav]").forEach(card => {
    card.addEventListener("click", () => {
      const target = card.getAttribute("data-nav");
      if (target) navigateToSection(target);
    });
  });

  // Hero Search Trigger
  const heroSearchBtn = document.getElementById("heroSearchBtn");
  const heroSearchInput = document.getElementById("heroSearchInput");
  if (heroSearchBtn && heroSearchInput) {
    const handleHeroSearch = () => {
      const q = heroSearchInput.value.trim();
      navigateToSection("locate");
      const globalSearch = document.getElementById("globalSearchInput");
      if (globalSearch) {
        globalSearch.value = q;
        applyFilters();
      }
    };
    heroSearchBtn.addEventListener("click", handleHeroSearch);
    heroSearchInput.addEventListener("keydown", e => {
      if (e.key === "Enter") handleHeroSearch();
    });
  }
}

window.navigateToSection = function(sectionId) {
  const sections = {
    landing: document.getElementById("landingSection"),
    locate: document.getElementById("locateSection"),
    verify: document.getElementById("verifySection"),
    facility: document.getElementById("facilitySection"),
    wallet: document.getElementById("walletSection"),
    evaluate: document.getElementById("evaluateSection"),
    learn: document.getElementById("learnSection")
  };

  // Hide all sections
  Object.values(sections).forEach(sec => {
    if (sec) sec.classList.add("section-hidden");
  });

  // Show target section
  const target = sections[sectionId] || sections.landing;
  if (target) {
    target.classList.remove("section-hidden");
  }

  // Update topnav active state
  document.querySelectorAll(".nav-link").forEach(link => {
    const sec = link.getAttribute("data-section");
    if (sec === sectionId) {
      link.classList.add("active");
    } else {
      link.classList.remove("active");
    }
  });

  // Scroll to top
  window.scrollTo({ top: 0, behavior: "smooth" });

  // Map resize handling
  if (sectionId === "locate" && map) {
    setTimeout(() => {
      map.invalidateSize();
    }, 200);
  }

  // Refresh wallet when opening wallet section
  if (sectionId === "wallet") {
    refreshUserWallet();
  }
};

// ============================================================================
// THEME MANAGEMENT
// ============================================================================

function initTheme() {
  const savedTheme = localStorage.getItem("theme") || "light";
  applyTheme(savedTheme);

  const toggleBtn = document.getElementById("themeToggleBtn");
  if (toggleBtn) {
    toggleBtn.addEventListener("click", () => {
      const isDark = document.body.classList.contains("dark-theme");
      const nextTheme = isDark ? "light" : "dark";
      applyTheme(nextTheme);
    });
  }
}

function applyTheme(theme) {
  const body = document.body;
  const themeIcon = document.getElementById("themeIcon");

  if (theme === "light") {
    body.classList.remove("dark-theme");
    body.classList.add("light-theme");
    if (themeIcon) themeIcon.className = "fa-solid fa-moon";
  } else {
    body.classList.remove("light-theme");
    body.classList.add("dark-theme");
    if (themeIcon) themeIcon.className = "fa-solid fa-sun";
  }
  localStorage.setItem("theme", theme);
}

// ============================================================================
// FEATURE: AI DEVICE VERIFICATION & RECYCLING CLAIM FLOW
// ============================================================================

let deviceCatalogList = [];

async function setupDeviceVerificationFlow() {
  await loadDeviceCatalog();

  const catSelect = document.getElementById("claimCategorySelect");
  const brandSelect = document.getElementById("claimBrandSelect");
  const modelSelect = document.getElementById("claimModelSelect");
  const proceedBtn = document.getElementById("btnProceedToCamera");
  const backBtn = document.getElementById("btnBackToSelection");
  const newClaimBtn = document.getElementById("btnNewClaim");
  const copyTxBtn = document.getElementById("btnCopyTxId");

  if (catSelect) {
    catSelect.addEventListener("change", () => {
      activeClaim.category = catSelect.value;
      populateBrandOptions();
      populateModelOptions();
      updateClaimedPreview();
    });
  }

  if (brandSelect) {
    brandSelect.addEventListener("change", () => {
      activeClaim.brand = brandSelect.value;
      populateModelOptions();
      updateClaimedPreview();
    });
  }

  if (modelSelect) {
    modelSelect.addEventListener("change", () => {
      const selectedId = modelSelect.value;
      const device = deviceCatalogList.find(d => d.id === selectedId);
      if (device) {
        activeClaim.model = device.model;
        activeClaim.deviceId = device.id;
        activeClaim.deviceData = device;
      }
      updateClaimedPreview();
    });
  }

  if (proceedBtn) {
    proceedBtn.addEventListener("click", () => {
      setVerifyWizardStep(2);
      document.getElementById("verifyStage1").classList.add("section-hidden");
      document.getElementById("verifyStage2").classList.remove("section-hidden");
      document.getElementById("activeClaimLabel").textContent = `${activeClaim.brand} ${activeClaim.model}`;
      startVerifyCamera();
    });
  }

  if (backBtn) {
    backBtn.addEventListener("click", () => {
      stopVerifyCamera();
      setVerifyWizardStep(1);
      document.getElementById("verifyStage2").classList.add("section-hidden");
      document.getElementById("verifyStage1").classList.remove("section-hidden");
    });
  }

  if (newClaimBtn) {
    newClaimBtn.addEventListener("click", () => {
      setVerifyWizardStep(1);
      document.getElementById("verifyStage4").classList.add("section-hidden");
      document.getElementById("verifyStage1").classList.remove("section-hidden");
    });
  }

  if (copyTxBtn) {
    copyTxBtn.addEventListener("click", () => {
      const code = document.getElementById("resTransactionId").textContent;
      if (code) {
        navigator.clipboard.writeText(code);
        copyTxBtn.innerHTML = `<i class="fa-solid fa-check text-sage"></i>`;
        setTimeout(() => { copyTxBtn.innerHTML = `<i class="fa-regular fa-copy"></i>`; }, 1500);
      }
    });
  }

  // Camera Controls
  const startCamBtn = document.getElementById("verifyStartCameraBtn");
  const stopCamBtn = document.getElementById("verifyStopCameraBtn");
  const captureBtn = document.getElementById("verifyCaptureBtn");
  const switchCamBtn = document.getElementById("verifySwitchCameraBtn");
  const fileInput = document.getElementById("verifyFileInput");
  const dropZone = document.getElementById("verifyDropZone");

  if (startCamBtn) startCamBtn.addEventListener("click", startVerifyCamera);
  if (stopCamBtn) stopCamBtn.addEventListener("click", () => stopVerifyCamera(true));
  if (captureBtn) captureBtn.addEventListener("click", captureVerifyImage);
  if (switchCamBtn) switchCamBtn.addEventListener("click", switchVerifyCamera);

  if (fileInput) {
    fileInput.addEventListener("change", e => {
      if (e.target.files && e.target.files[0]) {
        readVerifyFile(e.target.files[0]);
      }
    });
  }

  if (dropZone) {
    ["dragenter", "dragover"].forEach(evt => {
      dropZone.addEventListener(evt, e => {
        e.preventDefault();
        e.stopPropagation();
        dropZone.style.borderColor = "var(--secondary)";
      });
    });

    ["dragleave", "drop"].forEach(evt => {
      dropZone.addEventListener(evt, e => {
        e.preventDefault();
        e.stopPropagation();
        dropZone.style.borderColor = "var(--outline-variant)";
      });
    });

    dropZone.addEventListener("drop", e => {
      const dt = e.dataTransfer;
      if (dt.files && dt.files[0]) {
        readVerifyFile(dt.files[0]);
      }
    });
  }

  // Guidance pill rotations
  setupGuidancePills();
}

async function loadDeviceCatalog() {
  try {
    const res = await fetch(`${apiBaseUrl}/api/devices/list`);
    if (res.ok) {
      const data = await res.json();
      deviceCatalogList = data.devices || [];
    }
  } catch (err) {
    console.warn("Could not load device catalog from server:", err);
  }

  populateBrandOptions();
  populateModelOptions();
  updateClaimedPreview();
}

function populateBrandOptions() {
  const category = document.getElementById("claimCategorySelect").value;
  const brandSelect = document.getElementById("claimBrandSelect");
  if (!brandSelect) return;

  const brands = new Set();
  deviceCatalogList.forEach(d => {
    if (!category || d.category.toLowerCase() === category.toLowerCase()) {
      brands.add(d.brand);
    }
  });

  if (brands.size === 0) {
    brands.add("Apple");
    brands.add("Samsung");
    brands.add("Generic");
  }

  const currentVal = brandSelect.value;
  brandSelect.innerHTML = Array.from(brands).sort().map(b => `<option value="${b}">${b}</option>`).join("");
  
  if (brands.has(currentVal)) {
    brandSelect.value = currentVal;
  } else {
    brandSelect.value = Array.from(brands)[0];
  }

  activeClaim.brand = brandSelect.value;
}

function populateModelOptions() {
  const category = document.getElementById("claimCategorySelect").value;
  const brand = document.getElementById("claimBrandSelect").value;
  const modelSelect = document.getElementById("claimModelSelect");
  if (!modelSelect) return;

  const models = deviceCatalogList.filter(d => 
    d.category.toLowerCase() === category.toLowerCase() &&
    d.brand.toLowerCase() === brand.toLowerCase()
  );

  if (models.length > 0) {
    modelSelect.innerHTML = models.map(m => `
      <option value="${m.id}">${m.model} (Est. ${m.calculatedCredits} Credits)</option>
    `).join("");
    activeClaim.model = models[0].model;
    activeClaim.deviceId = models[0].id;
    activeClaim.deviceData = models[0];
  } else {
    modelSelect.innerHTML = `<option value="custom">${brand} Device</option>`;
    activeClaim.model = `${brand} Device`;
    activeClaim.deviceId = null;
    activeClaim.deviceData = null;
  }
}

function updateClaimedPreview() {
  const titleEl = document.getElementById("previewDeviceTitle");
  const featEl = document.getElementById("previewDeviceFeatures");
  const creditsEl = document.getElementById("previewEstCredits");

  const modelSelect = document.getElementById("claimModelSelect");
  const selectedId = modelSelect ? modelSelect.value : null;
  const device = deviceCatalogList.find(d => d.id === selectedId) || activeClaim.deviceData;

  if (device) {
    if (titleEl) titleEl.textContent = `${device.brand} ${device.model}`;
    if (featEl) featEl.textContent = device.visualFeatures || "Standard electronic specifications.";
    if (creditsEl) creditsEl.textContent = device.calculatedCredits || 100;
  } else {
    if (titleEl) titleEl.textContent = `${activeClaim.brand} ${activeClaim.model}`;
    if (featEl) featEl.textContent = "General consumer electronic scrap composition.";
    if (creditsEl) creditsEl.textContent = "75";
  }
}

function setVerifyWizardStep(stepNum) {
  for (let i = 1; i <= 4; i++) {
    const ind = document.getElementById(`stepIndicator${i}`);
    if (!ind) continue;
    if (i === stepNum) {
      ind.className = "wizard-step active";
    } else if (i < stepNum) {
      ind.className = "wizard-step completed";
    } else {
      ind.className = "wizard-step";
    }
  }
}

function setupGuidancePills() {
  const pills = [
    { id: "guidePill1", text: "1. Show front screen of device" },
    { id: "guidePill2", text: "2. Rotate 90° to show edge profile" },
    { id: "guidePill3", text: "3. Show rear camera lenses clearly" },
    { id: "guidePill4", text: "4. Keep entire device inside frame" }
  ];

  let activeIdx = 0;
  setInterval(() => {
    if (!verifyStream) return;
    activeIdx = (activeIdx + 1) % pills.length;
    pills.forEach((p, idx) => {
      const el = document.getElementById(p.id);
      if (el) {
        if (idx === activeIdx) el.classList.add("active");
        else el.classList.remove("active");
      }
    });
    const promptTag = document.getElementById("guidePromptTag");
    if (promptTag) promptTag.textContent = pills[activeIdx].text;
  }, 3500);
}

// Camera Management for Verification
async function startVerifyCamera() {
  const video = document.getElementById("verifyVideo");
  const placeholder = document.getElementById("verifyCameraPlaceholder");
  const preview = document.getElementById("verifyPreviewImg");
  const startBtn = document.getElementById("verifyStartCameraBtn");
  const stopBtn = document.getElementById("verifyStopCameraBtn");
  const captureBtn = document.getElementById("verifyCaptureBtn");
  const switchBtn = document.getElementById("verifySwitchCameraBtn");

  try {
    if (verifyStream) stopVerifyCamera(false);

    verifyStream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: { ideal: verifyFacingMode },
        width: { ideal: 1920 },
        height: { ideal: 1080 }
      },
      audio: false
    });

    if (video) {
      video.srcObject = verifyStream;
      video.hidden = false;
    }
    if (placeholder) placeholder.hidden = true;
    if (preview) preview.hidden = true;
    if (switchBtn) switchBtn.hidden = false;

    if (startBtn) startBtn.disabled = true;
    if (captureBtn) captureBtn.disabled = false;
    if (stopBtn) stopBtn.disabled = false;
  } catch (err) {
    console.error("Verification camera access error:", err);
    alert("Camera permission not granted or device camera unavailable. You can upload a photo below.");
  }
}

function stopVerifyCamera(updateUI = true) {
  if (verifyStream) {
    verifyStream.getTracks().forEach(t => t.stop());
    verifyStream = null;
  }
  const video = document.getElementById("verifyVideo");
  const placeholder = document.getElementById("verifyCameraPlaceholder");
  const preview = document.getElementById("verifyPreviewImg");
  const startBtn = document.getElementById("verifyStartCameraBtn");
  const stopBtn = document.getElementById("verifyStopCameraBtn");
  const captureBtn = document.getElementById("verifyCaptureBtn");
  const switchBtn = document.getElementById("verifySwitchCameraBtn");

  if (video) {
    video.srcObject = null;
    video.hidden = true;
  }
  if (switchBtn) switchBtn.hidden = true;
  if (!preview || preview.hidden) {
    if (placeholder) placeholder.hidden = false;
  }

  if (startBtn) startBtn.disabled = false;
  if (captureBtn) captureBtn.disabled = true;
  if (stopBtn) stopBtn.disabled = true;
}

async function switchVerifyCamera() {
  verifyFacingMode = verifyFacingMode === "environment" ? "user" : "environment";
  await startVerifyCamera();
}

function captureVerifyImage() {
  const video = document.getElementById("verifyVideo");
  const canvas = document.getElementById("verifyCanvas");
  const preview = document.getElementById("verifyPreviewImg");
  const placeholder = document.getElementById("verifyCameraPlaceholder");

  if (!verifyStream || !video || !video.videoWidth) return;

  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;

  const ctx = canvas.getContext("2d");
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

  const imageData = canvas.toDataURL("image/jpeg", 0.88);

  if (preview) {
    preview.src = imageData;
    preview.hidden = false;
  }
  if (video) video.hidden = true;
  if (placeholder) placeholder.hidden = true;

  activeClaim.capturedImageData = imageData;
  stopVerifyCamera(false);

  executeAiVerification(imageData);
}

function readVerifyFile(file) {
  if (!file || !file.type.startsWith("image/")) return;

  const reader = new FileReader();
  reader.onload = () => {
    const preview = document.getElementById("verifyPreviewImg");
    const video = document.getElementById("verifyVideo");
    const placeholder = document.getElementById("verifyCameraPlaceholder");

    if (preview) {
      preview.src = reader.result;
      preview.hidden = false;
    }
    if (video) video.hidden = true;
    if (placeholder) placeholder.hidden = true;

    activeClaim.capturedImageData = reader.result;
    stopVerifyCamera(false);

    executeAiVerification(reader.result);
  };
  reader.readAsDataURL(file);
}

async function executeAiVerification(imageData) {
  if (verifyAnalyzing) return;
  verifyAnalyzing = true;

  // Transition to Stage 3 (AI Scanning radar)
  setVerifyWizardStep(3);
  document.getElementById("verifyStage2").classList.add("section-hidden");
  document.getElementById("verifyStage3").classList.remove("section-hidden");
  document.getElementById("analyzingClaimText").textContent = `${activeClaim.brand} ${activeClaim.model}`;

  const statusStream = document.getElementById("analysisStatusStream");
  if (statusStream) {
    statusStream.innerHTML = `
      <div>• Optical capture uploaded to neural vision relay...</div>
      <div>• Cross-referencing against ${activeClaim.brand} hardware library...</div>
    `;
    setTimeout(() => {
      if (statusStream) statusStream.innerHTML += `<div>• Evaluating camera module, chassis edges, and finish...</div>`;
    }, 800);
  }

  try {
    const response = await fetch(`${apiBaseUrl}/api/verify/claim-and-verify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: currentUserId,
        claimedCategory: activeClaim.category,
        claimedBrand: activeClaim.brand,
        claimedModel: activeClaim.model,
        deviceId: activeClaim.deviceId,
        image: imageData
      })
    });

    const result = await response.json();

    if (response.ok && result.ok) {
      renderVerificationDecision(result);
    } else {
      alert(`AI Verification failed: ${result.error || "Server error"}`);
      // Fallback display
      renderVerificationDecision({
        transaction: {
          transactionId: "EW-2026-ERR001",
          claimedDevice: { brand: activeClaim.brand, model: activeClaim.model, category: activeClaim.category },
          detectedDevice: { brand: activeClaim.brand, model: activeClaim.model, category: activeClaim.category },
          aiConfidence: 0.75,
          estimatedCredits: 75,
          verificationStatus: "MANUAL_VERIFICATION_REQUIRED",
          materialsBreakdown: []
        },
        aiVerification: {
          confidence: 0.75,
          match: true,
          reasoning: "Visual traits verified with medium confidence. Facility manual check required.",
          verificationStatus: "MANUAL_VERIFICATION_REQUIRED"
        }
      });
    }
  } catch (err) {
    console.error("AI verification request error:", err);
    alert("Connection error while analyzing device. Please ensure server is running.");
  } finally {
    verifyAnalyzing = false;
  }
}

function renderVerificationDecision(data) {
  const tx = data.transaction;
  const ai = data.aiVerification;
  activeClaim.lastTransaction = tx;

  // Transition to Stage 4 (Results & QR)
  setVerifyWizardStep(4);
  document.getElementById("verifyStage3").classList.add("section-hidden");
  document.getElementById("verifyStage4").classList.remove("section-hidden");

  const banner = document.getElementById("verifyVerdictBanner");
  const headline = document.getElementById("verdictHeadline");
  const subtitle = document.getElementById("verdictSubtitle");

  const diffDetectedCard = document.getElementById("resDetectedCard");
  const diffIcon = document.getElementById("resDiffIcon");

  // Comparison details
  document.getElementById("resClaimedDevice").textContent = `${tx.claimedDevice.brand} ${tx.claimedDevice.model}`;
  document.getElementById("resClaimedCat").textContent = tx.claimedDevice.category;
  document.getElementById("resDetectedDevice").textContent = `${tx.detectedDevice.brand} ${tx.detectedDevice.model}`;
  document.getElementById("resDetectedCat").textContent = tx.detectedDevice.category;

  const confPercent = Math.round(Number(ai.confidence) * 100);
  document.getElementById("resConfidenceScore").textContent = `${confPercent}%`;
  document.getElementById("resConfidenceBar").style.width = `${confPercent}%`;
  document.getElementById("resAiReasoning").textContent = ai.reasoning || "Visual markers analyzed against device database.";

  // Status-Specific Banner Styling
  if (tx.verificationStatus === "AI_VERIFIED" || tx.verificationStatus === "PENDING_RECYCLING") {
    banner.className = "verdict-banner-lg success";
    headline.textContent = "✓ Device Verified by AI";
    subtitle.textContent = `Visual hardware traits match your claimed ${tx.claimedDevice.brand} ${tx.claimedDevice.model}.`;
    diffDetectedCard.className = "diff-card detected";
    diffIcon.innerHTML = `<i class="fa-solid fa-check text-sage"></i>`;
  } else if (tx.verificationStatus === "MANUAL_VERIFICATION_REQUIRED") {
    banner.className = "verdict-banner-lg warning";
    headline.textContent = "⚠ Manual Facility Verification Required";
    subtitle.textContent = "AI confidence is between 70% and 90%. Physical inspection at facility will be required to award credits.";
    diffDetectedCard.className = "diff-card detected";
    diffIcon.innerHTML = `<i class="fa-solid fa-triangle-exclamation" style="color: #b38900;"></i>`;
  } else {
    banner.className = "verdict-banner-lg failed";
    headline.textContent = "✕ Device Mismatch Detected";
    subtitle.textContent = `You claimed ${tx.claimedDevice.brand} ${tx.claimedDevice.model}, but AI detected ${tx.detectedDevice.brand} ${tx.detectedDevice.model}. No reward credits awarded.`;
    diffDetectedCard.className = "diff-card mismatch";
    diffIcon.innerHTML = `<i class="fa-solid fa-xmark text-error"></i>`;
  }

  // Estimated Credits & Materials
  document.getElementById("resEstPoints").textContent = tx.estimatedCredits;
  const matContainer = document.getElementById("resMaterialPills");
  if (matContainer) {
    if (tx.materialsBreakdown && tx.materialsBreakdown.length > 0) {
      matContainer.innerHTML = tx.materialsBreakdown.map(m => `
        <span class="mat-tag-rich">
          <i class="fa-solid fa-atom text-secondary"></i>
          <strong>${m.displayName}:</strong> ${m.amountGrams}g (${m.recoveryRate})
        </span>
      `).join("");
    } else {
      matContainer.innerHTML = `<span class="mat-tag-rich">Estimated WEEE Recovery Metals (Gold, Silver, Copper, Aluminium)</span>`;
    }
  }

  // Transaction Code & QR Code Generation
  document.getElementById("resTransactionId").textContent = tx.transactionId;
  generateQrCode("qrCanvasContainer", tx.transactionId);

  // Sync wallet balance in navbar
  refreshUserWallet();
}

function generateQrCode(containerId, text) {
  const container = document.getElementById(containerId);
  if (!container) return;
  container.innerHTML = "";

  if (window.QRCode) {
    new QRCode(container, {
      text: text,
      width: 120,
      height: 120,
      colorDark: "#003527",
      colorLight: "#ffffff",
      correctLevel: QRCode.CorrectLevel.H
    });
  } else {
    container.innerHTML = `<div style="font-family: monospace; font-size: 11px; padding: 10px;">${text}</div>`;
  }
}

// ============================================================================
// FEATURE: FACILITY VERIFICATION & INSPECTION PORTAL
// ============================================================================

let loadedFacilityTx = null;

function setupFacilityPortal() {
  const lookupBtn = document.getElementById("btnFacilityLookup");
  const txInput = document.getElementById("facilityTxInput");
  const scanQrBtn = document.getElementById("btnStartQrScanner");
  const confirmBtn = document.getElementById("btnFacVerifyConfirm");
  const rejectBtn = document.getElementById("btnFacReject");

  if (lookupBtn && txInput) {
    const handleLookup = () => {
      const q = txInput.value.trim().toUpperCase();
      if (!q) {
        alert("Please enter a Transaction ID (e.g. EW-2026-XXXXXX).");
        return;
      }
      lookupFacilityTransaction(q);
    };
    lookupBtn.addEventListener("click", handleLookup);
    txInput.addEventListener("keydown", e => {
      if (e.key === "Enter") handleLookup();
    });
  }

  if (scanQrBtn) {
    scanQrBtn.addEventListener("click", toggleFacilityQrScanner);
  }

  if (confirmBtn) {
    confirmBtn.addEventListener("click", confirmFacilityVerification);
  }

  if (rejectBtn) {
    rejectBtn.addEventListener("click", rejectFacilityVerification);
  }
}

function populateFacilityStaffDropdown() {
  const sel = document.getElementById("facilityStaffSelect");
  if (!sel || allFacilitiesData.length === 0) return;

  const top10 = allFacilitiesData.slice(0, 20);
  sel.innerHTML = top10.map(f => `
    <option value="${f.id}">${escapeHtml(f.name)} (${escapeHtml(f.district || f.state)})</option>
  `).join("");
}

async function lookupFacilityTransaction(transactionId) {
  const emptyState = document.getElementById("facilityEmptyState");
  const loadedState = document.getElementById("facilityLoadedTx");
  const statusBadge = document.getElementById("facTxStatusBadge");

  try {
    const res = await fetch(`${apiBaseUrl}/api/verify/transaction/${encodeURIComponent(transactionId)}`);
    const data = await res.json();

    if (res.ok && data.ok) {
      const tx = data.transaction;
      loadedFacilityTx = tx;

      emptyState.classList.add("section-hidden");
      loadedState.classList.remove("section-hidden");

      document.getElementById("facTxId").textContent = tx.transactionId;
      document.getElementById("facUserId").textContent = tx.userId;
      document.getElementById("facClaimedDevice").textContent = `${tx.claimedDevice.brand} ${tx.claimedDevice.model}`;
      document.getElementById("facDetectedDevice").textContent = `${tx.detectedDevice.brand} ${tx.detectedDevice.model}`;
      document.getElementById("facAiConfidence").textContent = `${Math.round((tx.aiConfidence || 0.9) * 100)}%`;
      document.getElementById("facEstCredits").textContent = `${tx.estimatedCredits} E-Waste Credits`;
      document.getElementById("facTimestamp").textContent = new Date(tx.createdAt).toLocaleString();

      statusBadge.textContent = tx.verificationStatus;
      statusBadge.className = `status-badge ${tx.verificationStatus === 'CREDITS_ISSUED' ? 'success' : tx.verificationStatus === 'REJECTED' ? 'error' : 'warning'}`;

      // If already verified or rejected, disable action buttons
      const confirmBtn = document.getElementById("btnFacVerifyConfirm");
      const rejectBtn = document.getElementById("btnFacReject");

      if (tx.verificationStatus === "CREDITS_ISSUED" || tx.verificationStatus === "FACILITY_VERIFIED") {
        confirmBtn.disabled = true;
        rejectBtn.disabled = true;
        confirmBtn.innerHTML = `<i class="fa-solid fa-check"></i> Already Verified & Credits Issued`;
      } else if (tx.verificationStatus === "REJECTED") {
        confirmBtn.disabled = true;
        rejectBtn.disabled = true;
        rejectBtn.innerHTML = `<i class="fa-solid fa-ban"></i> Transaction Rejected`;
      } else {
        confirmBtn.disabled = false;
        rejectBtn.disabled = false;
        confirmBtn.innerHTML = `<i class="fa-solid fa-circle-check"></i> VERIFY DEVICE & ISSUE CREDITS`;
        rejectBtn.innerHTML = `<i class="fa-solid fa-circle-xmark"></i> REJECT CLAIM`;
      }
    } else {
      alert(data.error || `Transaction '${transactionId}' not found.`);
    }
  } catch (err) {
    console.error("Facility lookup error:", err);
    alert("Server error looking up transaction.");
  }
}

async function confirmFacilityVerification() {
  if (!loadedFacilityTx) return;

  const staffSelect = document.getElementById("facilityStaffSelect");
  const facilityId = staffSelect ? staffSelect.value : "FAC-AUTH-01";
  const facilityName = staffSelect ? staffSelect.options[staffSelect.selectedIndex].text : "Authorized E-Waste Facility";
  const notes = document.getElementById("facilityInspectorNotes").value || "Physical device confirmed and accepted for scientific recycling.";

  try {
    const res = await fetch(`${apiBaseUrl}/api/verify/facility-confirm`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        transactionId: loadedFacilityTx.transactionId,
        facilityId,
        facilityName,
        inspectorNotes: notes
      })
    });

    const data = await res.json();

    if (res.ok && data.ok) {
      alert(`✓ SUCCESS!\n\n${data.message}\n\nUser wallet has been officially credited with ${data.transaction.verifiedCredits} reward credits.`);
      lookupFacilityTransaction(loadedFacilityTx.transactionId);
      refreshUserWallet();
    } else {
      alert(`Verification Rejected: ${data.error || "Server rejection"}`);
    }
  } catch (err) {
    console.error("Facility confirmation error:", err);
    alert("Connection error during verification.");
  }
}

async function rejectFacilityVerification() {
  if (!loadedFacilityTx) return;

  const reason = prompt("Enter physical rejection reason (e.g. Device mismatch, severely degraded components, missing battery):", "Physical condition does not match claimed device.");
  if (!reason) return;

  const staffSelect = document.getElementById("facilityStaffSelect");
  const facilityId = staffSelect ? staffSelect.value : "FAC-AUTH-01";
  const facilityName = staffSelect ? staffSelect.options[staffSelect.selectedIndex].text : "Authorized E-Waste Facility";

  try {
    const res = await fetch(`${apiBaseUrl}/api/verify/facility-reject`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        transactionId: loadedFacilityTx.transactionId,
        facilityId,
        facilityName,
        rejectionReason: reason
      })
    });

    const data = await res.json();

    if (res.ok && data.ok) {
      alert(`Transaction ${loadedFacilityTx.transactionId} marked as REJECTED. No reward credits issued.`);
      lookupFacilityTransaction(loadedFacilityTx.transactionId);
      refreshUserWallet();
    } else {
      alert(`Rejection failed: ${data.error || "Server rejection"}`);
    }
  } catch (err) {
    console.error("Facility rejection error:", err);
    alert("Connection error during rejection.");
  }
}

function toggleFacilityQrScanner() {
  const qrReaderDiv = document.getElementById("facilityQrReader");
  const scanBtn = document.getElementById("btnStartQrScanner");
  if (!qrReaderDiv) return;

  if (html5QrScanner) {
    html5QrScanner.stop().then(() => {
      html5QrScanner.clear();
      html5QrScanner = null;
      scanBtn.innerHTML = `<i class="fa-solid fa-camera"></i> Start Camera QR Scanner`;
    }).catch(console.error);
    return;
  }

  if (window.Html5Qrcode) {
    html5QrScanner = new Html5Qrcode("facilityQrReader");
    html5QrScanner.start(
      { facingMode: "environment" },
      { fps: 10, qrbox: { width: 250, height: 250 } },
      (decodedText) => {
        // Scanned successfully!
        document.getElementById("facilityTxInput").value = decodedText;
        lookupFacilityTransaction(decodedText);
        html5QrScanner.stop().then(() => {
          html5QrScanner.clear();
          html5QrScanner = null;
          scanBtn.innerHTML = `<i class="fa-solid fa-camera"></i> Start Camera QR Scanner`;
        });
      },
      (error) => {
        // scan progress
      }
    ).then(() => {
      scanBtn.innerHTML = `<i class="fa-solid fa-stop"></i> Stop Camera Scanner`;
    }).catch(err => {
      console.error("QR scanner start error:", err);
      alert("Camera QR scanner could not be started. Check camera permissions.");
    });
  }
}

// ============================================================================
// FEATURE: USER CREDITS WALLET & REWARDS CONTROLLER
// ============================================================================

function setupWalletAndRewards() {
  const refreshBtn = document.getElementById("btnRefreshWallet");
  if (refreshBtn) {
    refreshBtn.addEventListener("click", refreshUserWallet);
  }

  const redeemBtn = document.getElementById("btnOpenRedeemModal");
  if (redeemBtn) {
    redeemBtn.addEventListener("click", () => {
      openModal("rewardsModal");
    });
  }
}

async function refreshUserWallet() {
  try {
    const res = await fetch(`${apiBaseUrl}/api/wallet/${currentUserId}`);
    if (res.ok) {
      const data = await res.json();
      const wallet = data.wallet || {};
      const txList = data.transactions || [];

      // Update Nav pill
      const navCredits = document.getElementById("navWalletCredits");
      if (navCredits) navCredits.textContent = wallet.availableCredits || 0;

      // Update 4 Metric Balances
      const estEl = document.getElementById("walletEstCredits");
      const verEl = document.getElementById("walletVerifiedCredits");
      const redEl = document.getElementById("walletRedeemedCredits");
      const avEl = document.getElementById("walletAvailableCredits");

      if (estEl) estEl.textContent = wallet.estimatedCredits || 0;
      if (verEl) verEl.textContent = wallet.verifiedCredits || 0;
      if (redEl) redEl.textContent = wallet.redeemedCredits || 0;
      if (avEl) avEl.textContent = wallet.availableCredits || 0;

      // Render Ledger Table
      renderWalletLedger(txList);

      // Render Active Vouchers
      renderActiveVouchers(wallet.redemptions || []);
    }
  } catch (err) {
    console.warn("Wallet refresh error:", err);
  }
}

function renderWalletLedger(transactions) {
  const tbody = document.getElementById("walletLedgerBody");
  if (!tbody) return;

  if (!transactions || transactions.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" class="text-center text-muted py-4">No recycling claims recorded yet. Verify a device above to begin!</td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = transactions.map(t => {
    let statusClass = "warning";
    let statusLabel = t.verificationStatus;

    if (t.verificationStatus === "CREDITS_ISSUED" || t.verificationStatus === "FACILITY_VERIFIED") {
      statusClass = "success";
      statusLabel = "Verified & Awarded";
    } else if (t.verificationStatus === "PENDING_RECYCLING") {
      statusClass = "warning";
      statusLabel = "Pending Facility Drop-off";
    } else if (t.verificationStatus === "MANUAL_VERIFICATION_REQUIRED") {
      statusClass = "warning";
      statusLabel = "Manual Check Required";
    } else if (t.verificationStatus === "REJECTED" || t.verificationStatus === "AI_VERIFICATION_FAILED") {
      statusClass = "error";
      statusLabel = "Rejected / Failed";
    }

    const dateStr = new Date(t.createdAt).toLocaleDateString();

    return `
      <tr>
        <td class="font-mono font-bold">${escapeHtml(t.transactionId)}</td>
        <td>${escapeHtml(t.claimedDevice.brand)} ${escapeHtml(t.claimedDevice.model)}</td>
        <td class="text-muted">${dateStr}</td>
        <td><span class="status-badge ${statusClass}">${statusLabel}</span></td>
        <td class="font-mono">${t.estimatedCredits}</td>
        <td class="font-mono font-bold text-sage">${t.verifiedCredits}</td>
        <td>
          <button class="btn btn-secondary btn-sm" onclick="openQrReceiptModal('${escapeHtml(t.transactionId)}', '${escapeHtml(t.claimedDevice.brand + ' ' + t.claimedDevice.model)}', '${statusLabel}')">
            <i class="fa-solid fa-qrcode"></i> View QR
          </button>
        </td>
      </tr>
    `;
  }).join("");
}

function renderActiveVouchers(redemptions) {
  const card = document.getElementById("walletVouchersCard");
  const container = document.getElementById("vouchersListContainer");
  if (!card || !container) return;

  if (!redemptions || redemptions.length === 0) {
    card.hidden = true;
    return;
  }

  card.hidden = false;
  container.innerHTML = redemptions.map(r => `
    <div class="voucher-card">
      <div>
        <h4 class="font-semibold">${escapeHtml(r.rewardTitle)}</h4>
        <span class="text-xs text-muted">Redeemed: ${new Date(r.timestamp).toLocaleDateString()}</span>
      </div>
      <div class="text-right">
        <span class="text-xs text-secondary font-bold">COUPON CODE</span>
        <div class="font-mono font-bold text-lg">${escapeHtml(r.couponCode)}</div>
      </div>
    </div>
  `).join("");
}

window.executeRedemption = async function(credits, rewardId, rewardTitle) {
  try {
    const res = await fetch(`${apiBaseUrl}/api/wallet/redeem`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: currentUserId,
        amount: credits,
        rewardId,
        rewardTitle
      })
    });

    const data = await res.json();
    if (res.ok && data.ok) {
      closeModal("rewardsModal");
      alert(`🎉 Congratulations!\n\nYou have redeemed ${credits} credits for "${rewardTitle}".\n\nYour Partner Coupon Code: ${data.redemption.couponCode}`);
      refreshUserWallet();
    } else {
      alert(`Redemption Failed: ${data.error || "Insufficient available credits."}`);
    }
  } catch (err) {
    console.error("Redemption error:", err);
    alert("Connection error during redemption.");
  }
};

window.openQrReceiptModal = function(txCode, deviceName, status) {
  document.getElementById("receiptTxCode").textContent = txCode;
  document.getElementById("receiptDeviceName").textContent = deviceName;
  document.getElementById("receiptStatusPill").textContent = status;
  generateQrCode("receiptQrHolder", txCode);
  openModal("qrReceiptModal");
};

// ============================================================================
// FACILITY DIRECTORY & LEAFLET MAP (PRESERVED & ENHANCED)
// ============================================================================

function initMap() {
  const mapEl = document.getElementById("facilityMap");
  if (!mapEl) return;

  map = L.map("facilityMap", {
    center: [22.3511, 78.6677],
    zoom: 5,
    minZoom: 4,
    maxZoom: 18,
    zoomControl: true
  });

  L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    subdomains: "abcd",
    maxZoom: 19
  }).addTo(map);

  markerClusterGroup = L.markerClusterGroup({
    showCoverageOnHover: false,
    maxClusterRadius: 35,
    spiderfyOnMaxZoom: true,
    disableClusteringAtZoom: 16,
    iconCreateFunction: function(cluster) {
      const count = cluster.getChildCount();
      return L.divIcon({
        html: `<div class="cluster-bubble"><span>${count}</span></div>`,
        className: "custom-cluster-icon",
        iconSize: L.point(32, 32)
      });
    }
  });

  map.addLayer(markerClusterGroup);
}

async function loadData(datasetFileName = currentDataset) {
  currentDataset = datasetFileName;

  const paths = [
    `./data/e-waste-facilities/${currentDataset}`,
    `data/e-waste-facilities/${currentDataset}`,
    `http://localhost:5000/data/e-waste-facilities/${currentDataset}`
  ];

  for (const path of paths) {
    try {
      const response = await fetch(path);
      if (response.ok) {
        const json = await response.json();
        allFacilitiesData = json.all_facilities || [];
        initAppWithData(allFacilitiesData, json.state_wise_summary || []);
        populateFacilityStaffDropdown();
        return;
      }
    } catch (e) {}
  }
}

function initAppWithData(facilities, stateSummaries) {
  allFacilitiesData = facilities;
  filteredFacilities = [...allFacilitiesData];

  if (userGeoLocation) {
    computeDistances();
  }

  updateKPIs();
  populateStateDropdown(stateSummaries);
  updateTypeTagCounts();
  updateMapMarkers();
  renderFacilityCards();
}

function updateKPIs() {
  const totalCount = allFacilitiesData.length;
  const totalCap = allFacilitiesData.reduce((acc, curr) => acc + (curr.capacity_mta || 0), 0);
  const statesSet = new Set(allFacilitiesData.map(f => f.state));

  const totalFacLanding = document.getElementById("metricTotalFacilities");
  if (totalFacLanding) totalFacLanding.textContent = totalCount.toLocaleString();

  const totalCapLanding = document.getElementById("metricTotalCapacityLanding");
  const totalCapNav = document.getElementById("metricTotalCapacity");

  const capString = totalCap >= 1000000 ? (totalCap / 1000000).toFixed(2) + "M" : totalCap.toLocaleString();
  if (totalCapLanding) totalCapLanding.textContent = capString;
  if (totalCapNav) totalCapNav.textContent = capString;

  const statesEl = document.getElementById("metricStatesCovered");
  if (statesEl) statesEl.textContent = `${statesSet.size} / 36`;
}

function populateStateDropdown(summaries) {
  const stateSelect = document.getElementById("stateSelect");
  if (!stateSelect) return;
  stateSelect.innerHTML = `<option value="ALL">All States (${summaries.length || 36})</option>`;

  const sorted = [...summaries].sort((a, b) => a.state.localeCompare(b.state));
  sorted.forEach(s => {
    const opt = document.createElement("option");
    opt.value = s.state;
    opt.textContent = `${s.state} (${s.total_facilities})`;
    stateSelect.appendChild(opt);
  });
}

function updateTypeTagCounts() {
  const elAll = document.getElementById("tagCountAll");
  const elSaved = document.getElementById("tagCountSaved");
  const elRec = document.getElementById("tagCountRecyclers");
  const elDism = document.getElementById("tagCountDismantlers");
  const elRef = document.getElementById("tagCountRefurbishers");
  const elCol = document.getElementById("tagCountCollection");

  if (elAll) elAll.textContent = allFacilitiesData.length;
  if (elSaved) elSaved.textContent = savedFacilityIds.size;
  if (elRec) elRec.textContent = allFacilitiesData.filter(f => f.type === "Recycler").length;
  if (elDism) elDism.textContent = allFacilitiesData.filter(f => f.type === "Dismantler").length;
  if (elRef) elRef.textContent = allFacilitiesData.filter(f => f.type === "Refurbisher").length;
  if (elCol) elCol.textContent = allFacilitiesData.filter(f => f.type === "Collection Center").length;
}

function applyFilters() {
  const searchEl = document.getElementById("globalSearchInput");
  const searchQuery = searchEl ? searchEl.value.trim().toLowerCase() : "";
  const selectedState = document.getElementById("stateSelect")?.value || "ALL";
  const selectedType = document.getElementById("typeSelect")?.value || "ALL";
  const minCapacity = parseInt(document.getElementById("capacitySelect")?.value, 10) || 0;
  const sortBy = document.getElementById("sortSelect")?.value || "capacity_desc";

  filteredFacilities = allFacilitiesData.filter(fac => {
    if (searchQuery) {
      const matchName = (fac.name || "").toLowerCase().includes(searchQuery);
      const matchDist = (fac.district || "").toLowerCase().includes(searchQuery);
      const matchState = (fac.state || "").toLowerCase().includes(searchQuery);
      const matchAddr = (fac.address || "").toLowerCase().includes(searchQuery);
      const matchId = (fac.id || "").toLowerCase().includes(searchQuery);
      if (!matchName && !matchDist && !matchState && !matchAddr && !matchId) return false;
    }

    if (selectedState !== "ALL" && fac.state !== selectedState) return false;

    if (selectedType === "SAVED") {
      if (!savedFacilityIds.has(fac.id)) return false;
    } else if (selectedType !== "ALL" && fac.type !== selectedType) {
      return false;
    }

    if (minCapacity > 0 && (fac.capacity_mta || 0) < minCapacity) return false;

    return true;
  });

  filteredFacilities.sort((a, b) => {
    if (sortBy === "distance_asc") {
      const distA = a.distanceKm !== undefined ? a.distanceKm : 999999;
      const distB = b.distanceKm !== undefined ? b.distanceKm : 999999;
      return distA - distB;
    }
    if (sortBy === "capacity_desc") return (b.capacity_mta || 0) - (a.capacity_mta || 0);
    if (sortBy === "capacity_asc") return (a.capacity_mta || 0) - (b.capacity_mta || 0);
    if (sortBy === "name_asc") return (a.name || "").localeCompare(b.name || "");
    if (sortBy === "state_asc") return (a.state || "").localeCompare(b.state || "");
    return 0;
  });

  const resCount = document.getElementById("resultsCount");
  if (resCount) resCount.textContent = `${filteredFacilities.length} Facilities`;

  updateMapMarkers();
  renderFacilityCards();
}

function getTypeClass(type) {
  switch (type) {
    case "Recycler": return "recycler";
    case "Dismantler": return "dismantler";
    case "Refurbisher": return "refurbisher";
    case "Collection Center": return "collection";
    default: return "recycler";
  }
}

async function locateUserAndSort() {
  const nearMeBtn = document.getElementById("nearMeBtn");
  const locPill = document.getElementById("userLocationPill");
  const locText = document.getElementById("userLocationText");

  if (!navigator.geolocation) {
    alert("Geolocation is not supported by your browser.");
    return;
  }

  nearMeBtn.classList.add("active");
  locPill.hidden = false;
  locText.textContent = "Resolving Address...";

  navigator.geolocation.getCurrentPosition(
    async (pos) => {
      const userLat = pos.coords.latitude;
      const userLng = pos.coords.longitude;

      let city = "";
      let district = "";
      let state = "";
      let label = "Detected Location";

      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${userLat}&lon=${userLng}&format=json&addressdetails=1`);
        if (res.ok) {
          const geoData = await res.json();
          const addr = geoData.address || {};
          city = addr.city || addr.town || addr.village || addr.suburb || "";
          district = addr.state_district || addr.district || addr.county || "";
          state = addr.state || "";

          const parts = [city || district, state].filter(Boolean);
          if (parts.length > 0) label = parts.join(", ");
        }
      } catch (err) {
        console.warn("Reverse geocode fallback:", err);
      }

      userGeoLocation = { lat: userLat, lng: userLng, city, district, state, displayName: label };
      locText.textContent = `Near ${label}`;

      computeDistances();

      const sortSelect = document.getElementById("sortSelect");
      if (sortSelect) sortSelect.value = "distance_asc";

      applyFilters();

      if (map) {
        map.flyTo([userLat, userLng], 9, { duration: 1.2 });
      }
    },
    (err) => {
      console.error("Geolocation error:", err);
      locText.textContent = "Location Denied";
      setTimeout(() => { locPill.hidden = true; nearMeBtn.classList.remove("active"); }, 2500);
      alert("Unable to retrieve your location. Check browser permissions.");
    },
    { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
  );
}

function computeDistances() {
  if (!userGeoLocation) return;
  const uLat = userGeoLocation.lat;
  const uLng = userGeoLocation.lng;

  allFacilitiesData.forEach(fac => {
    const fLat = fac.location?.latitude;
    const fLng = fac.location?.longitude;
    if (fLat && fLng) {
      fac.distanceKm = getHaversineDistance(uLat, uLng, fLat, fLng);
    } else {
      fac.distanceKm = 999;
    }
  });
}

function getHaversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

function updateMapMarkers() {
  if (!map || !markerClusterGroup) return;

  markerClusterGroup.clearLayers();
  facilityMarkersMap.clear();

  const bounds = [];

  filteredFacilities.forEach(fac => {
    const lat = fac.location?.latitude;
    const lng = fac.location?.longitude;
    if (!lat || !lng) return;

    bounds.push([lat, lng]);

    const typeClass = getTypeClass(fac.type);
    const customIcon = L.divIcon({
      className: `map-marker ${typeClass}`,
      html: `<i class="fa-solid fa-recycle"></i>`,
      iconSize: [22, 22],
      iconAnchor: [11, 22],
      popupAnchor: [0, -22]
    });

    const marker = L.marker([lat, lng], { icon: customIcon, riseOnHover: true });
    const gmapsUrl = fac.location?.google_maps_url || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(fac.name + ', ' + fac.address)}`;

    marker.bindTooltip(
      `<strong>${escapeHtml(fac.name)}</strong><br>${fac.type} • ${fac.district}, ${fac.state}`,
      { permanent: false, direction: 'top', offset: [0, -12] }
    );

    marker.on('popupopen', function() {
      const distInfo = fac.distanceKm !== undefined ? `<div style="font-size: 10px; color: var(--accent-sage);">Distance: <strong>${fac.distanceKm} km</strong></div>` : '';
      const popupContent = `
        <div class="map-popup-inner">
          <span class="popup-type type-tag ${typeClass}">${fac.type}</span>
          <div class="popup-title">${escapeHtml(fac.name)}</div>
          <div class="popup-addr">${escapeHtml(fac.address)}, ${escapeHtml(fac.district)}</div>
          ${distInfo}
          <div class="popup-cap">Capacity: <span>${(fac.capacity_mta || 0).toLocaleString()} MTA</span></div>
          <a href="${gmapsUrl}" target="_blank" rel="noopener" class="popup-gmaps-link">
            Open in Google Maps <i class="fa-solid fa-arrow-up-right-from-square" style="font-size: 9px;"></i>
          </a>
        </div>
      `;
      marker.getPopup().setContent(popupContent);
    });

    marker.on("click", () => {
      selectFacility(fac.id, false);
    });

    markerClusterGroup.addLayer(marker);
    facilityMarkersMap.set(fac.id, marker);
  });

  if (bounds.length > 0 && filteredFacilities.length < allFacilitiesData.length) {
    map.fitBounds(bounds, { padding: [25, 25], maxZoom: 13 });
  }
}

function renderFacilityCards() {
  const container = document.getElementById("facilityCardsContainer");
  if (!container) return;
  container.innerHTML = "";

  if (filteredFacilities.length === 0) {
    container.innerHTML = `
      <div style="padding: 24px 12px; text-align: center; color: var(--text-dim); font-size: 12px;">
        No facilities match your search criteria.
      </div>
    `;
    return;
  }

  const fragment = document.createDocumentFragment();

  filteredFacilities.forEach(fac => {
    const typeClass = getTypeClass(fac.type);
    const isSaved = savedFacilityIds.has(fac.id);
    const distText = fac.distanceKm !== undefined ? `${fac.distanceKm} km` : '';
    const gmapsUrl = fac.location?.google_maps_url || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(fac.name + ', ' + fac.address)}`;

    const card = document.createElement("div");
    card.className = `facility-card ${selectedFacilityId === fac.id ? 'selected' : ''}`;
    card.id = `card-${fac.id}`;

    card.innerHTML = `
      <div class="card-top-row">
        <span class="type-tag ${typeClass}">${fac.type}</span>
        <div class="card-meta-right">
          ${distText ? `<span class="dist-badge"><i class="fa-solid fa-location-arrow" style="font-size: 8px;"></i> ${distText}</span>` : ''}
          <button class="btn-card-save ${isSaved ? 'saved' : ''}" data-id="${fac.id}" title="${isSaved ? 'Remove Bookmark' : 'Save Facility'}">
            <i class="${isSaved ? 'fa-solid' : 'fa-regular'} fa-bookmark"></i>
          </button>
        </div>
      </div>

      <h4>${escapeHtml(fac.name)}</h4>
      <p>${escapeHtml(fac.district)}, ${escapeHtml(fac.state)}</p>

      <div class="card-bottom">
        <span>Cap: <strong>${(fac.capacity_mta || 0).toLocaleString()} MTA</strong></span>
        <a href="${gmapsUrl}" target="_blank" rel="noopener" class="card-gmaps" onclick="event.stopPropagation();">
          Directions <i class="fa-solid fa-arrow-up-right-from-square" style="font-size: 8px;"></i>
        </a>
      </div>
    `;

    card.addEventListener("click", () => {
      selectFacility(fac.id, true);
    });

    const saveBtn = card.querySelector(".btn-card-save");
    saveBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      toggleSaveFacility(fac.id);
    });

    fragment.appendChild(card);
  });

  container.appendChild(fragment);
}

function selectFacility(id, shouldOpenModal = true) {
  selectedFacilityId = id;

  document.querySelectorAll(".facility-card").forEach(c => c.classList.remove("selected"));
  const activeCard = document.getElementById(`card-${id}`);
  if (activeCard) {
    activeCard.classList.add("selected");
    activeCard.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  const fac = allFacilitiesData.find(f => f.id === id);
  if (!fac) return;

  const lat = fac.location?.latitude;
  const lng = fac.location?.longitude;

  if (lat && lng && map) {
    map.flyTo([lat, lng], 13, { duration: 1.0 });
    const marker = facilityMarkersMap.get(id);
    if (marker) {
      setTimeout(() => {
        marker.openPopup();
      }, 600);
    }
  }

  if (shouldOpenModal) {
    openDetailModal(fac);
  }
}

function toggleSaveFacility(id) {
  if (savedFacilityIds.has(id)) {
    savedFacilityIds.delete(id);
  } else {
    savedFacilityIds.add(id);
  }

  localStorage.setItem("savedFacilities", JSON.stringify([...savedFacilityIds]));
  updateTypeTagCounts();
  renderFacilityCards();
}

function setupFacilityDirectoryEvents() {
  const globalSearch = document.getElementById("globalSearchInput");
  if (globalSearch) {
    globalSearch.addEventListener("input", e => {
      const clearBtn = document.getElementById("clearSearchBtn");
      if (clearBtn) clearBtn.style.display = e.target.value ? "block" : "none";
      applyFilters();
    });
  }

  const clearBtn = document.getElementById("clearSearchBtn");
  if (clearBtn) {
    clearBtn.addEventListener("click", () => {
      if (globalSearch) globalSearch.value = "";
      clearBtn.style.display = "none";
      applyFilters();
    });
  }

  document.getElementById("nearMeBtn")?.addEventListener("click", locateUserAndSort);
  document.getElementById("stateSelect")?.addEventListener("change", applyFilters);
  document.getElementById("typeSelect")?.addEventListener("change", applyFilters);
  document.getElementById("capacitySelect")?.addEventListener("change", applyFilters);
  document.getElementById("sortSelect")?.addEventListener("change", applyFilters);

  document.querySelectorAll(".chip").forEach(chip => {
    chip.addEventListener("click", () => {
      document.querySelectorAll(".chip").forEach(c => c.classList.remove("active"));
      chip.classList.add("active");
      const type = chip.getAttribute("data-type");
      const typeSel = document.getElementById("typeSelect");
      if (typeSel) typeSel.value = type;
      applyFilters();
    });
  });

  document.getElementById("resetFiltersBtn")?.addEventListener("click", () => {
    if (globalSearch) globalSearch.value = "";
    if (clearBtn) clearBtn.style.display = "none";
    document.getElementById("stateSelect").value = "ALL";
    document.getElementById("typeSelect").value = "ALL";
    document.getElementById("capacitySelect").value = "0";
    document.getElementById("sortSelect").value = "capacity_desc";
    document.querySelectorAll(".chip").forEach(c => c.classList.remove("active"));
    document.querySelector(".chip[data-type='ALL']")?.classList.add("active");
    applyFilters();
    if (map) map.setView([22.3511, 78.6677], 5);
  });

  document.getElementById("resetMapCenterBtn")?.addEventListener("click", () => {
    if (map) map.flyTo([22.3511, 78.6677], 5, { duration: 1.0 });
  });

  // Dataset switchers
  const handleDatasetChange = async (e) => {
    const selected = e.target.value;
    const filterSelect = document.getElementById("datasetSelect");
    const navSelect = document.getElementById("navDatasetSelect");
    if (filterSelect) filterSelect.value = selected;
    if (navSelect) navSelect.value = selected;
    await loadData(selected);
    applyFilters();
  };

  document.getElementById("datasetSelect")?.addEventListener("change", handleDatasetChange);
  document.getElementById("navDatasetSelect")?.addEventListener("change", handleDatasetChange);

  document.getElementById("exportDataBtn")?.addEventListener("click", exportData);
}

function exportData() {
  if (filteredFacilities.length === 0) return;
  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(filteredFacilities, null, 2));
  const a = document.createElement("a");
  a.setAttribute("href", dataStr);
  a.setAttribute("download", `e_waste_facilities_${new Date().toISOString().slice(0,10)}.json`);
  document.body.appendChild(a);
  a.click();
  a.remove();
}

// ============================================================================
// GENERAL EVALUATION CAMERA (PRESERVED)
// ============================================================================

function setupGeneralEvalScanner() {
  const startBtn = document.getElementById("startBtn");
  const stopBtn = document.getElementById("stopBtn");
  const captureBtn = document.getElementById("captureBtn");
  const switchBtn = document.getElementById("switchCameraBtn");
  const fileInput = document.getElementById("fileInput");
  const reanalyzeBtn = document.getElementById("reanalyzeBtn");

  if (startBtn) startBtn.addEventListener("click", startEvalCamera);
  if (stopBtn) stopBtn.addEventListener("click", () => stopEvalCamera(true));
  if (captureBtn) captureBtn.addEventListener("click", captureEvalImage);
  if (switchBtn) switchBtn.addEventListener("click", switchEvalCamera);

  if (fileInput) {
    fileInput.addEventListener("change", e => {
      if (e.target.files && e.target.files[0]) {
        readEvalFile(e.target.files[0]);
      }
    });
  }

  if (reanalyzeBtn) {
    reanalyzeBtn.addEventListener("click", () => {
      document.getElementById("results").hidden = true;
      document.getElementById("preview").hidden = true;
      document.getElementById("preview").src = "";
      if (!evalStream) document.getElementById("cameraPlaceholder").hidden = false;
      else document.getElementById("video").hidden = false;
    });
  }
}

async function startEvalCamera() {
  const video = document.getElementById("video");
  const placeholder = document.getElementById("cameraPlaceholder");
  const preview = document.getElementById("preview");
  const startBtn = document.getElementById("startBtn");
  const stopBtn = document.getElementById("stopBtn");
  const captureBtn = document.getElementById("captureBtn");
  const switchBtn = document.getElementById("switchCameraBtn");

  try {
    if (evalStream) stopEvalCamera(false);

    evalStream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: { ideal: evalFacingMode },
        width: { ideal: 1920 },
        height: { ideal: 1080 }
      },
      audio: false
    });

    if (video) {
      video.srcObject = evalStream;
      video.hidden = false;
    }
    if (placeholder) placeholder.hidden = true;
    if (preview) preview.hidden = true;
    if (switchBtn) switchBtn.hidden = false;

    if (startBtn) startBtn.disabled = true;
    if (captureBtn) captureBtn.disabled = false;
    if (stopBtn) stopBtn.disabled = false;
  } catch (err) {
    console.error("Evaluation camera access error:", err);
  }
}

function stopEvalCamera(updateUI = true) {
  if (evalStream) {
    evalStream.getTracks().forEach(t => t.stop());
    evalStream = null;
  }
  const video = document.getElementById("video");
  const placeholder = document.getElementById("cameraPlaceholder");
  const preview = document.getElementById("preview");
  const startBtn = document.getElementById("startBtn");
  const stopBtn = document.getElementById("stopBtn");
  const captureBtn = document.getElementById("captureBtn");
  const switchBtn = document.getElementById("switchCameraBtn");

  if (video) {
    video.srcObject = null;
    video.hidden = true;
  }
  if (switchBtn) switchBtn.hidden = true;
  if (!preview || preview.hidden) {
    if (placeholder) placeholder.hidden = false;
  }

  if (startBtn) startBtn.disabled = false;
  if (captureBtn) captureBtn.disabled = true;
  if (stopBtn) stopBtn.disabled = true;
}

async function switchEvalCamera() {
  evalFacingMode = evalFacingMode === "environment" ? "user" : "environment";
  await startEvalCamera();
}

function captureEvalImage() {
  const video = document.getElementById("video");
  const canvas = document.getElementById("canvas");
  const preview = document.getElementById("preview");

  if (!evalStream || !video || !video.videoWidth) return;

  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;

  const ctx = canvas.getContext("2d");
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

  const imageData = canvas.toDataURL("image/jpeg", 0.85);

  if (preview) {
    preview.src = imageData;
    preview.hidden = false;
  }
  if (video) video.hidden = true;

  analyzeGeneralImage(imageData);
}

function readEvalFile(file) {
  if (!file || !file.type.startsWith("image/")) return;

  const reader = new FileReader();
  reader.onload = () => {
    const preview = document.getElementById("preview");
    const video = document.getElementById("video");
    const placeholder = document.getElementById("cameraPlaceholder");

    if (preview) {
      preview.src = reader.result;
      preview.hidden = false;
    }
    if (video) video.hidden = true;
    if (placeholder) placeholder.hidden = true;

    stopEvalCamera(false);
    analyzeGeneralImage(reader.result);
  };
  reader.readAsDataURL(file);
}

async function analyzeGeneralImage(imageData) {
  if (evalAnalyzing) return;
  evalAnalyzing = true;

  try {
    const res = await fetch(`${apiBaseUrl}/api/analyze`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ image: imageData })
    });

    const data = await res.json();
    if (res.ok) {
      latestClassification = data;
      const resCard = document.getElementById("results");
      if (resCard) resCard.hidden = false;

      document.getElementById("item").textContent = data.item || "Electronic Device";
      document.getElementById("category").textContent = data.category || "General Electronics";
      document.getElementById("subcategory").textContent = data.subcategory || "Unspecified";
      document.getElementById("condition").textContent = data.condition || "Used";

      const conf = Math.round(Number(data.confidence) * 100);
      document.getElementById("confidenceText").textContent = `${conf}%`;
      document.getElementById("confidenceBar").style.width = `${conf}%`;
      document.getElementById("rawJson").textContent = JSON.stringify(data, null, 2);

      const ewasteBadge = document.getElementById("ewasteBadge");
      if (data.is_ewaste) {
        ewasteBadge.innerHTML = `<i class="fa-solid fa-circle-check"></i> E-Waste Item Identified`;
        ewasteBadge.className = "verdict-banner yes";
      } else {
        ewasteBadge.innerHTML = `<i class="fa-solid fa-circle-xmark"></i> Not Classified as E-Waste`;
        ewasteBadge.className = "verdict-banner no";
      }
    }
  } catch (err) {
    console.error("General analysis error:", err);
  } finally {
    evalAnalyzing = false;
  }
}

// ============================================================================
// MODALS & CERTIFICATES (PRESERVED)
// ============================================================================

window.openModal = function(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) modal.classList.add("active");
};

window.closeModal = function(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) modal.classList.remove("active");
};

function openDetailModal(fac) {
  const modal = document.getElementById("detailModal");
  if (!modal) return;

  const typeClass = getTypeClass(fac.type);
  const typeBadge = document.getElementById("modalTypeBadge");
  if (typeBadge) {
    typeBadge.textContent = fac.type;
    typeBadge.className = `modal-type-tag type-tag ${typeClass}`;
  }

  const isSaved = savedFacilityIds.has(fac.id);
  const modalSaveBtn = document.getElementById("modalBookmarkBtn");
  if (modalSaveBtn) {
    modalSaveBtn.className = `btn-bookmark-modal ${isSaved ? 'saved' : ''}`;
    modalSaveBtn.innerHTML = `<i class="${isSaved ? 'fa-solid' : 'fa-regular'} fa-bookmark"></i>`;
    modalSaveBtn.onclick = () => toggleSaveFacility(fac.id);
  }

  document.getElementById("modalFacilityName").textContent = fac.name;
  document.getElementById("modalId").textContent = fac.id;
  document.getElementById("modalCapacity").textContent = `${(fac.capacity_mta || 0).toLocaleString()} MTA`;
  document.getElementById("modalAuthBy").textContent = fac.authorization_by || "State Pollution Control Board (SPCB)";
  document.getElementById("modalAddress").textContent = fac.address || "N/A";
  document.getElementById("modalDistrictState").textContent = `${fac.district || 'N/A'}, ${fac.state || 'N/A'}`;

  const distRow = document.getElementById("modalDistanceRow");
  if (distRow) {
    if (fac.distanceKm !== undefined) {
      distRow.style.display = "flex";
      document.getElementById("modalDistance").textContent = `${fac.distanceKm} km away`;
    } else {
      distRow.style.display = "none";
    }
  }

  document.getElementById("modalPhone").textContent = fac.contact?.phone || "Not available";
  document.getElementById("modalTollFree").textContent = fac.contact?.toll_free || "Not listed";
  document.getElementById("modalEmail").textContent = fac.contact?.email || "Not available";
  document.getElementById("modalWebsite").textContent = fac.contact?.website || "Not available";
  document.getElementById("modalContactPerson").textContent = fac.contact?.contact_person || "Official In-Charge";

  const gmapsUrl = fac.location?.google_maps_url || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(fac.name + ', ' + fac.address)}`;
  document.getElementById("modalGoogleMapsBtn").href = gmapsUrl;

  const modalPickupBtn = document.getElementById("modalPickupBtn");
  if (modalPickupBtn) {
    modalPickupBtn.onclick = () => {
      modal.classList.remove("active");
      openPickupModal(fac);
    };
  }

  modal.classList.add("active");
}

function openPickupModal(fac) {
  const pickupModal = document.getElementById("pickupModal");
  if (!pickupModal) return;

  const targetFacility = fac || (allFacilitiesData.find(f => f.id === selectedFacilityId)) || allFacilitiesData[0];
  document.getElementById("pickupFacilityName").value = targetFacility ? `${targetFacility.name} (${targetFacility.district}, ${targetFacility.state})` : "Authorized E-Waste Recycler";

  if (latestClassification) {
    document.getElementById("pickupItemType").value = `${latestClassification.item} (${latestClassification.category})`;
  }

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  document.getElementById("pickupDate").value = tomorrow.toISOString().slice(0, 10);

  pickupModal.classList.add("active");
}

function openCertModal() {
  const certModal = document.getElementById("certModal");
  if (!certModal) return;

  const item = latestClassification?.item || "Electronic Scrap";
  const category = latestClassification?.category || "Information Technology Equipment";
  const condition = latestClassification?.condition || "Decommissioned / Used";

  const randomNum = Math.floor(1000 + Math.random() * 9000);
  document.getElementById("certId").textContent = `EPR-2026-IND-${randomNum}`;
  document.getElementById("certItem").textContent = item;
  document.getElementById("certCategory").textContent = category;
  document.getElementById("certCondition").textContent = condition;

  const activeFac = allFacilitiesData.find(f => f.id === selectedFacilityId) || allFacilitiesData[0];
  document.getElementById("certFacility").textContent = activeFac ? activeFac.name : "Authorized CPCB Recycler Partner";
  document.getElementById("certAuthBy").textContent = activeFac?.authorization_by || "CPCB / SPCB";
  document.getElementById("certDate").textContent = new Date().toISOString().slice(0, 10);

  certModal.classList.add("active");
}

function setupEcoAndCertEvents() {
  document.getElementById("schedulePickupBtn")?.addEventListener("click", () => openPickupModal(null));
  document.getElementById("generateCertBtn")?.addEventListener("click", openCertModal);
  document.getElementById("printCertBtn")?.addEventListener("click", () => window.print());

  document.getElementById("closeModalBtn")?.addEventListener("click", () => closeModal("detailModal"));
  document.getElementById("closePickupModalBtn")?.addEventListener("click", () => closeModal("pickupModal"));
  document.getElementById("closeCertModalBtn")?.addEventListener("click", () => closeModal("certModal"));

  document.querySelectorAll(".modal-backdrop").forEach(backdrop => {
    backdrop.addEventListener("click", e => {
      if (e.target === backdrop) backdrop.classList.remove("active");
    });
  });

  const pickupForm = document.getElementById("pickupForm");
  if (pickupForm) {
    pickupForm.addEventListener("submit", e => {
      e.preventDefault();
      const ticket = "PU-" + Math.floor(100000 + Math.random() * 900000);
      alert(`Pickup request successfully registered!\n\nTracking ID: ${ticket}\nOur authorized logistics representative will contact you on the scheduled date.`);
      closeModal("pickupModal");
      pickupForm.reset();
    });
  }

  document.querySelectorAll(".copy-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const targetId = btn.getAttribute("data-copy");
      const text = document.getElementById(targetId)?.textContent;
      if (text && text !== "--" && text !== "Not available") {
        navigator.clipboard.writeText(text);
        const orig = btn.innerHTML;
        btn.innerHTML = `<i class="fa-solid fa-check" style="color: var(--accent-sage);"></i>`;
        setTimeout(() => { btn.innerHTML = orig; }, 1200);
      }
    });
  });
}

// Hazard Modals
window.openHazardModal = function(modalId) {
  openModal(modalId);
};

window.closeHazardModal = function(modalId) {
  closeModal(modalId);
};

async function checkBackendHealth() {
  try {
    const res = await fetch(`${apiBaseUrl}/api/health`);
    if (res.ok) {
      const data = await res.json();
      const statusEl = document.getElementById("status");
      if (statusEl) {
        statusEl.innerHTML = `<span class="status-dot"></span><span>${data.nvidiaKeyConfigured ? "AI Online" : "AI Key Missing"}</span>`;
        statusEl.className = "status-badge " + (data.nvidiaKeyConfigured ? "success" : "warning");
      }
    }
  } catch (e) {}
}

function escapeHtml(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
