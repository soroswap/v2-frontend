import Link from "next/link";

export const VaultCard = () => {
  return (
    <div className="bg-surface border-surface-alt relative overflow-hidden rounded-xl border p-6">
      {/* Background Image */}
      <div
        className="absolute inset-0 opacity-0"
        style={{
          backgroundImage: "url(/earn/vault.svg)",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
      />

      {/* Content */}
      <div className="relative z-10">
        <h2 className="text-primary mb-2 text-xl font-bold">
          Create your Vault
        </h2>
        <p className="text-secondary mb-6 text-sm">
          Take control of your finances by creating your own Vault
        </p>
        <Link
          href="https://app.defindex.io"
          className="bg-brand hover:bg-brand/90 w-full rounded-lg px-6 py-3 font-semibold text-white transition-colors"
        >
          Create Vault
        </Link>
      </div>
    </div>
  );
};
