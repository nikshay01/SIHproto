# Implementation Plan: AI Device Verification & E-Waste Credit System (SIH1392)

Add an AI-powered Device Verification and E-Waste Credit System to the existing **Eco-Locate (E-Cycle India)** application. This system prevents fraudulent claims (e.g. claiming an iPhone 13 but submitting an iPhone 11) using computer vision, calculates estimated credits based on a device composition database, generates unique verification QR transaction IDs, and enables authorized facilities to physically verify drop-offs to award redeemable reward credits.

---

## User Review Required

> [!IMPORTANT]
> **Key Architecture & Preservation Principles:**
> - **Existing Features Preserved:** All existing functionality (Leaflet geospatial map of 421 facilities, search & filters, CPCB/SPCB directory, scrap value calculator, PDF certificate generator, doorstep pickup dispatch, theme switcher) will remain intact.
> - **AI Model:** Uses the configured NVIDIA Vision model (`meta/llama-3.2-11b-vision-instruct` via `NVIDIA_NIM_KEY` in `.env`) with an anti-fraud prompt comparing claimed vs detected device attributes, and a fallback simulation mode if offline.
> - **Credit Distinction:** Reward credits are strictly designated as **"E-Waste Credits"** / **"Reward Credits"** with explicit legal disclaimers stating they are platform incentives and not statutory EPR certificates.
> - **Anti-Fraud & Server Source of Truth:** All credit calculations, status transitions, and wallet updates are executed strictly on the backend. Frontend inputs are never trusted for credit values.

---

## Proposed Architecture & Component Design

```
+----------------------------------------------------------------------------------------------------+
|                                      FRONTEND (index.html / app.js / style.css)                    |
|                                                                                                    |
|  [Home]  |  [Locate Map]  |  [Verify & Claim (NEW)]  |  [Facility Portal (NEW)]  |  [Wallet (NEW)] |
+------------------------------------+--------------------------------+------------------------------+
                                     |                                |
                              REST API Calls                   REST API Calls
                                     v                                v
+----------------------------------------------------------------------------------------------------+
|                                    BACKEND (server.js & Modular Services)                          |
|                                                                                                    |
|  +------------------------+  +------------------------+  +---------------------------------------+ |
|  |  aiVerificationService |  |   creditEngineService  |  |            deviceService              | |
|  |  (NVIDIA Llama 3.2 V)  |  | (Configurable formula) |  |   (Device Composition Database)       | |
|  +------------------------+  +------------------------+  +---------------------------------------+ |
|                                                                                                    |
|  +-----------------------------------------------------------------------------------------------+ |
|  |                          verificationRepository & walletService                               | |
|  |        (Transaction Lifecycle, Anti-Fraud Guards, Audit Logging, Persistent Storage)          | |
|  +-----------------------------------------------------------------------------------------------+ |
+----------------------------------------------------------------------------------------------------+
                                     |
                             JSON Data Store
                                     v
                 [ data/devices.json | data/transactions.json | data/wallets.json ]
```

---

## Proposed Changes

### 1. Data Layer & Databases

#### [NEW] [`data/device_composition.json`](file:///d:/nikshay/coding/SIH/main-project/data/device_composition.json)
- Structured reference database containing estimated material compositions for consumer electronics:
  - **Categories:** Smartphones, Laptops, Tablets, Televisions, Monitors, Desktops, Printers, Lithium Batteries, Motherboards/PCBs, Power Adapters.
  - **Attributes:** `id`, `category`, `brand`, `model`, `weightGrams`, `releaseYear`, `referenceSource`, `materials` (`gold`, `silver`, `copper`, `aluminium`, `cobalt`, `lithium`, `plastics`, `other`) with `amountGrams` and estimated `recoveryRate` (e.g. 0.90).
  - Explicit disclaimer note stating data is reference/estimated scoring data.

#### [NEW] [`data/verification_transactions.json`](file:///d:/nikshay/coding/SIH/main-project/data/verification_transactions.json) & [`data/user_wallets.json`](file:///d:/nikshay/coding/SIH/main-project/data/user_wallets.json)
- Initial state storage files for verified transactions, audit logs, and user credit wallets with persistent atomic write support.

---

### 2. Backend Services (`services/`)

#### [NEW] [`services/creditEngine.js`](file:///d:/nikshay/coding/SIH/main-project/services/creditEngine.js)
- Centralized, configurable credit calculation engine.
- Configurable multipliers:
  ```javascript
  const MATERIAL_MULTIPLIERS = {
    gold: 1000,
    silver: 10,
    copper: 2,
    aluminium: 0.5,
    cobalt: 4,
    lithium: 3,
    plastics: 0.05,
    other: 0.1
  };
  ```
- Formula:
  $$\text{BaseCredits} = \text{round}\left( \sum (\text{materialAmountGrams} \times \text{recoveryRate} \times \text{materialMultiplier}) \right)$$
- Helper methods to calculate full material breakdown and estimated credits for any device model.

#### [NEW] [`services/deviceService.js`](file:///d:/nikshay/coding/SIH/main-project/services/deviceService.js)
- Reads and indexes the device composition database.
- Methods: `getCategories()`, `getBrandsByCategory(category)`, `getModelsByBrand(category, brand)`, `getDeviceById(id)`, `searchDevices(query)`.

