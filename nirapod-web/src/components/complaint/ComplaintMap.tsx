"use client";

import "leaflet/dist/leaflet.css";
import { useEffect, useRef } from "react";

interface Props {
  lat: number;
  lng: number;
  locationText?: string | null;
}

export function ComplaintMap({ lat, lng, locationText }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<import("leaflet").Map | null>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    let cancelled = false;

    import("leaflet").then((L) => {
      if (cancelled || !containerRef.current || mapRef.current) return;

      // Fix default icon paths broken by webpack
      delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });

      const map = L.map(containerRef.current!, { zoomControl: true, scrollWheelZoom: false });
      mapRef.current = map;

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap contributors",
        maxZoom: 18,
      }).addTo(map);

      map.setView([lat, lng], 15);
      const marker = L.marker([lat, lng]).addTo(map);
      if (locationText) marker.bindPopup(locationText).openPopup();
    });

    return () => {
      cancelled = true;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [lat, lng, locationText]);

  return (
    <div
      ref={containerRef}
      className="h-56 w-full rounded-md overflow-hidden border"
      role="img"
      aria-label={locationText ? `Map showing: ${locationText}` : `Map at ${lat}, ${lng}`}
    />
  );
}
