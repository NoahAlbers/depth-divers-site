"use client";

import { useState, useRef, useCallback } from "react";

interface ChatInputProps {
  onSend: (body: string, tag: "IC" | "OOC" | null, imageUrl?: string) => void;
  disabled?: boolean;
  onInputFocus?: () => void;
  playerName?: string;
}

export function ChatInput({ onSend, disabled, onInputFocus, playerName }: ChatInputProps) {
  const [text, setText] = useState("");
  const [tag, setTag] = useState<"IC" | "OOC" | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const adjustHeight = useCallback((textarea: HTMLTextAreaElement) => {
    textarea.style.height = "auto";
    const maxHeight = 120; // ~5 lines
    textarea.style.height = `${Math.min(textarea.scrollHeight, maxHeight)}px`;
    textarea.style.overflowY = textarea.scrollHeight > maxHeight ? "auto" : "hidden";
  }, []);

  const clearImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSend = useCallback(async () => {
    if ((!text.trim() && !imageFile) || disabled || uploading) return;

    let uploadedUrl: string | undefined;

    if (imageFile && playerName) {
      setUploading(true);
      try {
        const formData = new FormData();
        formData.append("image", imageFile);
        formData.append("playerName", playerName);
        const res = await fetch("/api/messages/upload", {
          method: "POST",
          body: formData,
        });
        if (!res.ok) {
          const err = await res.json();
          alert(err.error || "Upload failed");
          setUploading(false);
          return;
        }
        const data = await res.json();
        uploadedUrl = data.url;
      } catch {
        alert("Upload failed");
        setUploading(false);
        return;
      }
      setUploading(false);
    }

    onSend(text.trim(), tag, uploadedUrl);
    setText("");
    clearImage();
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.overflowY = "hidden";
      textareaRef.current.focus();
    }
  }, [text, tag, imageFile, onSend, disabled, uploading, playerName]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert("Image must be under 5MB");
      return;
    }

    setImageFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setImagePreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const toggleTag = (newTag: "IC" | "OOC") => {
    setTag(tag === newTag ? null : newTag);
  };

  return (
    <div className="flex-shrink-0 border-t border-border bg-surface p-3" style={{ paddingBottom: "calc(12px + env(safe-area-inset-bottom, 0px))" }}>
      {/* Image preview */}
      {imagePreview && (
        <div className="relative mb-2 inline-block">
          <img
            src={imagePreview}
            alt="Preview"
            className="h-20 w-20 rounded border border-border object-cover"
          />
          <button
            onClick={clearImage}
            className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-xs text-white"
          >
            &times;
          </button>
        </div>
      )}

      <div className="flex items-center gap-2">
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => {
              setText(e.target.value);
              adjustHeight(e.target);
            }}
            onKeyDown={handleKeyDown}
            onFocus={() => {
              setTimeout(() => {
                onInputFocus?.();
                window.scrollTo(0, 0);
              }, 300);
            }}
            placeholder="Type a message..."
            disabled={disabled || uploading}
            rows={1}
            style={{ resize: "none", overflow: "hidden", minHeight: "44px" }}
            className="w-full rounded border border-gray-700 bg-background px-3 py-2 text-sm text-white placeholder-gray-500 focus:border-gold focus:outline-none disabled:opacity-50"
          />
          <div className="flex items-center gap-2">
            {/* Image upload button */}
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={disabled || uploading}
              className="rounded px-2 py-1 text-xs text-gray-400 transition-colors hover:text-gold disabled:opacity-50"
              title="Attach image"
            >
              📷
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/gif,image/webp"
              className="hidden"
              onChange={handleFileSelect}
            />

            <button
              onClick={() => toggleTag("IC")}
              className={`rounded px-2 py-1 text-xs font-bold transition-colors ${
                tag === "IC"
                  ? "bg-purple-600/30 text-purple-300 ring-1 ring-purple-500/50"
                  : "bg-surface-light text-gray-500 hover:text-gray-300"
              }`}
            >
              IC
            </button>
            <button
              onClick={() => toggleTag("OOC")}
              className={`rounded px-2 py-1 text-xs font-bold transition-colors ${
                tag === "OOC"
                  ? "bg-blue-600/30 text-blue-300 ring-1 ring-blue-500/50"
                  : "bg-surface-light text-gray-500 hover:text-gray-300"
              }`}
            >
              OOC
            </button>
            {tag && (
              <span className="text-[10px] text-gray-500">
                {tag === "IC" ? "In Character" : "Out of Character"}
              </span>
            )}
          </div>
        </div>
        <button
          onClick={handleSend}
          disabled={(!text.trim() && !imageFile) || disabled || uploading}
          className="min-h-[44px] min-w-[44px] rounded bg-gold px-4 py-2 text-sm font-bold text-background transition-colors hover:bg-[#f0d090] disabled:opacity-50"
        >
          {uploading ? "..." : "Send"}
        </button>
      </div>
    </div>
  );
}
