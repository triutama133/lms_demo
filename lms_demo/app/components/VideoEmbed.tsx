import React from 'react';
import Image from 'next/image';

const IMAGE_REGEX = /\.(png|jpe?g|gif|webp|svg)(\?.*)?$/i;
const VIDEO_FILE_REGEX = /\.(mp4|webm|ogg)(\?.*)?$/i;
const YOUTUBE_REGEX = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]{11})/i;
const VIMEO_REGEX = /(?:https?:\/\/)?(?:www\.)?vimeo\.com\/(\d+)/i;
const GOOGLE_DRIVE_FILE_REGEX = /https?:\/\/drive\.google\.com\/file\/d\/([\w-]+)/i;
const GOOGLE_DRIVE_PREVIEW_REGEX = /https?:\/\/drive\.google\.com\/(?:uc\?|open\?id=)([\w-]+)/i;
const GOOGLE_DOCS_REGEX = /https?:\/\/docs\.google\.com\/(document|spreadsheets|presentation|forms)\/d\/([\w-]+)/i;

const defaultIframeClass = 'w-full aspect-video rounded-lg border shadow-sm';

function ensureHttps(url: string) {
  if (/^https?:\/\//i.test(url)) return url;
  return `https://${url}`;
}

function buildDrivePreview(url: string): string | null {
  const fileMatch = url.match(GOOGLE_DRIVE_FILE_REGEX);
  if (fileMatch) {
    return `https://drive.google.com/file/d/${fileMatch[1]}/preview`;
  }
  const previewMatch = url.match(GOOGLE_DRIVE_PREVIEW_REGEX);
  if (previewMatch) {
    return `https://drive.google.com/file/d/${previewMatch[1]}/preview`;
  }
  const docMatch = url.match(GOOGLE_DOCS_REGEX);
  if (docMatch) {
    const [, type, id] = docMatch;
    return `https://docs.google.com/${type}/d/${id}/preview`;
  }
  return null;
}

export function canAutoEmbed(url: string): boolean {
  const trimmed = url.trim();
  if (!trimmed) return false;
  const normalized = ensureHttps(trimmed);
  return (
    YOUTUBE_REGEX.test(normalized) ||
    VIMEO_REGEX.test(normalized) ||
    IMAGE_REGEX.test(normalized) ||
    VIDEO_FILE_REGEX.test(normalized) ||
    buildDrivePreview(normalized) !== null
  );
}

export default function VideoEmbed({ url }: { url: string }) {
  const trimmedUrl = url.trim();
  if (!trimmedUrl) {
    return null;
  }

  const normalizedUrl = ensureHttps(trimmedUrl);

  const ytMatch = normalizedUrl.match(YOUTUBE_REGEX);
  if (ytMatch) {
    return (
      <iframe
        className={defaultIframeClass}
        src={`https://www.youtube.com/embed/${ytMatch[1]}`}
        title="YouTube video player"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        loading="lazy"
      />
    );
  }

  const vimeoMatch = normalizedUrl.match(VIMEO_REGEX);
  if (vimeoMatch) {
    return (
      <iframe
        className={defaultIframeClass}
        src={`https://player.vimeo.com/video/${vimeoMatch[1]}`}
        title="Vimeo video player"
        allow="autoplay; fullscreen; picture-in-picture"
        allowFullScreen
        loading="lazy"
      />
    );
  }

  if (IMAGE_REGEX.test(normalizedUrl)) {
    return (
      <a href={normalizedUrl} target="_blank" rel="noopener noreferrer" className="block my-4">
        <div className="relative mx-auto aspect-video w-full max-w-[960px] overflow-hidden rounded-lg border shadow-sm bg-white">
          <Image
            src={normalizedUrl}
            alt="Embedded"
            fill
            className="object-contain"
            sizes="(max-width: 960px) 100vw, 960px"
            unoptimized
            priority={false}
          />
        </div>
      </a>
    );
  }

  if (VIDEO_FILE_REGEX.test(normalizedUrl)) {
    return (
      <video controls className="w-full rounded-lg shadow-sm my-4" src={normalizedUrl} preload="metadata">
        <track kind="captions" />
      </video>
    );
  }

  const drivePreview = buildDrivePreview(normalizedUrl);
  if (drivePreview) {
    return (
      <iframe
        className={defaultIframeClass}
        src={drivePreview}
        title="Google Drive preview"
        allow="autoplay"
        loading="lazy"
        allowFullScreen
      />
    );
  }

  return <a href={normalizedUrl} className="text-blue-600 underline" target="_blank" rel="noopener noreferrer">{normalizedUrl}</a>;
}
