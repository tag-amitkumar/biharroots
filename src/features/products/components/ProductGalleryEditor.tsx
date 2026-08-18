"use client";

import { useRef, useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, ArrowRight, Loader2, Plus, X } from "lucide-react";
import SafeImage from "@/components/SafeImage";

// Manages the product gallery (the `images` field) as a list of uploaded
// thumbnails with reorder/remove/replace controls, reusing the same
// Cloudinary-backed /api/upload route as ImageUploadInput (single-file
// upload, no drag-and-drop) rather than duplicating that upload logic.
export default function ProductGalleryEditor({
  images,
  onChange,
}: {
  images: string[];
  onChange: (next: string[]) => void;
}) {
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pendingSlotRef = useRef<number | null>(null);

  function openPicker(replaceIndex: number | null) {
    pendingSlotRef.current = replaceIndex;
    fileInputRef.current?.click();
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    const slot = pendingSlotRef.current;

    reader.onload = async () => {
      setUploadingIndex(slot ?? -1);

      try {
        const res = await fetch("/api/upload", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ image: reader.result }),
        });
        const data = await res.json();

        if (data.success) {
          onChange(slot === null ? [...images, data.url] : images.map((img, i) => (i === slot ? data.url : img)));
          toast.success("Image uploaded");
        } else {
          toast.error("Upload failed. Please try again.");
        }
      } catch {
        toast.error("Upload failed. Please try again.");
      } finally {
        setUploadingIndex(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    };

    reader.readAsDataURL(file);
  }

  function removeAt(index: number) {
    onChange(images.filter((_, i) => i !== index));
  }

  function moveLeft(index: number) {
    if (index === 0) return;
    const next = [...images];
    [next[index - 1], next[index]] = [next[index], next[index - 1]];
    onChange(next);
  }

  function moveRight(index: number) {
    if (index === images.length - 1) return;
    const next = [...images];
    [next[index], next[index + 1]] = [next[index + 1], next[index]];
    onChange(next);
  }

  return (
    <div>
      <label className="mb-2 block text-sm font-semibold text-neutral-700 dark:text-neutral-200">
        Gallery Images (optional)
      </label>

      <div className="flex flex-wrap gap-3">
        {images.map((url, index) => (
          <div
            key={`${url}-${index}`}
            className="group relative h-24 w-24 shrink-0 overflow-hidden rounded-2xl border border-neutral-200 dark:border-neutral-700"
          >
            <button
              type="button"
              onClick={() => openPicker(index)}
              className="absolute inset-0"
              aria-label="Replace this image"
            >
              <SafeImage src={url} alt="" fill sizes="96px" className="object-cover" kind="product" />
            </button>

            {uploadingIndex === index && (
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/40">
                <Loader2 className="h-5 w-5 animate-spin text-white" />
              </div>
            )}

            <div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-black/50 px-1 py-0.5">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  moveLeft(index);
                }}
                disabled={index === 0}
                aria-label="Move image earlier"
                className="p-0.5 text-white disabled:opacity-30"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
              </button>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  removeAt(index);
                }}
                aria-label="Remove image"
                className="p-0.5 text-white hover:text-red-300"
              >
                <X className="h-3.5 w-3.5" />
              </button>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  moveRight(index);
                }}
                disabled={index === images.length - 1}
                aria-label="Move image later"
                className="p-0.5 text-white disabled:opacity-30"
              >
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        ))}

        <button
          type="button"
          onClick={() => openPicker(null)}
          disabled={uploadingIndex === -1}
          className="flex h-24 w-24 shrink-0 flex-col items-center justify-center gap-1 rounded-2xl border border-dashed border-neutral-300 text-neutral-400 transition-colors hover:border-brand-300 hover:text-brand-600 disabled:opacity-50 dark:border-neutral-700"
        >
          {uploadingIndex === -1 ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <>
              <Plus className="h-5 w-5" />
              <span className="text-xs font-semibold">Add Image</span>
            </>
          )}
        </button>
      </div>

      <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
    </div>
  );
}
