/**
 * SODAX-routed assets on Stellar.
 *
 * Every entry is a classic Stellar asset wrapped as a Stellar Asset Contract
 * (SAC), issued by SODAX's Stellar issuer with 7 decimals. Swaps that touch
 * one of these contracts are quoted and executed through the SODAX solver
 * instead of the Soroswap AMM (see lib/pair.ts).
 *
 * The table was generated on 2026-09-10 from the live SODAX token list
 * (GET /swaps/tokens/stellar) cross-checked against each contract's SAC
 * `name()`, which returns "CODE:ISSUER". Run
 * `node scripts/sodax-assets-check.mjs` to re-verify it against production
 * before editing.
 *
 * This file is intentionally import-free so that script can load it directly.
 */

export type SodaxAssetCategory = "soda" | "stock" | "etf" | "crypto";

/** A classic Stellar asset wrapped as a Soroban Asset Contract. */
export interface StellarClassicAsset {
  code: string;
  issuer: string;
  contract: string;
  decimals: number;
}

export interface SodaxStellarAsset extends StellarClassicAsset {
  /** Display name from the SODAX token list. */
  name: string;
  category: SodaxAssetCategory;
  /** Bundled icon under /public, so it never depends on an external host. */
  icon: string;
}

/** Stellar account that issues every SODAX classic asset below. */
export const SODAX_STELLAR_ISSUER =
  "GDYUTHY75A7WUZJQDPOP66FB32BOYGZRXHWTWO4Q6LQTANT5X3V5HNFA";

/** Every SODAX asset on Stellar is a 7-decimal classic asset. */
export const SODAX_STELLAR_DECIMALS = 7;

type SodaxStellarAssetSeed = Omit<SodaxStellarAsset, "issuer" | "decimals">;

