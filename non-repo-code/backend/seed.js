import mongoose from "mongoose";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import bcrypt from "bcryptjs";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const MONGODB_URI = process.env.MONGODB_URI;

console.log("=== E-CYCLE INDIA: DATABASE SEED SCRIPT ===\n");
console.log(`Connecting to: ${MONGODB_URI.replace(/\/\/.*@/, "//***@")}\n`);

async function seed() {
  try {
    const conn = await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 10000,
    });
    console.log(`✓ Connected to MongoDB: ${conn.connection.host} / ${conn.connection.name}\n`);

    // ── 1. Facilities ──
    const Facility = (await import("./models/Facility.js")).default;
    // Re-seed facilities with new acceptedEwasteTypes dataset
    await Facility.deleteMany({});
    console.log("[Facilities] Cleared existing collection for re-seed.");

    const facilitiesPath = fs.existsSync(path.join(__dirname, "data/e-waste-facilities/all_facilities_fixed.json"))
      ? path.join(__dirname, "data/e-waste-facilities/all_facilities_fixed.json")
      : path.join(__dirname, "../data/e-waste-facilities/all_facilities_fixed.json");

    if (fs.existsSync(facilitiesPath)) {
      const rawFacilities = fs.readFileSync(facilitiesPath, "utf-8");
      const facilityJson = JSON.parse(rawFacilities);
      const facilities = facilityJson.all_facilities || [];

      const formatted = facilities.map(f => ({
        facilityId: f.id,
        name: f.name,
        type: f.type,
        address: f.address,
        district: f.district,
        state: f.state,
        capacityMta: f.capacity_mta || 0,
        isAuthorized: f.is_authorized ?? true,
        authorizationStatus: f.authorization_status || "Authorized",
        authorizationBy: f.authorization_by || "SPCB / CPCB",
        regulatoryCompliance: f.regulatory_compliance || "E-Waste (Management) Rules, 2022",
        acceptedEwasteTypes: f.accepted_ewaste_types || f.acceptedEwasteTypes || [],
        acceptedCategories: f.accepted_categories || f.acceptedCategories || [],
        hazardousMaterialsHandled: f.hazardous_materials_handled || f.hazardousMaterialsHandled || [],
        specializations: f.specializations || [],
        contact: {
          phone: f.contact?.phone || "",
          tollFree: f.contact?.toll_free || "",
          email: f.contact?.email || "",
          website: f.contact?.website || "",
          contactPerson: f.contact?.contact_person || ""
        },
        location: {
          type: "Point",
          coordinates: [f.location?.longitude || 78.9629, f.location?.latitude || 20.5937],
          latitude: f.location?.latitude || 20.5937,
          longitude: f.location?.longitude || 78.9629,
          googleMapsUrl: f.location?.google_maps_url || "",
          formattedAddress: f.location?.formatted_address || f.address
        },
        status: f.status || "Active",
        shardKey: f.state
      }));

      await Facility.insertMany(formatted, { ordered: false });
      console.log(`✓ Re-seeded ${formatted.length} facilities with accepted e-waste types!\n`);
    }

    // ── 2. Device Compositions ──
    const DeviceComposition = (await import("./models/DeviceComposition.js")).default;
    const existingDevices = await DeviceComposition.countDocuments();
    console.log(`[Devices] Current count: ${existingDevices}`);
    
    if (existingDevices === 0) {
      const devicePath = fs.existsSync(path.join(__dirname, "data/device_composition.json"))
        ? path.join(__dirname, "data/device_composition.json")
        : path.join(__dirname, "../data/device_composition.json");

      if (fs.existsSync(devicePath)) {
        const rawDevices = fs.readFileSync(devicePath, "utf-8");
        const deviceJson = JSON.parse(rawDevices);
        const devices = (deviceJson.devices || []).map(d => ({
          deviceId: d.id,
          category: d.category,
          brand: d.brand,
          model: d.model,
          releaseYear: d.releaseYear,
          weightGrams: d.weightGrams,
          visualFeatures: d.visualFeatures,
          materials: d.materials,
          hazardousElements: d.hazardousElements || []
        }));

        await DeviceComposition.insertMany(devices, { ordered: false });
        console.log(`✓ Seeded ${devices.length} device compositions!\n`);
      }
    }

    // ── 3. Users Collection ──
    const User = (await import("./models/User.js")).default;
    const existingUsers = await User.countDocuments();
    console.log(`[Users] Current count: ${existingUsers}`);
    
    if (existingUsers === 0) {
      const hashedPassword = await bcrypt.hash("password123", 10);
      const hashedAdminPassword = await bcrypt.hash("admin123", 10);

      const demoUsers = [
        {
          userId: "usr_demo_priya",
          name: "Priya Sharma",
          email: "demo@elocate.in",
          password: hashedPassword,
          phone: "+91 98765 43210",
          role: "user",
          avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
          address: {
            street: "Flat 402, Green Meadows Apt, Sector 62",
            city: "Noida",
            district: "Gautam Buddha Nagar",
            state: "Uttar Pradesh",
            pincode: "201309"
          },
          ecoStats: {
            devicesRecycled: 4,
            co2SavedKg: 48.6,
            preciousMetalsSavedGrams: 14.8,
            pickupsCompleted: 2,
            eprCertificatesGenerated: 2
          },
          badges: [
            {
              id: "badge_welcome",
              name: "Eco Citizen",
              icon: "Leaf",
              description: "Joined the National E-Waste Circular Economy Network",
              tier: "Bronze"
            },
            {
              id: "badge_verified_citizen",
              name: "Verified Recycler",
              icon: "ShieldCheck",
              description: "KYC & Identity Verified for Official EPR Credit Generation",
              tier: "Silver"
            },
            {
              id: "badge_gold_saver",
              name: "Precious Metals Protector",
              icon: "Award",
              description: "Recovered over 10g of precious rare earth & conductive elements",
              tier: "Gold"
            }
          ],
          kycStatus: "verified"
        },
        {
          userId: "usr_admin_cpcb",
          name: "Dr. Rajesh Verma",
          email: "admin@elocate.in",
          password: hashedAdminPassword,
          phone: "+91 11 2230 4500",
          role: "admin",
          avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
          address: {
            street: "Parivesh Bhawan, East Arjun Nagar",
            city: "Delhi",
            district: "East Delhi",
            state: "Delhi",
            pincode: "110032"
          },
          ecoStats: {
            devicesRecycled: 120,
            co2SavedKg: 1450.0,
            preciousMetalsSavedGrams: 320.0,
            pickupsCompleted: 45,
            eprCertificatesGenerated: 120
          },
          badges: [
            {
              id: "badge_regulator",
              name: "CPCB Nodal Officer",
              icon: "ShieldCheck",
              description: "Authorized National Directory Regulatory Officer",
              tier: "Platinum"
            }
          ],
          kycStatus: "verified"
        }
      ];

      // Note: passwords are pre-hashed, so we use insertMany directly to bypass duplicate pre-save hook hashing
      await User.insertMany(demoUsers, { ordered: false });
      console.log(`✓ Seeded ${demoUsers.length} users (demo@elocate.in / password123)!\n`);
    }

    // ── 4. Wallets Collection ──
    const Wallet = (await import("./models/Wallet.js")).default;
    const existingWallets = await Wallet.countDocuments();
    console.log(`[Wallets] Current count: ${existingWallets}`);
    
    if (existingWallets === 0) {
      const defaultWallets = [
        {
          userId: "guest-user",
          estimatedCredits: 120,
          verifiedCredits: 280,
          redeemedCredits: 50,
          availableCredits: 350,
          shardKey: "National",
          redemptions: [
            {
              redemptionId: "red_eco_501",
              rewardId: "eco-voucher-50",
              rewardTitle: "GreenEarth ₹50 Store Voucher",
              creditsSpent: 50,
              couponCode: "ECOGREEN-88219",
              status: "ACTIVE",
              redeemedAt: new Date()
            }
          ]
        },
        {
          userId: "usr_demo_priya",
          estimatedCredits: 150,
          verifiedCredits: 450,
          redeemedCredits: 100,
          availableCredits: 500,
          shardKey: "Uttar Pradesh",
          redemptions: [
            {
              redemptionId: "red_eco_502",
              rewardId: "eco-voucher-100",
              rewardTitle: "Croma ₹100 E-Waste Exchange Coupon",
              creditsSpent: 100,
              couponCode: "CROMA-EW-77123",
              status: "ACTIVE",
              redeemedAt: new Date()
            }
          ]
        }
      ];

      await Wallet.insertMany(defaultWallets, { ordered: false });
      console.log(`✓ Seeded ${defaultWallets.length} wallets!\n`);
    }

    // ── 5. Verification Transactions ──
    const VerificationTransaction = (await import("./models/VerificationTransaction.js")).default;
    const existingTx = await VerificationTransaction.countDocuments();
    console.log(`[Transactions] Current count: ${existingTx}`);
    
    if (existingTx === 0) {
      const txPath = fs.existsSync(path.join(__dirname, "data/verification_transactions.json"))
        ? path.join(__dirname, "data/verification_transactions.json")
        : path.join(__dirname, "../data/verification_transactions.json");

      if (fs.existsSync(txPath)) {
        const rawTx = fs.readFileSync(txPath, "utf-8");
        const txJson = JSON.parse(rawTx);
        const txs = txJson.transactions || txJson;
        if (Array.isArray(txs) && txs.length > 0) {
          await VerificationTransaction.insertMany(txs, { ordered: false });
          console.log(`✓ Seeded ${txs.length} verification transactions!\n`);
        }
      }
    }

    // ── 6. Audit Logs ──
    const AuditLog = (await import("./models/AuditLog.js")).default;
    const existingLogs = await AuditLog.countDocuments();
    console.log(`[AuditLogs] Current count: ${existingLogs}`);
    
    if (existingLogs === 0) {
      const logPath = fs.existsSync(path.join(__dirname, "data/audit_logs.json"))
        ? path.join(__dirname, "data/audit_logs.json")
        : path.join(__dirname, "../data/audit_logs.json");

      if (fs.existsSync(logPath)) {
        const rawLogs = fs.readFileSync(logPath, "utf-8");
        const logJson = JSON.parse(rawLogs);
        const logs = logJson.logs || logJson.audit_logs || logJson;
        if (Array.isArray(logs) && logs.length > 0) {
          await AuditLog.insertMany(logs, { ordered: false });
          console.log(`✓ Seeded ${logs.length} audit logs!\n`);
        }
      }
    }

    // ── 7. Pickup Requests Collection ──
    const PickupRequest = (await import("./models/PickupRequest.js")).default;
    const existingPickups = await PickupRequest.countDocuments();
    console.log(`[PickupRequests] Current count: ${existingPickups}`);

    if (existingPickups === 0) {
      const samplePickup = [
        {
          requestId: "pck_demo_01",
          userId: "usr_demo_priya",
          facilityId: "FAC-DL-001",
          facilityName: "Attero Recycling Green Hub",
          status: "CONFIRMED",
          pickupDate: new Date(Date.now() + 86400000 * 2), // 2 days from now
          timeSlot: "10:00 AM - 01:00 PM",
          itemDetails: {
            category: "Laptop",
            model: "Dell Latitude 7490",
            quantity: 1,
            estimatedWeightKg: 1.6
          },
          contact: {
            name: "Priya Sharma",
            phone: "+91 98765 43210",
            email: "demo@elocate.in",
            address: "Flat 402, Green Meadows Apt, Sector 62, Noida"
          },
          creditsOffered: 350
        }
      ];

      await PickupRequest.insertMany(samplePickup, { ordered: false });
      console.log(`✓ Seeded ${samplePickup.length} pickup requests!\n`);
    }

    // ── Summary ──
    console.log("=== SEEDING COMPLETE ===");
    console.log("Collections in database:");
    const collections = await mongoose.connection.db.listCollections().toArray();
    for (const col of collections) {
      const count = await mongoose.connection.db.collection(col.name).countDocuments();
      console.log(`  📁 ${col.name}: ${count} documents`);
    }

    await mongoose.disconnect();
    console.log("\n✓ Disconnected. Done!");
    process.exit(0);
  } catch (err) {
    console.error("✗ Seeding failed:", err);
    process.exit(1);
  }
}

seed();
