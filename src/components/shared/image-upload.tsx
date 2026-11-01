"use client";

import { ImagePlus, X } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ImageUpload({
  value,
  onChange,
  label = "Image",
}: {
  value: string | null;
  onChange: (value: string | null) => void;
  label?: string;
}) {
  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-slate-700">{label}</p>
      {value ? (
        <div className="relative overflow-hidden rounded-xl border bg-slate-50">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={value} alt="Preview" className="h-40 w-full object-cover" />
          <Button
            type="button"
            variant="secondary"
            size="icon-sm"
            className="absolute top-2 right-2"
            onClick={() => onChange(null)}
          >
            <X />
          </Button>
        </div>
      ) : (
        <label className="flex h-40 cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50 text-slate-500 transition hover:border-blue-300 hover:bg-blue-50/40">
          <ImagePlus className="mb-2 size-6" />
          <span className="text-sm font-medium">Upload image</span>
          <span className="mt-1 text-xs">Stored locally as a preview</span>
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (!file) return;
              if (file.size > 750_000) {
                event.target.value = "";
                alert("Please choose an image smaller than 750KB for this demo.");
                return;
              }
              const reader = new FileReader();
              reader.onload = () => onChange(String(reader.result));
              reader.readAsDataURL(file);
            }}
          />
        </label>
      )}
    </div>
  );
}
