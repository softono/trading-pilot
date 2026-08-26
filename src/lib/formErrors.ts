import type { UseFormSetError, FieldValues, Path } from "react-hook-form";

export function applyServerErrors<T extends FieldValues>(
  setError: UseFormSetError<T>,
  errors: Record<string, string>,
) {
  for (const [field, message] of Object.entries(errors)) {
    setError(field as Path<T>, { type: "server", message });
  }
}
