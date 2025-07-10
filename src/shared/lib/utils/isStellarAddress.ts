import { StrKey } from "@stellar/stellar-sdk";

export function isStellarAddress(address: string): boolean {
  return (
    StrKey.isValidContract(address) || StrKey.isValidEd25519PublicKey(address)
  );
}
