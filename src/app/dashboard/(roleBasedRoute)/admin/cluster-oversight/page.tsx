"use client";

import { FeatureRoadmap } from "@/components/dashboard/FeatureRoadmap";

export default function ClusterOversightPage() {
  return (
    <FeatureRoadmap
      title="Cluster oversight"
      description="Operational view across all study clusters: health, activity levels, and session cadence."
      bullets={[
        "Health indicators: engagement, attendance, submission rates",
        "Session frequency and upcoming schedule per cluster",
        "Flag dormant clusters for teacher follow-up",
        "Archive or restore clusters with confirmation",
      ]}
    />
  );
}
