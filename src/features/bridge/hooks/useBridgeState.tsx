import { UseUSDCTrustlineReturn } from "../types";

export const useBridgeState = (trustlineData: UseUSDCTrustlineReturn) => {
  const { trustlineStatus, accountStatus, hasCheckedOnce } = trustlineData;

  /**
   * Logic based on getBridgeState from DepositBridge.
   */
  const getBridgeState = () => {
    if (accountStatus.checking || trustlineStatus.checking) {
      return { type: "loading", message: "Checking account status..." };
    }

    if (!hasCheckedOnce) {
      return { type: "loading", message: "Checking account status..." };
    }

    if (!accountStatus.exists) {
      return {
        type: "account_creation_needed",
        message:
          "Your Stellar account doesn't exist yet. You need XLM to create it first.",
      };
    }

    const xlmBalance = parseFloat(accountStatus.xlmBalance);
    if (xlmBalance < 1.5) {
      return {
        type: "insufficient_xlm",
        message: `You need at least 1.5 XLM to create a USDC trustline. Current balance: ${xlmBalance.toFixed(2)} XLM`,
      };
    }

    if (!trustlineStatus.exists) {
      return {
        type: "trustline_needed",
        message: "Create a USDC trustline to start bridging",
      };
    }

    return { type: "ready", message: "Ready" };
  };

  return {
    bridgeStateType: getBridgeState().type,
    bridgeStateMessage: getBridgeState().message,
    bridgeStateData: getBridgeState(),
  };
};
