"use client";

import { FeatureRoadmap } from "@/components/dashboard/FeatureRoadmap";

export default function CertificatesPage() {
  return (
    <FeatureRoadmap
      title="Certificate generation"
      description="Automatically issue verifiable PDF certificates when learners complete courses. Customize branding to match your institution."
      bullets={[
        "PDF generation on course completion events",
        "Template editor: logo, colors, signature line",
        "Unique verification URL per certificate",
        "Bulk re-issue and revocation tools (planned)",
      ]}
    />
  );
}
