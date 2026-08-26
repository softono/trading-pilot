import AnalystProfilePage from "@/modules/analyst/AnalystProfilePage";
import { AnalystRoute } from "@/components/common/AnalystRoute";

export default function Page() {
  return (
    <AnalystRoute>
      <AnalystProfilePage />
    </AnalystRoute>
  );
}
