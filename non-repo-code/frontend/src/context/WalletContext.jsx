import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { getUserWallet } from "../services/api.js";
import { useAuth } from "./AuthContext.jsx";

const WalletContext = createContext();

export function WalletProvider({ children }) {
  const { user } = useAuth();
  const currentUserId = user?.userId || "guest-user";
  const [userId, setUserId] = useState(currentUserId);
  const [wallet, setWallet] = useState({
    userId: currentUserId,
    estimatedCredits: 0,
    verifiedCredits: 0,
    redeemedCredits: 0,
    availableCredits: 0,
    redemptions: []
  });
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);

  // Keep userId in sync with logged-in user
  useEffect(() => {
    setUserId(user?.userId || "guest-user");
  }, [user]);

  const refreshWallet = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getUserWallet(userId);
      if (data.ok) {
        if (data.wallet) setWallet(data.wallet);
        if (data.transactions) setTransactions(data.transactions);
      }
    } catch (err) {
      console.warn("Failed to sync user wallet:", err.message);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    refreshWallet();
  }, [refreshWallet]);

  return (
    <WalletContext.Provider
      value={{
        userId,
        setUserId,
        wallet,
        transactions,
        loading,
        refreshWallet,
        availableCredits: wallet.availableCredits || 0,
        estimatedCredits: wallet.estimatedCredits || 0,
        verifiedCredits: wallet.verifiedCredits || 0,
        redeemedCredits: wallet.redeemedCredits || 0,
        redemptions: wallet.redemptions || []
      }}
    >
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const context = useContext(WalletContext);
  if (!context) throw new Error("useWallet must be used within WalletProvider");
  return context;
}
export default WalletContext;
