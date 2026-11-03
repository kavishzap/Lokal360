import type { Metadata } from "next";
import { MaintenanceStage } from "@/components/shared/gate-pages";

export const metadata: Metadata = {
  title: "Under maintenance",
};

export default function MaintenancePage() {
  return <MaintenanceStage />;
}
