// Announcement configuration for promotional dialogs
// This file allows easy enable/disable of announcements without touching component code

export interface AnnouncementTosPoint {
  title: string;
  description: string;
}

export interface AnnouncementConfig {
  id: string;
  enabled: boolean;
  title: string;
  description: string;
  ctaText: string;
  ctaUrl: string;
  tosPoints: AnnouncementTosPoint[];
  tosLinkText: string;
  tosLinkUrl: string;
}

// === RAFFLE ANNOUNCEMENT CONFIGURATION ===
// Set to false to disable the raffle announcement dialog
export const RAFFLE_ANNOUNCEMENT_ENABLED = true;

export const RAFFLE_ANNOUNCEMENT: AnnouncementConfig = {
  id: "raffle-jan-2025",
  enabled: RAFFLE_ANNOUNCEMENT_ENABLED,
  title: "Soroswap Raffle Contest",
  description:
    "Deposit USDC and win prizes every week! 3 winners selected each Friday.",
  ctaText: "Participate Now",
  ctaUrl: "https://raffle.soroswap.finance/",
  tosPoints: [
    {
      title: "Eligibility",
      description: "18+ years old, excludes Palta Labs employees",
    },
    {
      title: "Entry Period",
      description: "January 16-31, 2025",
    },
    {
      title: "How to Enter",
      description: "Minimum 50 USDC deposit for 7+ days",
    },
    {
      title: "Prizes",
      description: "100 USDC x 3 winners x 4 weeks (Fridays)",
    },
    {
      title: "Bonus Entries",
      description: "Deposit more for additional entries (up to 5,000 for 10,000 USDC)",
    },
  ],
  tosLinkText: "View Full Terms & Conditions",
  tosLinkUrl: "/tos-raffle",
};

// Helper to get active announcement
// Returns the first enabled announcement, or null if none are enabled
export const getActiveAnnouncement = (): AnnouncementConfig | null => {
  if (RAFFLE_ANNOUNCEMENT.enabled) {
    return RAFFLE_ANNOUNCEMENT;
  }
  return null;
};
