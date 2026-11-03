import Link from "next/link";
import { MissingRobot } from "@/components/shared/missing-robot";
import { StatusScreen } from "@/components/shared/status-screen";
import { Button } from "@/components/ui/button";

export default function DashboardNotFound() {
  return (
    <StatusScreen
      embedded
      code="404"
      title="Page not found"
      description="That address is not part of this office."
      visual={<MissingRobot />}
    >
      <Button nativeButton={false} render={<Link href="/dashboard" />}>
        Back to the office
      </Button>
    </StatusScreen>
  );
}
