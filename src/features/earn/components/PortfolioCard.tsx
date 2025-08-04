import { TheButton } from "@/shared/components";

export const PortfolioCard = () => {
  return (
    <div className="bg-surface border-surface-alt flex size-full flex-col justify-between gap-4 rounded-xl border p-4">
      <h2 className="text-primary text-xl font-bold">Portfolio</h2>
      <div className="flex items-center justify-between gap-2">
        <div className="flex gap-2">
          <div>
            <p className="text-secondary text-sm">Deposits</p>
            <p className="text-primary text-lg font-semibold">$0.00</p>
          </div>
          <div>
            <p className="text-secondary text-sm">Earnings</p>
            <p className="text-primary text-lg font-semibold">$0.00</p>
          </div>
          <div>
            <p className="text-secondary text-sm">Realized APY</p>
            <p className="text-primary text-lg font-semibold">$0.00</p>
          </div>
        </div>
        <div>
          <TheButton>Portfolio Dashboard</TheButton>
        </div>
      </div>
    </div>
  );
};