#### [NEW] [`services/aiVerificationService.js`](file:///d:/nikshay/coding/SIH/main-project/services/aiVerificationService.js)
- Interfaces with NVIDIA Vision API (`meta/llama-3.2-11b-vision-instruct`).
- Accepts: `claimedCategory`, `claimedBrand`, `claimedModel`, `image` (base64 Data URL).
- Sends specialized vision prompt to identify physical traits (e.g., iPhone 13 diagonal camera lenses vs iPhone 11 vertical cameras).
- Applies Verification Decision Matrix:
  - $\text{Confidence} \ge 0.90 \land \text{match} == \text{true} \implies \text{AI\_VERIFIED} \rightarrow \text{PENDING\_RECYCLING}$
  - $0.70 \le \text{Confidence} < 0.90 \implies \text{MANUAL\_VERIFICATION\_REQUIRED}$
  - $\text{Confidence} < 0.70 \lor \text{match} == \text{false} \implies \text{AI\_VERIFICATION\_FAILED}$
- Returns normalized decision object without exposing internal API keys.

#### [NEW] [`services/verificationStore.js`](file:///d:/nikshay/coding/SIH/main-project/services/verificationStore.js)
- Manages transaction lifecycle:
  - Statuses: `PENDING_AI_VERIFICATION`, `AI_VERIFIED`, `MANUAL_VERIFICATION_REQUIRED`, `AI_VERIFICATION_FAILED`, `PENDING_RECYCLING`, `FACILITY_VERIFIED`, `CREDITS_ISSUED`, `REJECTED`.
- Generates unique ID: `EW-2026-[A-Z0-9]{6}` (e.g. `EW-2026-A82F91`).
- Anti-fraud rules:
  1. Prevents duplicate verification of the same transaction ID.
  2. Ensures only authorized facilities can mark `FACILITY_VERIFIED`.
  3. Rejects cannot issue credits without manual override.
  4. Appends audit log with timestamp, action, actor, and status delta for every state change.
- Manages User Wallets:
  - Tracks `estimatedCredits`, `verifiedCredits`, `redeemedCredits`, `availableCredits`.
  - Atomically moves credits from `estimated` to `verified` and updates `available` upon facility confirmation.
  - Allows redemption for eco-perks with server-side validation.

---

### 3. Server Endpoints (`server.js`)

#### [MODIFY] [`server.js`](file:///d:/nikshay/coding/SIH/main-project/server.js)
- Integrate new modular routes:
  - `GET /api/devices/categories` — List available categories
  - `GET /api/devices/list` — Filter/search devices by category/brand/keyword
  - `GET /api/devices/:id` — Get device composition & estimated credits
  - `POST /api/verify/claim-and-verify` — Upload image + claim details, execute AI verification, calculate estimated credits, create transaction `EW-2026-XXXXXX`
  - `GET /api/verify/transaction/:transactionId` — Fetch transaction details (used by user QR modal & facility scanner)
  - `POST /api/verify/facility-confirm` — Facility verifies physical device, updates status to `FACILITY_VERIFIED` -> `CREDITS_ISSUED`, credits wallet
  - `POST /api/verify/facility-reject` — Facility rejects physical mismatch / damaged device, updates status to `REJECTED`
  - `GET /api/wallet/:userId` — Fetch user wallet balances & transaction ledger
  - `POST /api/wallet/redeem` — Redeem available credits for eco-vouchers / partner rewards
  - `GET /api/audit/transactions` — Fetch transaction audit history

---

### 4. Frontend UI & UX (`index.html`, `app.js`, `style.css`)

#### [MODIFY] [`index.html`](file:///d:/nikshay/coding/SIH/main-project/index.html)
- **Top Navigation Bar:** Add navigation buttons for **Verify Device**, **Facility Portal**, and **My Wallet** alongside Home, Locate, Evaluate, and Learn.
- **Section: Device Verification & Anti-Fraud Flow (`#verifySection`):**
  - **Step 1 & 2: Device Selection & Claim Card:**
    - Category pills / dropdown (Smartphone, Laptop, Tablet, TV, Monitor, etc.)
    - Brand filter (Apple, Samsung, Dell, Lenovo, HP, etc.)
    - Searchable Device list / dropdown populated from backend composition database.
    - Claim summary box: *"I am recycling: Apple iPhone 13"*.
  - **Step 3: Guided Camera Viewfinder:**
    - Live camera stream with switch camera (front/rear), snapshot button, and drag-and-drop image upload fallback.
    - Visual step guidance prompts: *"1. Show front of device"*, *"2. Rotate device"*, *"3. Show back camera module"*, *"4. Keep device within frame"*.
  - **Step 4: AI Verification Result Card:**
    - Claimed vs Detected device comparison card.
    - Confidence indicator, detection match badge (✓ Verified / ✕ Mismatch / ⚠ Manual Review).
    - Estimated Recoverable Materials breakdown (Gold, Silver, Copper, Aluminium).
    - Estimated E-Waste Credits badge with non-redeemable disclaimer.
    - Generated QR Code and Transaction ID badge (`EW-2026-A82F91`).
