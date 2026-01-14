import { Metadata } from "next";
import Link from "next/link";
import { ShieldX } from "lucide-react";

export const metadata: Metadata = {
  title: "Region Not Available | Soroswap",
  description: "This service is not available in your region.",
};

export default function BlockedPage() {
  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <article className="border-brand bg-surface flex w-full max-w-md flex-col items-center gap-6 rounded-2xl border p-6 text-center shadow-xl sm:p-8">
        <header className="flex flex-col items-center gap-4">
          <div className="bg-surface-alt flex h-16 w-16 items-center justify-center rounded-full">
            <ShieldX className="text-secondary h-8 w-8" />
          </div>
        </header>

        <section className="flex flex-col gap-2">
          <h1 className="text-primary text-2xl font-bold">Access Restricted</h1>
          <p className="text-secondary text-base">
            This service is not available in your region due to regulatory
            restrictions.
          </p>
        </section>

        <Link
          href="https://soroswap.finance"
          className="bg-brand hover:bg-brand/80 text-primary flex h-14 w-full items-center justify-center rounded-2xl p-4 text-[20px] font-bold"
        >
          Back to Home
        </Link>
      </article>
    </main>
  );
}
