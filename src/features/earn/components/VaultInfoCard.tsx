import { Info } from "lucide-react";
import { Tooltip } from "react-tooltip";

interface VaultInfoCardProps {
  title: string;
  tooltipId: string;
  tooltipText: string;
  className?: string;
  children: React.ReactNode;
}

export const VaultInfoCard = ({
  title,
  tooltipId,
  tooltipText,
  className,
  children,
}: VaultInfoCardProps) => {
  return (
    <article
      className={`bg-surface-alt border-surface-alt rounded-lg border p-4 ${className ?? ""}`}
    >
      <header className="space-y-3">
        <div className="flex items-center gap-2">
          <h3 className="text-secondary text-sm font-medium py-4">{title}</h3>
          <Info
            size={14}
            className="text-secondary"
            data-tooltip-id={tooltipId}
            aria-label={`${title} information`}
          />
          <Tooltip id={tooltipId}>
            <p className="max-w-87.5 text-sm text-white">{tooltipText}</p>
          </Tooltip>
        </div>
      </header>
      <div className="mx-4">
        {children}
      </div>
    </article>
  );
};
