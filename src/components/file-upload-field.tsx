import { useRef, useState } from "react";
import { Upload, X, FileText, ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface FileUploadFieldProps {
  id: string;
  label: string;
  /** comma-separated accept list, e.g. ".jpg,.jpeg,.png,.pdf" */
  accept: string;
  /** max size in bytes */
  maxSize?: number;
  required?: boolean;
  value: File | null;
  onChange: (file: File | null) => void;
  /**
   * When true the image preview is shown (for images). For PDFs a file chip is
   * shown instead. Defaults to auto-detect by MIME type.
   */
  previewImages?: boolean;
  helperText?: string;
  error?: string;
  className?: string;
}

function isImageFile(f: File) {
  return f.type.startsWith("image/");
}

export function FileUploadField({
  id,
  label,
  accept,
  maxSize = 5 * 1024 * 1024,
  required,
  value,
  onChange,
  previewImages = true,
  helperText,
  error,
  className,
}: FileUploadFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [localError, setLocalError] = useState("");

  function handleFile(file: File | undefined | null) {
    if (!file) return;
    const extOk = file.name.match(/\.(jpe?g|png|pdf)$/i);
    if (!extOk) {
      setLocalError("Unsupported file type. Use JPG, JPEG, PNG or PDF.");
      return;
    }
    if (file.size > maxSize) {
      setLocalError("File is too large. Maximum size is 5 MB.");
      return;
    }
    setLocalError("");
    onChange(file);
  }

  const showPreview = value && previewImages && isImageFile(value);

  return (
    <div className={cn("space-y-1.5", className)}>
      <div className="flex items-center justify-between">
        <label htmlFor={id} className="text-sm font-medium">
          {label}
          {required && <span className="text-red-600"> *</span>}
        </label>
        {value ? (
          <Button type="button" variant="ghost" size="sm" className="h-7 px-2 text-red-600" onClick={() => { onChange(null); setLocalError(""); }}>
            <X className="mr-1 h-3.5 w-3.5" /> Remove
          </Button>
        ) : (
          <Button type="button" variant="ghost" size="sm" className="h-7 px-2 text-muted-foreground" onClick={() => inputRef.current?.click()}>
            <Upload className="mr-1 h-3.5 w-3.5" /> Upload
          </Button>
        )}
      </div>

      {value ? (
        <div className="flex items-center gap-3 rounded-xl border bg-muted/30 p-3">
          {showPreview ? (
            <img src={URL.createObjectURL(value)} alt={label} className="h-16 w-16 rounded-lg border object-cover" />
          ) : (
            <div className="flex h-16 w-16 items-center justify-center rounded-lg border-border border bg-muted text-muted-foreground">
              {isImageFile(value) ? <ImageIcon className="h-6 w-6" /> : <FileText className="h-6 w-6" />}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{value.name}</p>
            <p className="text-xs text-muted-foreground">{(value.size / 1024).toFixed(1)} KB</p>
          </div>
          <Button type="button" variant="outline" size="sm" onClick={() => inputRef.current?.click()}>
            Replace
          </Button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="flex w-full flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-muted-foreground/30 py-6 text-center transition-colors hover:border-foreground/50 hover:bg-muted/30"
        >
          <Upload className="h-5 w-5 text-muted-foreground" />
          <span className="text-sm font-medium text-muted-foreground">Click to upload</span>
          <span className="text-xs text-muted-foreground/70">JPG, JPEG, PNG or PDF · max 5 MB</span>
        </button>
      )}

      <input
        ref={inputRef}
        id={id}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => {
          handleFile(e.target.files?.[0]);
          e.target.value = "";
        }}
      />

      {helperText && <p className="text-xs text-muted-foreground">{helperText}</p>}
      {(localError || error) && <p className="text-xs text-red-600 dark:text-red-300">{localError || error}</p>}
    </div>
  );
}
