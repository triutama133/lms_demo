import React from 'react';
export default function VideoEmbed({ url }: { url: string }) {
  const ytMatch = url.match(/(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]{11})/);
  if (ytMatch) {
    return (
      <div className="my-4 flex justify-center">
        <iframe
          width="560"
          height="315"
          src={`https://www.youtube.com/embed/${ytMatch[1]}`}
          title="YouTube video player"
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
    );
  }
  const vimeoMatch = url.match(/(?:https?:\/\/)?(?:www\.)?vimeo\.com\/(\d+)/);
  if (vimeoMatch) {
    return (
      <div className="my-4 flex justify-center">
        <iframe
          src={`https://player.vimeo.com/video/${vimeoMatch[1]}`}
          width="560"
          height="315"
          frameBorder="0"
          allow="autoplay; fullscreen; picture-in-picture"
          allowFullScreen
        />
      </div>
    );
  }
  return <a href={url} className="text-blue-600 underline" target="_blank" rel="noopener noreferrer">{url}</a>;
}
