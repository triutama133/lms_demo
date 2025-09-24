import React from 'react';
export default function VideoEmbed({ url }: { url: string }) {
  const ytMatch = url.match(/(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]{11})/);
  // Detect if inside <p> by checking for a prop (hack, since parent info not available in React)
  // Instead, always render only <iframe> if a prop 'noWrapper' is passed
  // But for html-react-parser, we can pass extra props via parser
  if (ytMatch) {
    return (
      <iframe
        width="560"
        height="315"
        src={`https://www.youtube.com/embed/${ytMatch[1]}`}
        title="YouTube video player"
        frameBorder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        style={{ display: 'block', margin: '1rem auto' }}
      />
    );
  }
  const vimeoMatch = url.match(/(?:https?:\/\/)?(?:www\.)?vimeo\.com\/(\d+)/);
  if (vimeoMatch) {
    return (
      <iframe
        src={`https://player.vimeo.com/video/${vimeoMatch[1]}`}
        width="560"
        height="315"
        frameBorder="0"
        allow="autoplay; fullscreen; picture-in-picture"
        allowFullScreen
        style={{ display: 'block', margin: '1rem auto' }}
      />
    );
  }
  return <a href={url} className="text-blue-600 underline" target="_blank" rel="noopener noreferrer">{url}</a>;
}
