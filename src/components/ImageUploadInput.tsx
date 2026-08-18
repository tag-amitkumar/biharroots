"use client";

import { useRef, useState } from "react";
import { toast } from "sonner";
import { Loader2, Upload } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import SafeImage from "@/components/SafeImage";

// Wraps the existing Cloudinary-backed /api/upload route (previously wired
// up but never actually called from any UI) behind a reusable file-picker +
// preview. The underlying value is still just a plain image URL string, so
// it drops into any form the same way a manual URL <Input> would.
export default function ImageUploadInput({
  id,
  label,
  value,
  onChange,
  kind = "product",
}: {
  id: string;
  label: string;
  value: string;
  onChange: (url: string) => void;
  kind?: "product" | "category";
}) {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();

    reader.onload = async () => {
      setUploading(true);

      try {
        const res = await fetch("/api/upload", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ image: reader.result }),
        });

        const data = await res.json();

        if (data.success) {
          onChange(data.url);
          toast.success("Image uploaded");
        } else {
          toast.error("Upload failed. Please try again.");
        }
      } catch {
        toast.error("Upload failed. Please try again.");
      } finally {
        setUploading(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    };

    reader.readAsDataURL(file);
  }

  return (
    <div>
      <Label htmlFor={id}>{label}</Label>

      <div className="mt-1.5 flex items-center gap-3">
        {value && (
          <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl border border-neutral-200 dark:border-neutral-700">
            <SafeImage src={value} alt="" fill sizes="56px" className="object-cover" kind={kind} />
          </div>
        )}

        <Input
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Image URL, or upload a file"
          className="flex-1"
        />

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="flex shrink-0 items-center gap-2 rounded-xl border border-neutral-200 px-3 py-2 text-sm font-semibold text-neutral-700 transition-colors hover:border-brand-300 disabled:opacity-50 dark:border-neutral-700 dark:text-neutral-200"
        >
          {uploading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Upload className="h-4 w-4" />
          )}
          Upload
        </button>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />
      </div>
    </div>
  );
}
