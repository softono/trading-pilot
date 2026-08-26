import config from "@/config";

const FILE_PATH: Record<string, string> = {
  images: "assets/images/",
};

function getFilePath(type = "images"): string {
  return FILE_PATH[type] || FILE_PATH.images;
}

export function getFileUrl(file_name?: string | null, type = "images"): string {
  if (!file_name) return config.DEFAULT_IMAGE;
  if (/^https?:\/\//i.test(file_name)) return file_name;
  return config.FILESYSTEM_URL + "/" + getFilePath(type) + file_name;
}
