import AnalystDashboardPage from "@/modules/analyst/AnalystDashboardPage";
import { AnalystRoute } from "@/components/common/AnalystRoute";

export default function Page() {
  return (
    <AnalystRoute>
      <AnalystDashboardPage />
    </AnalystRoute>
  );
}
