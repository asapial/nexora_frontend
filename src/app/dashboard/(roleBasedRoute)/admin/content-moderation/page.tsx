"use client";

import { FeatureRoadmap } from "@/components/dashboard/FeatureRoadmap";

export default function ContentModerationPage() {
  return (
    <FeatureRoadmap
      title="Content moderation"
      description="Review user-reported comments, resources, and announcements. Take action while preserving an audit trail."
      bullets={[
        "Queue of flagged items with context and reporter",
        "Remove content, issue warnings, or suspend accounts",
        "Moderation log with actor, timestamp, and reason",
        "Appeal workflow (planned)",
      ]}
    />
  );
}
