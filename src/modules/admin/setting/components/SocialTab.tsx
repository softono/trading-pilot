import { useMutation } from "@tanstack/react-query";
import { showError, showSuccess } from "@/lib/message";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { httpRequest } from "@/lib/httpClient";
import { type ApiResult } from "@/types";
import { type SocialSettings } from "@/types/admin";

interface SocialTabProps {
  form: SocialSettings;
  setForm: (form: SocialSettings) => void;
  refetch: () => void;
}

export function SocialTab({ form, setForm, refetch }: SocialTabProps) {
  const socialMutation = useMutation({
    mutationFn: (data: SocialSettings) => {
      return httpRequest<ApiResult>("post", "admin/setting/save-social", data);
    },
    onSuccess: (response) =>
      response.status === 1
        ? (showSuccess(
            response.message || "Social settings saved successfully",
          ),
          refetch())
        : showError(response.message || "Failed to save social settings"),
    onError: () => showError("Failed to save social settings"),
  });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        socialMutation.mutate(form);
      }}
      className="space-y-4"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
        <div className="space-y-2">
          <Label htmlFor="google_login">Google Login</Label>
          <Select
            value={form.google_login}
            onValueChange={(value) => setForm({ ...form, google_login: value })}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select option" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">Enable</SelectItem>
              <SelectItem value="0">Disable</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="google_client_id">
            Google Client ID <span className="text-red-500">*</span>
          </Label>
          <Input
            id="google_client_id"
            value={form.google_client_id}
            onChange={(e) =>
              setForm({ ...form, google_client_id: e.target.value })
            }
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="google_client_secret">
            Google Client Secret <span className="text-red-500">*</span>
          </Label>
          <Input
            id="google_client_secret"
            value={form.google_client_secret}
            onChange={(e) =>
              setForm({
                ...form,
                google_client_secret: e.target.value,
              })
            }
            required
          />
        </div>
      </div>
      <Button type="submit" disabled={socialMutation.isPending}>
        {socialMutation.isPending ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Submitting...
          </>
        ) : (
          "Submit"
        )}
      </Button>
    </form>
  );
}
