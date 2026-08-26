"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import type { ApiResult } from "@/types";
import { showError, showSuccess } from "@/lib/message";
import { Upload } from "lucide-react";

interface CropperInstance {
  destroy(): void;
  rotate(degree: number): void;
  getCroppedCanvas(options: {
    width: number;
    height: number;
  }): HTMLCanvasElement;
}

declare global {
  interface Window {
    Cropper: new (
      element: HTMLImageElement,
      options: Record<string, unknown>,
    ) => CropperInstance;
  }
}

interface AvatarUploadProps {
  /** Fully-qualified URL of the current avatar (as returned by the API). */
  image: string;
  upload: (formData: FormData) => Promise<ApiResult>;
  remove: () => Promise<ApiResult>;
  onUploaded: (image: string, file: File) => void;
  onDeleted: () => void;
}

export function AvatarUpload({
  image,
  upload,
  remove,
  onUploaded,
  onDeleted,
}: AvatarUploadProps) {
  const imgRef = useRef<HTMLImageElement | null>(null);
  const cropperRef = useRef<CropperInstance | null>(null);
  const waitForCropperRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [open, setOpen] = useState(false);
  const [fileSelected, setFileSelected] = useState(false);
  const [loading, setLoading] = useState(false);

  const clearWaitForCropper = () => {
    if (waitForCropperRef.current) {
      clearInterval(waitForCropperRef.current);
      waitForCropperRef.current = null;
    }
  };

  const handleOpenChange = (nextOpen: boolean) => {
    if (nextOpen) {
      setFileSelected(false);
      cropperRef.current?.destroy();
      cropperRef.current = null;
    }
    setOpen(nextOpen);
  };

  /* LOAD CROPPER CDN */
  useEffect(() => {
    if (!open) return;

    if (!window.Cropper) {
      const css = document.createElement("link");
      css.rel = "stylesheet";
      css.href =
        "https://cdnjs.cloudflare.com/ajax/libs/cropperjs/1.6.2/cropper.min.css";
      document.head.appendChild(css);

      const script = document.createElement("script");
      script.src =
        "https://cdnjs.cloudflare.com/ajax/libs/cropperjs/1.6.2/cropper.min.js";
      document.body.appendChild(script);
    }
  }, [open]);

  useEffect(() => clearWaitForCropper, []);

  /* FILE SELECT */
  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !imgRef.current) return;

    imgRef.current.src = URL.createObjectURL(file);

    clearWaitForCropper();
    waitForCropperRef.current = setInterval(() => {
      if (!window.Cropper) return;

      clearWaitForCropper();

      cropperRef.current?.destroy();
      cropperRef.current = new window.Cropper(imgRef.current!, {
        viewMode: 1,
        autoCropArea: 1,
      });

      setFileSelected(true);
    }, 100);
  };

  /* ROTATE */
  const rotateLeft = () => cropperRef.current?.rotate(-90);
  const rotateRight = () => cropperRef.current?.rotate(90);

  /* SAVE */
  const saveImage = async () => {
    if (!cropperRef.current) return;

    setLoading(true);
    try {
      const canvas = cropperRef.current.getCroppedCanvas({
        width: 300,
        height: 300,
      });

      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((b: Blob | null) => {
          if (!b) reject(new Error("Image processing failed"));
          else resolve(b);
        }, "image/jpeg");
      });

      const file = new File([blob], "avatar.jpg", { type: "image/jpeg" });

      const formData = new FormData();
      formData.append("image", file);
      const res = await upload(formData);

      if (res.status === 1 && res.data?.image) {
        onUploaded(res.data.image, file);
        showSuccess("Avatar updated");
        setOpen(false);
      } else {
        showError(res.message);
      }
    } catch (err: unknown) {
      showError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setLoading(false);
    }
  };

  /* DELETE */
  const deleteImage = async () => {
    if (!image) return;

    setLoading(true);
    try {
      const res = await remove();

      if (res.status === 1) {
        onDeleted();
        showSuccess("Image deleted");
        setOpen(false);
      } else {
        showError(res.message);
      }
    } catch (err: unknown) {
      showError(err instanceof Error ? err.message : "Delete failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex gap-6 p-6 border rounded bg-card w-full">
      {image ? (
        <Image
          src={image}
          width={96}
          height={96}
          className="w-24 h-24 rounded border object-cover"
          alt="Avatar"
          unoptimized
        />
      ) : (
        <div className="h-32 w-32 rounded-full border-4 border-gray-200 bg-gray-100 flex items-center justify-center text-muted-foreground">
          No Image
        </div>
      )}

      <div>
        <Dialog open={open} onOpenChange={handleOpenChange}>
          <DialogTrigger
            asChild
            className="md:hidden px-6 py-2 rounded shadow-md transition-transform active:scale-95"
          >
            <Button aria-label="Upload new photo">
              <Upload size={20} strokeWidth={2.5} />
            </Button>
          </DialogTrigger>

          <DialogTrigger asChild className="hidden md:flex w-full sm:w-auto">
            <Button>Upload new photo</Button>
          </DialogTrigger>

          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Change Avatar</DialogTitle>
              <DialogDescription>
                Upload and crop your profile image
              </DialogDescription>
            </DialogHeader>

            <input
              type="file"
              hidden
              id="avatarFile"
              accept="image/png, image/gif, image/jpeg, image/webp, image/jpg"
              onChange={onFileChange}
            />

            <Button
              variant="secondary"
              onClick={() => document.getElementById("avatarFile")?.click()}
            >
              Choose File
            </Button>

            <div className="mt-3">
              <Image
                ref={imgRef}
                src={image}
                width={300}
                height={300}
                className="mx-auto max-h-[350px]"
                alt=""
                unoptimized
              />
            </div>

            {fileSelected && (
              <div className="flex justify-center gap-3 mt-1">
                <Button variant="outline" onClick={rotateLeft}>
                  Rotate Left
                </Button>
                <Button variant="outline" onClick={rotateRight}>
                  Rotate Right
                </Button>
              </div>
            )}

            <div className="flex justify-between mt-6">
              <Button
                variant="destructive"
                disabled={!image || loading}
                onClick={deleteImage}
              >
                Delete Image
              </Button>

              <Button disabled={!fileSelected || loading} onClick={saveImage}>
                Save
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        <div className="text-sm text-muted-foreground mt-1">
          Allowed JPG, GIF or PNG.
        </div>
      </div>
    </div>
  );
}
