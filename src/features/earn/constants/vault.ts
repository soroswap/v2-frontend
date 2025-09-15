import { RiskLevel } from "@/features/earn/types/RiskLevel";

export const VAULT_MOCK: { vaultAddress: string; riskLevel: RiskLevel }[] = [
  {
    vaultAddress: "CDONBLOOTYZ7QN62ZLJFHK7CT3JCP3JEZDCRSG3VLGAP73QAXS7HF6HU", // XLM-BORING
    riskLevel: "low",
  },
  {
    vaultAddress: "CA2FIPJ7U6BG3N7EOZFI74XPJZOEOD4TYWXFVCIO5VDCHTVAGS6F4UKK", // USDC Soroswap Earn BLEND
    riskLevel: "low",
  },
  {
    vaultAddress: "CCKTLDG6I2MMJCKFWXXBXMA42LJ3XN2IOW6M7TK6EWNPJTS736ETFF2N", // EURC Soroswap Earn BLEND
    riskLevel: "low",
  },
  {
    vaultAddress: "CC24OISYJHWXZIFZBRJHFLVO5CNN3PQSKZE5BBBZLSSI5Z23TKC6GQY2", // CETES Soroswap Earn BLEND
    riskLevel: "low",
  },
  {
    vaultAddress: "CDI7QVDTNDFEHB25VFQGMNFALGCXXKAWUSHOTQR2D4O44CATQJ5ZQMN6", // USTRY Soroswap Earn BLEND
    riskLevel: "low",
  },
];
