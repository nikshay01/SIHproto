import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5001/api";

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json"
  },
  timeout: 35000
});

// Attach JWT token to requests if available
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("elocate_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => Promise.reject(error));

// System & Health
export const getHealth = async () => (await apiClient.get("/health")).data;
export const getSystemMetrics = async () => (await apiClient.get("/system/metrics")).data;
export const getSystemTopology = async () => (await apiClient.get("/system/topology")).data;
export const getCreditConfig = async () => (await apiClient.get("/credit-config")).data;

// Devices
export const getDeviceCategories = async () => (await apiClient.get("/devices/categories")).data;
export const getDeviceBrands = async (category) => (await apiClient.get("/devices/brands", { params: { category } })).data;
export const getDeviceList = async (params) => (await apiClient.get("/devices/list", { params })).data;
export const getDeviceById = async (id) => (await apiClient.get(`/devices/${id}`)).data;

// Verification & Anti-Fraud
export const claimAndVerifyDevice = async (payload) => (await apiClient.post("/verify/claim-and-verify", payload)).data;
export const evaluateManualDevice = async (payload) => (await apiClient.post("/verify/evaluate-manual", payload)).data;
export const getTransactionById = async (id) => (await apiClient.get(`/verify/transaction/${id}`)).data;
export const getUserTransactions = async (userId) => (await apiClient.get(`/verify/user/${userId}`)).data;
export const facilityConfirmTransaction = async (payload) => (await apiClient.post("/verify/facility-confirm", payload)).data;
export const facilityRejectTransaction = async (payload) => (await apiClient.post("/verify/facility-reject", payload)).data;
export const generateEwasteEducationalContent = async (itemName, category) => {
  try {
    return (await apiClient.post("/verify/educational", { itemName, category })).data;
  } catch {
    return {
      title: `${itemName || "E-Waste"} Recycling Guide`,
      category: category || "Electronics",
      summary: "Responsible recycling prevents toxic heavy metal leakage and recovers precious raw materials."
    };
  }
};

// Facilities
export const getFacilities = async (params) => (await apiClient.get("/facility/list", { params })).data;
export const getStateSummaries = async () => (await apiClient.get("/facility/states")).data;
export const getFacilityById = async (id) => (await apiClient.get(`/facility/${id}`)).data;

// Wallet & Rewards
export const getUserWallet = async (userId) => (await apiClient.get(`/wallet/${userId}`)).data;
export const redeemCredits = async (payload) => (await apiClient.post("/wallet/redeem", payload)).data;

// User Auth & Profile
export const loginUser = async (credentials) => (await apiClient.post("/auth/login", credentials)).data;
export const registerUser = async (data) => (await apiClient.post("/auth/register", data)).data;
export const getMyProfile = async () => (await apiClient.get("/auth/me")).data;
export const updateMyProfile = async (data) => (await apiClient.put("/auth/profile", data)).data;

// Pickups & Logistics
export const schedulePickup = async (payload) => (await apiClient.post("/pickup/schedule", payload)).data;
export const getPickupsList = async () => (await apiClient.get("/pickup/list")).data;

// General E-Waste AI Scanner
export const analyzeGeneralImage = async (image) => (await apiClient.post("/analyze", { image })).data;

// Audit Logs
export const getAuditLogs = async (limit = 50) => (await apiClient.get("/audit/logs", { params: { limit } })).data;

export default apiClient;
