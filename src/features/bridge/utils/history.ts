import { BridgeHistoryItem, BridgeHistoryStorage } from "../types/history";

export const SOROSWAP_BRIDGE_HISTORY_STORAGE_KEY = "soroswap_bridge_history";

export const saveBridgeHistory = ({
  walletAddress,
  paymentId,
  amount,
  destinationAddress,
  fromChain,
  toChain,
  type,
}: Omit<BridgeHistoryItem, "id" | "completedAt">): void => {
  try {
    const existingData = getBridgeHistory();

    // Check if payment already exists for this wallet using paymentId
    const existingWalletHistory = existingData[walletAddress] || [];
    const paymentExists = existingWalletHistory.some(
      (item) => item.paymentId === paymentId,
    );

    if (paymentExists) {
      return;
    }

    const newPayment: BridgeHistoryItem = {
      id: `${walletAddress}_${Date.now()}`,
      paymentId,
      amount,
      destinationAddress,
      fromChain,
      toChain,
      completedAt: new Date().toISOString(),
      walletAddress,
      type,
    };

    const updatedData: BridgeHistoryStorage = {
      ...existingData,
      [walletAddress]: [newPayment, ...existingWalletHistory],
    };

    localStorage.setItem(
      SOROSWAP_BRIDGE_HISTORY_STORAGE_KEY,
      JSON.stringify(updatedData),
    );
  } catch (error) {
    throw error;
  }
};

export const getBridgeHistory = (): BridgeHistoryStorage => {
  try {
    const data = localStorage.getItem(SOROSWAP_BRIDGE_HISTORY_STORAGE_KEY);
    const parsedData = data ? JSON.parse(data) : {};
    return parsedData;
  } catch {
    return {};
  }
};

export const getBridgeHistoryForWallet = (
  walletAddress: string,
): BridgeHistoryItem[] => {
  const allHistory = getBridgeHistory();
  const walletHistory = allHistory[walletAddress] || [];
  return walletHistory;
};

export const clearPaymentHistoryForWallet = (walletAddress: string): void => {
  try {
    const existingData = getBridgeHistory();
    const updatedData = { ...existingData };
    delete updatedData[walletAddress];
    localStorage.setItem(
      SOROSWAP_BRIDGE_HISTORY_STORAGE_KEY,
      JSON.stringify(updatedData),
    );
  } catch (error) {
    throw error;
  }
};

export const removeDuplicatePayments = (walletAddress: string): void => {
  try {
    const existingData = getBridgeHistory();
    const walletHistory = existingData[walletAddress] || [];

    // Remove duplicates based on paymentId, keeping the most recent one
    const uniquePayments = walletHistory.reduce((acc, current) => {
      const existingIndex = acc.findIndex(
        (item) => item.paymentId === current.paymentId,
      );
      if (existingIndex === -1) {
        acc.push(current);
      } else {
        // Keep the more recent one
        const existing = acc[existingIndex];
        if (new Date(current.completedAt) > new Date(existing.completedAt)) {
          acc[existingIndex] = current;
        }
      }
      return acc;
    }, [] as BridgeHistoryItem[]);

    if (uniquePayments.length !== walletHistory.length) {
      const updatedData = {
        ...existingData,
        [walletAddress]: uniquePayments,
      };
      localStorage.setItem(
        SOROSWAP_BRIDGE_HISTORY_STORAGE_KEY,
        JSON.stringify(updatedData),
      );
    }
  } catch (error) {
    throw error;
  }
};
