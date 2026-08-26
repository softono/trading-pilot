import AnalystSettingsPage from "@/modules/analyst/AnalystSettingsPage";
import { AnalystRoute } from "@/components/common/AnalystRoute";

export default function Page() {
  return (
    <AnalystRoute>
      <AnalystSettingsPage />
    </AnalystRoute>
  );
}
