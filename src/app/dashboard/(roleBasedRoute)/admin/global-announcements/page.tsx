"use client";

import { FeatureRoadmap } from "@/components/dashboard/FeatureRoadmap";

export default function GlobalAnnouncementsPage() {
  return (
    <FeatureRoadmap
      title="Global announcements"
      description="Publish platform-wide messages to every user or narrow the audience by role. Schedule sends for maintenance windows or launches."
      bullets={[
        "Rich-text announcement composer with preview",
        "Schedule publish time and optional expiry",
        "Target audience: all users · teachers only · students only",
        "Delivery status and read receipts (planned)",
      ]}
    />
  );
}
