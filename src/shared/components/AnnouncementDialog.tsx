"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ExternalLink, Gift } from "lucide-react";
import { Modal } from "@/shared/components/Modal";
import { cn } from "@/shared/lib/utils/cn";
import { AnnouncementConfig } from "@/shared/lib/constants/announcements";

interface AnnouncementDialogProps {
  announcement: AnnouncementConfig;
  defaultOpen?: boolean;
}

export const AnnouncementDialog = ({
  announcement,
  defaultOpen = true,
}: AnnouncementDialogProps) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const router = useRouter();

  const handleClose = () => {
    setIsOpen(false);
  };

  const handleCtaClick = () => {
    window.open(announcement.ctaUrl, "_blank", "noopener,noreferrer");
    setIsOpen(false);
  };

  if (!announcement.enabled) {
    return null;
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={announcement.title}
      size="lg"
      className="border-brand/50"
    >
      <div className="flex flex-col gap-5">
        {/* Icon and Description */}
        <div className="flex items-start gap-3">
          <div className="bg-brand/20 shrink-0 rounded-full p-2">
            <Gift className="text-brand size-6" />
          </div>
          <p className="text-primary text-base leading-relaxed">
            {announcement.description}
          </p>
        </div>

        {/* ToS Summary Points */}
        <div className="bg-surface rounded-xl p-4">
          <h3 className="text-primary mb-3 text-sm font-semibold uppercase tracking-wide">
            Key Terms
          </h3>
          <ul className="flex flex-col gap-2">
            {announcement.tosPoints.map((point, index) => (
              <li key={index} className="flex flex-wrap gap-1 text-sm">
                <span className="text-brand font-medium">{point.title}:</span>
                <span className="text-secondary">{point.description}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Full ToS Link */}
        <button
          onClick={() => {
            handleClose();
            router.push(announcement.tosLinkUrl);
          }}
          className="text-brand hover:text-brand/80 cursor-pointer text-sm underline underline-offset-2 transition-colors"
        >
          {announcement.tosLinkText}
        </button>

        {/* Action Buttons */}
        <div className="flex flex-col gap-3 sm:flex-row sm:gap-4">
          <button
            onClick={handleCtaClick}
            className={cn(
              "bg-brand hover:bg-brand/80 flex flex-1 items-center justify-center gap-2",
              "rounded-2xl px-6 py-3 text-lg font-bold text-white",
              "cursor-pointer transition-colors",
            )}
          >
            {announcement.ctaText}
            <ExternalLink size={18} />
          </button>
          <button
            onClick={handleClose}
            className={cn(
              "bg-surface-alt hover:bg-surface-hover text-primary flex-1",
              "cursor-pointer rounded-2xl px-6 py-3 text-lg font-medium",
              "transition-colors",
            )}
          >
            Maybe Later
          </button>
        </div>
      </div>
    </Modal>
  );
};
