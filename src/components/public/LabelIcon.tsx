"use client";

import { useState, useEffect } from "react";

export function labelSlug(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function LabelIcon({
  name,
  color,
  size = 20,
}: {
  name: string;
  color?: string | null;
  size?: number;
}) {
  const [exists, setExists] = useState<boolean | null>(null);
  const src = `/label-icons/${labelSlug(name)}.png`;

  useEffect(() => {
    const img = new window.Image();
    img.onload = () => setExists(true);
    img.onerror = () => setExists(false);
    img.src = src;
  }, [src]);

  if (!exists) return null;

  return (
    <div
      style={{
        width: `${size}px`,
        height: `${size}px`,
        flexShrink: 0,
        backgroundColor: color ?? "#64748b",
        maskImage: `url(${src})`,
        maskSize: "contain",
        maskRepeat: "no-repeat",
        maskPosition: "center",
        WebkitMaskImage: `url(${src})`,
        WebkitMaskSize: "contain",
        WebkitMaskRepeat: "no-repeat",
        WebkitMaskPosition: "center",
      }}
    />
  );
}
