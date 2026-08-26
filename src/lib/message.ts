import { toast } from "react-hot-toast";
export function showMessage(data: { status: number; message: string }) {
  if (data.status === 1) {
    showSuccess(data.message);
  } else {
    toast.error(data.message);
  }
}

export function showError(message: string) {
  toast.error(message);
}

export function showSuccess(message: string) {
  toast.success(message);
}

export function showInfo(message: string) {
  toast(message);
}
