"use client";

import { useState, useEffect, useCallback } from "react";
import { X, ChevronLeft, ChevronRight, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { ComplaintPhoto } from "@/types/complaint";

const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ?? "";

function cloudinaryUrl(publicId: string) {
  return `https://res.cloudinary.com/${CLOUD_NAME}/image/upload/f_auto,q_auto/${publicId}`;
}

interface LightboxProps {
  photos: ComplaintPhoto[];
  initialIndex: number;
  onClose: () => void;
}

function Lightbox({ photos, initialIndex, onClose }: LightboxProps) {
  const [index, setIndex] = useState(initialIndex);

  const prev = useCallback(() => setIndex((i) => (i - 1 + photos.length) % photos.length), [photos.length]);
  const next = useCallback(() => setIndex((i) => (i + 1) % photos.length), [photos.length]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose, prev, next]);

  // Trap scroll on body while lightbox open
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  const photo = photos[index];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90"
      role="dialog"
      aria-modal="true"
      aria-label="Photo viewer"
      onClick={onClose}
    >
      {/* Close */}
      <Button
        variant="ghost"
        size="icon"
        className="absolute right-3 top-3 text-white hover:bg-white/10"
        onClick={onClose}
        aria-label="Close photo viewer"
      >
        <X size={20} aria-hidden="true" />
      </Button>

      {/* Counter */}
      <span className="absolute left-3 top-3 text-xs text-white/70">
        {index + 1} / {photos.length}
      </span>

      {/* Prev */}
      {photos.length > 1 && (
        <Button
          variant="ghost"
          size="icon"
          className="absolute left-3 top-1/2 -translate-y-1/2 text-white hover:bg-white/10"
          onClick={(e) => { e.stopPropagation(); prev(); }}
          aria-label="Previous photo"
        >
          <ChevronLeft size={24} aria-hidden="true" />
        </Button>
      )}

      {/* Image */}
      <img
        src={cloudinaryUrl(photo.filePublicId)}
        alt={photo.isEvidence ? "Evidence photo" : "Complaint photo"}
        className="max-h-[85vh] max-w-[90vw] rounded object-contain"
        onClick={(e) => e.stopPropagation()}
        draggable={false}
      />

      {/* Next */}
      {photos.length > 1 && (
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-3 top-1/2 -translate-y-1/2 text-white hover:bg-white/10"
          onClick={(e) => { e.stopPropagation(); next(); }}
          aria-label="Next photo"
        >
          <ChevronRight size={24} aria-hidden="true" />
        </Button>
      )}

      {/* Evidence badge */}
      {photo.isEvidence && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
          <Badge variant="secondary" className="gap-1 bg-blue-100 text-blue-800 border-blue-300">
            <ShieldCheck size={12} aria-hidden="true" />
            Authority evidence
          </Badge>
        </div>
      )}
    </div>
  );
}

interface Props {
  photos: ComplaintPhoto[];
}

export function PhotoGallery({ photos }: Props) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  if (photos.length === 0) return null;

  return (
    <>
      <div>
        <h2 className="text-sm font-semibold mb-2">
          Photos ({photos.length})
        </h2>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {photos.map((photo, i) => (
            <button
              key={photo.id}
              type="button"
              className="relative aspect-video rounded-md bg-muted overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              onClick={() => setLightboxIndex(i)}
              aria-label={`Open photo ${i + 1}${photo.isEvidence ? " (evidence)" : ""}`}
            >
              <img
                src={cloudinaryUrl(photo.filePublicId)}
                alt={photo.isEvidence ? "Evidence photo" : "Complaint photo"}
                className="w-full h-full object-cover transition-opacity duration-200 hover:opacity-90"
                loading="lazy"
              />
              {photo.isEvidence && (
                <span className="absolute bottom-1 right-1">
                  <Badge variant="secondary" className="gap-1 px-1.5 py-0 text-[10px] bg-blue-100 text-blue-800 border-blue-300">
                    <ShieldCheck size={9} aria-hidden="true" />
                    Evidence
                  </Badge>
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {lightboxIndex !== null && (
        <Lightbox
          photos={photos}
          initialIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
        />
      )}
    </>
  );
}
