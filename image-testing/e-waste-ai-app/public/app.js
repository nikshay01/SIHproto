// ==========================================================================
// E-WASTE AI CLASSIFIER - CLIENT ENGINE
// ==========================================================================

const video = document.getElementById("video");
const canvas = document.getElementById("canvas");
const preview = document.getElementById("preview");
const placeholder = document.getElementById("cameraPlaceholder");
const scannerLaser = document.getElementById("scannerLaser");
const shutterFlash = document.getElementById("shutterFlash");
const switchCameraBtn = document.getElementById("switchCameraBtn");
const dropZone = document.getElementById("dropZone");
const reanalyzeBtn = document.getElementById("reanalyzeBtn");

const startBtn = document.getElementById("startBtn");
const captureBtn = document.getElementById("captureBtn");
const stopBtn = document.getElementById("stopBtn");
const fileInput = document.getElementById("fileInput");

const statusEl = document.getElementById("status");
const results = document.getElementById("results");

let stream = null;
let analyzing = false;
let currentFacingMode = "environment"; // "environment" or "user"

// Status Helper with Icons
function setStatus(message, type = "", iconClass = "") {
  let defaultIcon = "fa-solid fa-circle-info";
  if (type === "loading") defaultIcon = "fa-solid fa-circle-notch fa-spin";
  if (type === "success") defaultIcon = "fa-solid fa-circle-check";
  if (type === "error") defaultIcon = "fa-solid fa-triangle-exclamation";

  const icon = iconClass || defaultIcon;
  statusEl.innerHTML = `<i class="${icon}"></i> <span>${message}</span>`;
  statusEl.className = "status";
  if (type) statusEl.classList.add(type);
}

// Check Backend Health & NVIDIA Key
async function checkBackend() {
  try {
    const response = await fetch("/api/health");
    const data = await response.json();

    if (!data.nvidiaKeyConfigured) {
      setStatus("Backend online, but NVIDIA API key is missing from .env", "error");
      return;
    }

    setStatus("Neural backend active • Ready for optical capture", "success");
  } catch (error) {
    console.error("Backend health check error:", error);
    setStatus("Cannot connect to Express backend. Ensure port 5000 is running.", "error");
  }
}

// Start Camera Stream
async function startCamera() {
  try {
    setStatus("Accessing optical sensor...", "loading");

    if (stream) {
      stopCamera(false);
    }

    stream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: { ideal: currentFacingMode },
        width: { ideal: 1920 },
        height: { ideal: 1080 }
      },
      audio: false
    });

    video.srcObject = stream;
    placeholder.hidden = true;
    preview.hidden = true;
    video.hidden = false;

    // Activate laser scanner overlay
    if (scannerLaser) scannerLaser.classList.add("active");
    if (switchCameraBtn) switchCameraBtn.hidden = false;

    startBtn.disabled = true;
    captureBtn.disabled = false;
    stopBtn.disabled = false;

    setStatus("Sensor active. Frame the electronic component & capture.", "success");
  } catch (error) {
    console.error("Camera access error:", error);
    setStatus(
      "Camera access failed. Check browser permissions or use file upload.",
      "error"
    );
  }
}

// Switch Front / Back Camera
async function switchCamera() {
  currentFacingMode = currentFacingMode === "environment" ? "user" : "environment";
  await startCamera();
}

// Stop Camera Stream
function stopCamera(updateStatusText = true) {
  if (stream) {
    stream.getTracks().forEach(track => track.stop());
    stream = null;
  }

  video.srcObject = null;
  video.hidden = true;

  if (scannerLaser) scannerLaser.classList.remove("active");
  if (switchCameraBtn) switchCameraBtn.hidden = true;

  if (!preview.src || preview.hidden) {
    placeholder.hidden = false;
  }

  startBtn.disabled = false;
  captureBtn.disabled = true;
  stopBtn.disabled = true;

  if (updateStatusText) {
    setStatus("Sensor standby mode. Ready to capture.", "");
  }
}

// Trigger Shutter Flash Effect
function triggerShutterFlash() {
  if (!shutterFlash) return;
  shutterFlash.classList.remove("flash");
  void shutterFlash.offsetWidth; // Force reflow
  shutterFlash.classList.add("flash");
}

// Capture Snapshot from Video
function captureImage() {
  if (!stream || !video.videoWidth) {
    setStatus("Camera stream is not ready.", "error");
    return;
  }

  triggerShutterFlash();

  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;

  const ctx = canvas.getContext("2d");
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

  const imageData = canvas.toDataURL("image/jpeg", 0.85);

  preview.src = imageData;
  preview.hidden = false;
  video.hidden = true;
  placeholder.hidden = true;

  analyzeImage(imageData);
}

