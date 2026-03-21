"use client";

import { useState, useEffect } from "react";

interface LinkPreviewData {
  title: string | null;
  description: string | null;
  imageUrl: string | null;
  domain: string;
}

interface LinkPreviewCardProps {
  url: string;
  messageAge?: number; // days since message was sent
}

export function LinkPreviewCard({ url, messageAge }: LinkPreviewCardProps) {
  const [preview, setPreview] = useState<LinkPreviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    // Don't fetch previews for messages older than 30 days
    if (messageAge && messageAge > 30) {
      setLoading(false);
      return;
    }

    fetch(`/api/link-preview?url=${encodeURIComponent(url)}`)
      .then((res) => {
        if (!res.ok) throw new Error();
        return res.json();
      })
      .then((data) => {
        if (data.title || data.description) {
          setPreview(data);
        } else {
          setError(true);
        }
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [url, messageAge]);

  if (loading) {
    return (
      <div className="mt-2 animate-pulse rounded border border-border bg-surface-light p-2">
        <div className="h-3 w-3/4 rounded bg-gray-700" />
        <div className="mt-1 h-2 w-1/2 rounded bg-gray-700" />
      </div>
    );
  }

  if (error || !preview) return null;

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="mt-2 flex gap-3 rounded border border-border bg-surface-light p-2 transition-colors hover:border-gray-600"
    >
      {preview.imageUrl && (
        <img
          src={preview.imageUrl}
          alt=""
          className="h-16 w-16 flex-shrink-0 rounded object-cover"
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = "none";
          }}
        />
      )}
      <div className="min-w-0 flex-1">
        {preview.title && (
          <p className="truncate text-xs font-bold text-gray-200">
            {preview.title}
          </p>
        )}
        {preview.description && (
          <p className="mt-0.5 line-clamp-2 text-[10px] text-gray-500">
            {preview.description.slice(0, 120)}
          </p>
        )}
        <p className="mt-0.5 text-[10px] text-gray-600">{preview.domain}</p>
      </div>
    </a>
  );
}
