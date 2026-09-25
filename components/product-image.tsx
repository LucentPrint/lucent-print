"use client";
import Image, { type ImageProps } from "next/image";
import { useState } from "react";
import { COMING_SOON_IMAGE } from "@/lib/product-images";
export function ProductImage({ src, alt, className, ...props }: ImageProps) {
  const [failedSource, setFailedSource] = useState<ImageProps["src"] | null>(null);
  const placeholder = !src || failedSource === src || src === COMING_SOON_IMAGE;
  return <Image {...props} src={placeholder ? COMING_SOON_IMAGE : src} alt={placeholder ? `${alt} — product photo coming soon` : alt} className={placeholder ? `${className?.replaceAll("object-cover", "object-contain") ?? ""} bg-black` : className} onError={() => { if (!placeholder) setFailedSource(src); }} />;
}
