"use client";

import { FeatureRoadmap } from "@/components/dashboard/FeatureRoadmap";

export default function EmailTemplatesPage() {
  return (
    <FeatureRoadmap
      title="Email template management"
      description="Maintain transactional emails sent by Nexora: welcome, credentials, task reminders, and deadline alerts."
      bullets={[
        "Edit HTML templates with variable placeholders",
        "Live preview rendered with sample data",
        "Test-send to your admin inbox before going live",
        "Version history and rollback (planned)",
      ]}
    />
  );
}
