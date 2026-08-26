import AnalystApiKeysPage from "@/modules/analyst/AnalystApiKeysPage";
import { AnalystRoute } from "@/components/common/AnalystRoute";

export default function Page() {
  return (
    <AnalystRoute>
      <AnalystApiKeysPage />
    </AnalystRoute>
  );
}
