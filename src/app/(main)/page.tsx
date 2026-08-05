import type { Metadata } from "next";
import SynapseXLanding from "@/components/landing/synapsex-landing";

export const metadata: Metadata = {
  title: "SynapseX | One Neural Network",
  description: "A futuristic neural-AI interface for adaptive human-machine intelligence.",
};

export default function LandingPage() {
  return <SynapseXLanding />;
}