- **Section: Facility Verification Portal (`#facilitySection`):**
  - Facility staff selector / login using registered CPCB/SPCB units.
  - Interactive QR Scanner (camera) + Transaction ID lookup input.
  - Verification Inspection View:
    - Claimed device vs AI detected device preview.
    - Estimated credits, user info, AI confidence, timestamp.
    - Two prominent decision buttons: `[ VERIFY & ACCEPT DEVICE ]` and `[ REJECT DEVICE ]`.
    - Live toast / confirmation modal on approval with instant credit issuance status.
- **Section: Credits Wallet & Ledger (`#walletSection`):**
  - 4 Key Metric Cards: Estimated Credits, Verified Credits, Redeemed Credits, Available Credits.
  - Rewards Store / Voucher redemption modal (e.g. ₹100 Green Voucher, Plant a Tree, Discount Coupon).
  - Transaction History Ledger with status pills, device names, dates, and QR receipt view.
  - Prominent legal disclaimer at the bottom.
- **Update Evaluate Section:** Connect "Evaluate" action buttons directly to start the device claim & verification flow.

#### [MODIFY] [`style.css`](file:///d:/nikshay/coding/SIH/main-project/style.css)
- Add styling matching the M3 Forest Green / Sage / Zen theme for:
  - Step wizard progress bar and claim cards.
  - Camera guidance overlay badges.
  - QR Code card with high-contrast background and copyable transaction chip.
  - Claimed vs Detected comparison diff box (highlighting matching or conflicting brands/models).
  - Facility dashboard layout and inspection view.
  - Wallet balance cards and transaction ledger table.
  - Legal disclaimer badge.

#### [MODIFY] [`app.js`](file:///d:/nikshay/coding/SIH/main-project/app.js)
- Implement comprehensive client-side controllers:
  - Seamless section switching (`showSection(sectionId)` for `landing`, `locate`, `evaluate`, `verify`, `facility`, `wallet`, `learn`).
  - Device claim & catalog selector with backend search.
  - Verification camera controller with step guidelines and capture.
  - Verification API submission & result renderer with QR code generation.
  - Facility portal controller with QR scan / ID search and physical confirm/reject handlers.
  - Wallet controller with balance sync, redemption simulator, and transaction ledger.
  - Persistent user ID in `localStorage` (`eco_user_id`).

---

## Verification Plan

### Automated & API Verification
1. **Health Check:**
   - Verify `GET /api/health` returns operational status.
2. **Device Catalog API:**
   - Verify `GET /api/devices/categories` returns all categories.
   - Verify `GET /api/devices/list?category=Smartphone` returns Apple iPhone 13, iPhone 11, etc.
3. **Credit Calculation Service:**
   - Test `calculateDeviceCredits("apple-iphone-13")` produces expected estimated credits (e.g., 112 credits) based on material formula.
4. **AI Verification & Anti-Fraud API (`POST /api/verify/claim-and-verify`):**
   - **Scenario 1 (Valid Match):** Claim `Apple iPhone 13`, upload test iPhone 13 image $\rightarrow$ AI detects `iPhone 13`, confidence $\ge 0.90$, match = true, status = `PENDING_RECYCLING`, generates `EW-2026-XXXXXX` and QR payload.
   - **Scenario 2 (Mismatch Fraud):** Claim `Apple iPhone 13`, upload iPhone 11 image $\rightarrow$ AI detects `iPhone 11`, match = false, returns mismatch error, no credits awarded.
   - **Scenario 3 (Low Confidence / Ambiguous):** AI confidence between 0.70 and 0.90 $\rightarrow$ status = `MANUAL_VERIFICATION_REQUIRED`.
5. **Facility Verification API (`POST /api/verify/facility-confirm`):**
   - Facility confirms transaction `EW-2026-XXXXXX` $\rightarrow$ Status changes `PENDING_RECYCLING` $\rightarrow$ `FACILITY_VERIFIED` $\rightarrow$ `CREDITS_ISSUED`.
   - User wallet verified & available balances increase by 112 credits.
6. **Scenario 4 (Anti-Fraud Duplicate Prevention):**
   - Attempt to verify `EW-2026-XXXXXX` a second time $\rightarrow$ Backend returns HTTP 400 rejection "Transaction already verified".
7. **Wallet Redemption API (`POST /api/wallet/redeem`):**
   - User redeems 50 credits $\rightarrow$ Redeemed becomes 50, Available becomes 62.
   - Attempt to redeem more than available credits $\rightarrow$ Backend rejects.

### Manual End-to-End Workflow Verification
- Open the application in browser.
- Navigate across all tabs: Home, Locate (verify 421 facilities and map still work perfectly), Verify & Claim, Facility Portal, Wallet, Learn.
- Complete the full recycling journey from Device Claim $\rightarrow$ Camera Scan $\rightarrow$ Estimated Credits $\rightarrow$ Facility QR verification $\rightarrow$ Wallet update & redemption.
- Toggle between Light & Dark themes to ensure flawless visual aesthetics.