const SEEDS: readonly SodaxStellarAssetSeed[] = [
  {
    code: "SODA",
    name: "SODAX",
    contract: "CAH5LKJC2ZB4RVUVEVL2QWJWNJLHQE2UF767ILLQ5EQ4O3OURR2XIUGM",
    category: "soda",
    icon: "/sodalogo.png",
  },
  {
    code: "SPCX",
    name: "SpaceX Class A",
    contract: "CAI4HHAYO57QICZOZ4JF7R66RLGJRD7BGTX7H6MILCITVEYYEFRYFISK",
    category: "stock",
    icon: "/tokens/sodax/spcx.png",
  },
  {
    code: "NVDA",
    name: "NVIDIA",
    contract: "CCQFCT4FHJURUQ4RQA4NHYW5GQRHCBDXF33ADXZRTDTDVGKOJO3ZPEMY",
    category: "stock",
    icon: "/tokens/sodax/nvda.png",
  },
  {
    code: "GME",
    name: "GameStop",
    contract: "CAPSLSLCTFOZM22SUIPQENMM54T24GTDRHZ5STYAO6EYMK5GGGYVKWBX",
    category: "stock",
    icon: "/tokens/sodax/gme.png",
  },
  {
    code: "MSTR",
    name: "Strategy",
    contract: "CAFQQXZSECLJNU76OS2OKLJQJBQHYJCVAYZJ4KGEN7VHXH5BTGNLVQND",
    category: "stock",
    icon: "/tokens/sodax/mstr.png",
  },
  {
    code: "AAPL",
    name: "Apple",
    contract: "CAZSFDNSSR2RKJ2LIIB2Y4G4WOSYYKC4646EUJ63PQLDDHOVQYZ4HDTK",
    category: "stock",
    icon: "/tokens/sodax/aapl.png",
  },
  {
    code: "TSLA",
    name: "Tesla",
    contract: "CARLFQDI2S2FSYFB47AZLKGUFZVGBEUVNW77SCJHHHGL2KPGT3TN5PAB",
    category: "stock",
    icon: "/tokens/sodax/tsla.png",
  },
  {
    code: "MU",
    name: "Micron",
    contract: "CBPTKA32BTUEX4VFAER6AUFWQZCWJKQAMLV2PMFFN7EHLGLJN4JWIZ3F",
    category: "stock",
    icon: "/tokens/sodax/mu.png",
  },
  {
    code: "SNDK",
    name: "SanDisk",
    contract: "CDXNTHFMGQM33UGQBSLZI3BV5UWW62QGZLCEKOXJKMFN2W3KQZKE3LTQ",
    category: "stock",
    icon: "/tokens/sodax/sndk.png",
  },
  {
    code: "SPY",
    name: "SPDR S&P 500 ETF Trust",
    contract: "CD3ZMWOS4PZS2RQITEHBOTS27DTDP4QKOK7IEO5IB64GQKHRJYTVL3SW",
    category: "etf",
    icon: "/tokens/sodax/spy.png",
  },
  {
    code: "QQQ",
    name: "Invesco QQQ Trust",
    contract: "CC7DQX43J2KBK5MJACQWTNHENIYB5GUVCFXGDKQWDLUWA4VKLOOU5PWB",
    category: "etf",
    icon: "/tokens/sodax/qqq.png",
  },
  {
    code: "SGOV",
    name: "iShares 0-3 Month Treasury Bond ETF",
    contract: "CBQMRO2JTUJ6NXVBQ3XGJV34PDTXR34DD74TLLRCW5SV2CV2NN2VDMLH",
    category: "etf",
    icon: "/tokens/sodax/sgov.png",
  },
  {
    code: "USO",
    name: "United States Oil Fund LP",
    contract: "CCFRCTIW5EK2OK626V6C4YRTJCKACIRDI2GHOKWM57ZXACK2ZTWWWLC7",
    category: "etf",
    icon: "/tokens/sodax/uso.png",
  },
  {
    code: "SLV",
    name: "iShares Silver Trust",
    contract: "CBY3U32O5T2B555HNJLX6C6HW3O2FLRSJGH472UOOHT6H6ZMGMSSZTLW",
    category: "etf",
    icon: "/tokens/sodax/slv.png",
  },
  {
    code: "BTC",
    name: "Bitcoin",
    contract: "CBSKI7SY2AP6IIN7IBROZP2CJES67ARMHQYZWT7A7PKH67KGDK2DIRMA",
    category: "crypto",
    icon: "/tokens/sodax/btc.png",
  },
  {
    code: "ETH",
    name: "Ethereum",
    contract: "CCC6TZWLAHZT2NRVEEOZRPVLUKWVJVKZ3TM347DCCO2QBWNAA5MHROSJ",
    category: "crypto",
    icon: "/tokens/sodax/eth.png",
  },
  {
    code: "SOL",
    name: "Solana",
    contract: "CB5YRZTKA37DND672WZZXI3BQ66P4PQEJ6VQA3TDG2YLUAGADBP2VCUR",
    category: "crypto",
    icon: "/tokens/sodax/sol.png",
  },
  {
    code: "BNB",
    name: "BNB",
    contract: "CC6C3QCSK3WYM2ZENQ5MHA3QPNAKYOZFAGWH5PPU3MVDE3C2YNS7CHMF",
    category: "crypto",
    icon: "/tokens/sodax/bnb.png",
  },
  {
    code: "SUI",
    name: "Sui",
    contract: "CBAIKWGVYLCCXGW3CSIXE7JCNNVLBAA6UWMOHMEI5FO4UEXB3BZBMT2W",
    category: "crypto",
    icon: "/tokens/sodax/sui.png",
  },
  {
    code: "AVAX",
    name: "Avalanche",
    contract: "CC246EHXEDAC7ASKQ7SIFAJCBVDTV35EH4I75KM4ZELVRH5YJFRABWIW",
    category: "crypto",
    icon: "/tokens/sodax/avax.png",
  },
  {
    code: "HYPE",
    name: "Hyperliquid",
    contract: "CDOQFNKW6B3PBPTLNRQSQVAYUA7HFWGGR7TB5BC5PMZ4HU2M2XGPMGTE",
    category: "crypto",
    icon: "/tokens/sodax/hype.png",
  },
  {
    code: "NEAR",
    name: "NEAR Protocol",
    contract: "CCOJZW4X77T4DNJLV7F6DWKTHDWUS7MRFBZP6BZXT3ZYQFMYDVFVS4EK",
    category: "crypto",
    icon: "/tokens/sodax/near.png",
  },
  {
    code: "HBAR",
    name: "HBAR",
    contract: "CCFYC6XGCC6ONVVM7FIAD3Q5KAJUXUDEXLQCQUKP6LN2AKVOGKUQ3JOY",
    category: "crypto",
    icon: "/tokens/sodax/hbar.png",
  },
  {
    code: "INJ",
    name: "Injective",
    contract: "CATSVDWZE26QQLX552CMFJHO2MXDEXM7NSW32WP5FU2FFURNAFEUQSAO",
    category: "crypto",
    icon: "/tokens/sodax/inj.png",
  },
  {
    code: "POL",
    name: "Polygon",
    contract: "CBEFOLE2WVJDQ2O2S3HHV6VTUE5RU4DTLSMMRBSB4AWGJPXBWFKK2PKW",
    category: "crypto",
    icon: "/tokens/sodax/pol.png",
  },
];

/**
 * Curated allowlist of the SODAX Stellar assets Soroswap offers. Order is
 * display order in the token selector: SODA, tokenized stocks, ETFs, then
 * crypto majors. The live list has more (bnUSD, USDS, soda* wrappers); those
 * are deliberately excluded.
 */
export const SODAX_STELLAR_ASSETS: readonly SodaxStellarAsset[] = SEEDS.map(
  (seed) => ({
    ...seed,
    issuer: SODAX_STELLAR_ISSUER,
    decimals: SODAX_STELLAR_DECIMALS,
  }),
);