// Read Image from File Upload
function readUploadedImage(file) {
  if (!file) return;

  if (!file.type.startsWith("image/")) {
    setStatus("Please select a valid image file (JPEG, PNG, WEBP).", "error");
    return;
  }

  triggerShutterFlash();

  const reader = new FileReader();

  reader.onload = () => {
    preview.src = reader.result;
    preview.hidden = false;
    video.hidden = true;
    placeholder.hidden = true;
    
    // Stop live camera if active to save resources
    if (stream) stopCamera(false);

    analyzeImage(reader.result);
  };

  reader.onerror = () => {
    setStatus("Could not read image file.", "error");
  };

  reader.readAsDataURL(file);
}

// Send Image to Express Relay & NVIDIA API
async function analyzeImage(imageData) {
  if (analyzing) return;

  analyzing = true;
  captureBtn.disabled = true;
  if (scannerLaser) scannerLaser.classList.add("active");

  setStatus("NVIDIA Llama 3.2 Vision analyzing neural telemetry...", "loading");

  try {
    const response = await fetch("/api/analyze", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        image: imageData
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Analysis request failed");
    }

    displayResults(data);
    setStatus("Neural classification complete.", "success");
  } catch (error) {
    console.error("Analysis error:", error);

    results.hidden = false;
    document.getElementById("rawJson").textContent = JSON.stringify(
      { error: error.message },
      null,
      2
    );

    setStatus(`Analysis failed: ${error.message}`, "error");
  } finally {
    analyzing = false;
    captureBtn.disabled = !stream;
    if (!stream && scannerLaser) {
      scannerLaser.classList.remove("active");
    }
  }
}

// Render Results in DOM
function displayResults(data) {
  results.hidden = false;

  const ewasteBadge = document.getElementById("ewasteBadge");

  if (data.is_ewaste) {
    ewasteBadge.innerHTML = `<i class="fa-solid fa-circle-check"></i> E-WASTE DETECTED & CLASSIFIED`;
    ewasteBadge.className = "classification yes";
  } else {
    ewasteBadge.innerHTML = `<i class="fa-solid fa-circle-xmark"></i> NOT CLASSIFIED AS E-WASTE`;
    ewasteBadge.className = "classification no";
  }

  document.getElementById("item").textContent = data.item || "Unknown Item";
  document.getElementById("category").textContent = data.category || "General Electronics";
  document.getElementById("subcategory").textContent = data.subcategory || "Unspecified";

  // Condition Badge
  const conditionEl = document.getElementById("condition");
  const condText = data.condition || "Unknown";
  conditionEl.textContent = condText;
  conditionEl.className = "metric-value condition-badge";

  const lowerCond = condText.toLowerCase();
  if (lowerCond.includes("new")) conditionEl.classList.add("cond-new");
  else if (lowerCond.includes("used")) conditionEl.classList.add("cond-used");
  else if (lowerCond.includes("damage") || lowerCond.includes("broken")) {
    conditionEl.classList.add("cond-damaged");
  }

  // Animated Confidence Fill
  const confidence = Math.round(Number(data.confidence) * 100);
  document.getElementById("confidenceText").textContent = `${confidence}%`;
  
  // Smoothly trigger transition
  const confBar = document.getElementById("confidenceBar");
  confBar.style.width = "0%";
  setTimeout(() => {
    confBar.style.width = `${confidence}%`;
  }, 100);

  document.getElementById("description").textContent = data.description || "No visual description provided.";

  document.getElementById("rawJson").textContent = JSON.stringify(data, null, 2);

  results.scrollIntoView({
    behavior: "smooth",
    block: "start"
  });
}

// Reset / Clear View
function resetView() {
  results.hidden = true;
  preview.hidden = true;
  preview.src = "";
  if (!stream) {
    placeholder.hidden = false;
  } else {
    video.hidden = false;
  }
  document.getElementById("confidenceBar").style.width = "0%";
  setStatus("Reset complete. Ready for new capture.", "success");
}

// Drag and Drop Handling
if (dropZone) {
  ["dragenter", "dragover"].forEach(eventName => {
    dropZone.addEventListener(eventName, e => {
      e.preventDefault();
      e.stopPropagation();
      dropZone.classList.add("dragover");
    });
  });

  ["dragleave", "drop"].forEach(eventName => {
    dropZone.addEventListener(eventName, e => {
      e.preventDefault();
      e.stopPropagation();
      dropZone.classList.remove("dragover");
    });
  });

  dropZone.addEventListener("drop", e => {
    const dt = e.dataTransfer;
    const files = dt.files;
    if (files && files.length > 0) {
      readUploadedImage(files[0]);
    }
  });
}

// Event Listeners
startBtn.addEventListener("click", startCamera);
stopBtn.addEventListener("click", () => stopCamera(true));
captureBtn.addEventListener("click", captureImage);
if (switchCameraBtn) switchCameraBtn.addEventListener("click", switchCamera);
if (reanalyzeBtn) reanalyzeBtn.addEventListener("click", resetView);

fileInput.addEventListener("change", event => {
  if (event.target.files && event.target.files[0]) {
    readUploadedImage(event.target.files[0]);
  }
});

window.addEventListener("beforeunload", () => stopCamera(false));

// Initialize backend health check
checkBackend();