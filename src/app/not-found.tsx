import type { Metadata } from "next";
import { NotFoundStage } from "@/components/shared/gate-pages";

export const metadata: Metadata = {
  title: "Page not found",
};

export default function NotFound() {
  return <NotFoundStage />;
}
