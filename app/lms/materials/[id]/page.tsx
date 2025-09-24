
// ...existing code...
"use client";
import React, { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

// Komponen video embed
function VideoEmbed({ url }: { url: string }) {
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

// Fungsi auto-link video
// ...fungsi autoLinkVideo dihapus karena tidak digunakan...

export default function MaterialDetailPage() {
  const { id } = useParams();
  type Section = { title: string; content: string; order: number };
  type Material = { id: string; title: string; description: string; type: string; pdf_url?: string; content?: string; sections: Section[] };
  const [material, setMaterial] = useState<Material | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [progressUpdated, setProgressUpdated] = useState(false);
  const [sections, setSections] = useState<Section[]>([]);
  const [openSections, setOpenSections] = useState<boolean[]>([]);
  const router = useRouter();

  useEffect(() => {
  fetch(`/api/materials/detail?material_id=${id}`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          const materialData = { ...data.material };
          if (typeof materialData.sections === 'string') {
            try {
              materialData.sections = JSON.parse(materialData.sections);
            } catch {
              materialData.sections = [];
            }
          }
          setMaterial(materialData);
          setSections(Array.isArray(materialData.sections) ? materialData.sections : []);
          setOpenSections(Array.isArray(materialData.sections) ? materialData.sections.map((_: Section, idx: number) => idx === 0) : []);
          // Update progress
          const user_id = localStorage.getItem('user_id');
          if (user_id && !progressUpdated) {
            fetch('/api/progress/update', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                user_id,
                material_id: id,
                status: 'read',
              }),
            }).then(() => setProgressUpdated(true));
          }
        } else {
          setError(data.error || 'Gagal fetch materi');
        }
        setLoading(false);
      })
      .catch(() => {
        setError('Gagal fetch materi');
        setLoading(false);
      });
  }, [id, progressUpdated]);

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  if (error) return <div className="min-h-screen flex items-center justify-center text-red-600">{error}</div>;
  if (!material) return <div className="min-h-screen flex items-center justify-center">Materi tidak ditemukan.</div>;

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex flex-col items-center px-4 pt-24">
      <section className="max-w-2xl w-full bg-white/90 rounded-2xl shadow-lg p-8 mt-8">
        <h1 className="text-3xl font-bold text-purple-700 mb-6 text-center">{material.title}</h1>
        <div className="mb-4 text-gray-700 text-center text-lg">{material.description}</div>
        {material.type === 'pdf' ? (
          <div>
            <div className="mb-4 text-center text-sm text-gray-600">Materi PDF</div>
            <iframe src={material.pdf_url} className="w-full h-96 border rounded-lg" title="PDF Viewer" />
          </div>
        ) : (
          <div>
            {sections.length > 0 ? (
              <div className="space-y-4">
                {sections.map((section: Section, idx: number) => (
                  <div key={idx} className="rounded-2xl shadow-lg border border-purple-200 bg-white">
                    <button
                      type="button"
                      className={`w-full flex items-center justify-between px-6 py-5 focus:outline-none transition-colors ${openSections[idx] ? 'bg-purple-50' : 'bg-white'}`}
                      onClick={() => setOpenSections((prev) => prev.map((open, i) => i === idx ? !open : false))}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 flex items-center justify-center rounded-full bg-purple-100 text-purple-700 font-bold text-lg shadow">
                          {idx + 1}
                        </div>
                        <h2 className="font-bold text-xl text-purple-700">{section.title}</h2>
                      </div>
                      <span className={`ml-2 transition-transform ${openSections[idx] ? 'rotate-90' : ''}`}>▶</span>
                    </button>
                    {openSections[idx] && (
                      <div className="prose prose-lg max-w-none text-gray-800 px-6 pb-6">
                        {section.content && /<\/?[a-z][\s\S]*>/i.test(section.content)
                          ? require('html-react-parser').default(section.content, {
                              replace: (domNode: unknown, _index: number): string | boolean | void | object | React.ReactElement | null => {
                                if (typeof domNode === 'string') {
                                  const videoRegex = /^(https?:\/\/(www\.)?(youtube\.com|youtu\.be|vimeo\.com)\/[^\s<]+)$/;
                                  if (videoRegex.test(domNode.trim())) {
                                    return <VideoEmbed url={domNode.trim()} />;
                                  }
                                  return domNode;
                                }
                                if (typeof domNode !== 'object' || domNode === null) return null;
                                const node = domNode as { name?: string; children?: unknown[]; attribs?: Record<string, string> };
                                if (node.name === 'a' && node.attribs?.href && /youtu\.be|youtube\.com|vimeo\.com/.test(node.attribs.href)) {
                                  return <VideoEmbed url={node.attribs.href} />;
                                }
                                if (node.name === 'p' && (!node.children || node.children.length === 0)) {
                                  return <br />;
                                }
                                if (node.name === 'p') {
                                  if (node.children && node.children.length === 1 && typeof node.children[0] === 'object') {
                                    const childNode = node.children[0] as { name?: string; attribs?: Record<string, string> };
                                    if (childNode.name === 'a' && childNode.attribs?.href && /youtu\.be|youtube\.com|vimeo\.com/.test(childNode.attribs.href)) {
                                      return <VideoEmbed url={childNode.attribs.href} />;
                                    }
                                  }
                                  const children = Array.isArray(node.children) ? node.children : [];
                                  const processed: React.ReactNode[] = children.map((child, idx) => {
                                    if (typeof child === 'string') {
                                      const videoRegex = /^(https?:\/\/(www\.)?(youtube\.com|youtu\.be|vimeo\.com)\/[^\s<]+)$/;
                                      if (videoRegex.test(child.trim())) {
                                        return <VideoEmbed url={child.trim()} key={`video-${idx}`} />;
                                      }
                                      return <React.Fragment key={`text-${idx}`}>{child}</React.Fragment>;
                                    }
                                    if (typeof child === 'object' && child !== null) {
                                      const anchorNode = child as { name?: string; attribs?: Record<string, string> };
                                      if (anchorNode.name === 'a' && anchorNode.attribs && typeof anchorNode.attribs.href === 'string' && /youtu\.be|youtube\.com|vimeo\.com/.test(anchorNode.attribs.href)) {
                                        return <VideoEmbed url={anchorNode.attribs.href} key={`video-${idx}`} />;
                                      }
                                      // Only pass child to domToReact if it matches DOMNode structure
                                      if ('type' in child || 'name' in child) {
                                        const domToReact = require('html-react-parser').domToReact;
                                        const reactNodes = domToReact([child as import('html-react-parser').DOMNode]);
                                        if (Array.isArray(reactNodes)) {
                                          return reactNodes.map((el, elIdx) => <React.Fragment key={`node-${idx}-${elIdx}`}>{el}</React.Fragment>);
                                        }
                                        return <React.Fragment key={`node-${idx}`}>{reactNodes}</React.Fragment>;
                                      }
                                      // If not a DOMNode, skip domToReact
                                      return null;
                                    }
                                    return null;
                                  });
                                  if (Array.isArray(processed) && processed.length === 1 && React.isValidElement(processed[0]) && (processed[0] as { type?: unknown }).type === VideoEmbed) {
                                    return processed[0];
                                  }
                                  return <p>{Array.isArray(processed) ? processed : [processed]}</p>;
                                }
                                return null;
                              }
                            })
                          : (
                            <ReactMarkdown
                              remarkPlugins={[remarkGfm]}
                              components={{
                                a: ({ href }) => {
                                  if (typeof href === 'string' && (/youtu\.be|youtube\.com|vimeo\.com/.test(href))) {
                                    return <VideoEmbed url={href} />;
                                  }
                                  return <a href={href} className="text-blue-600 underline" target="_blank" rel="noopener noreferrer">{href}</a>;
                                },
                                p: ({ children }) => {
                                  const videoRegex = /(https?:\/\/(www\.)?(youtube\.com|youtu\.be|vimeo\.com)\/[\w\-\?=&#%\.\/]+)/g;
                                  const processed = Array.isArray(children)
                                    ? children.flatMap((child, idx) => {
                                        if (typeof child === 'string') {
                                          const parts = [];
                                          let lastIndex = 0;
                                          let match;
                                          while ((match = videoRegex.exec(child)) !== null) {
                                            if (match.index > lastIndex) {
                                              parts.push(child.slice(lastIndex, match.index));
                                            }
                                            parts.push(<VideoEmbed url={match[0]} key={idx + '-' + match.index} />);
                                            lastIndex = match.index + match[0].length;
                                          }
                                          if (lastIndex < child.length) {
                                            parts.push(child.slice(lastIndex));
                                          }
                                          return parts;
                                        }
                                        if (
                                          typeof child === 'object' &&
                                          child?.type === 'a' &&
                                          typeof child?.props?.href === 'string' &&
                                          /youtu\.be|youtube\.com|vimeo\.com/.test(child.props.href)
                                        ) {
                                          return <VideoEmbed url={child.props.href} key={idx} />;
                                        }
                                        if (
                                          typeof child === 'object' &&
                                          child?.type === VideoEmbed
                                        ) {
                                          return child;
                                        }
                                        return child;
                                      })
                                    : children;
                                  if (
                                    Array.isArray(processed) &&
                                    processed.length === 1 &&
                                    React.isValidElement(processed[0]) &&
                                    processed[0].type === VideoEmbed
                                  ) {
                                    return processed[0];
                                  }
                                  return <p>{processed}</p>;
                                },
                              }}
                            >{section.content || ''}</ReactMarkdown>
                          )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  a: ({ href }) => {
                    if (typeof href === 'string' && (/youtu\.be|youtube\.com|vimeo\.com/.test(href))) {
                      return <VideoEmbed url={href} />;
                    }
                    return <a href={href} className="text-blue-600 underline" target="_blank" rel="noopener noreferrer">{href}</a>;
                  },
                  p: ({ children }) => {
                    // Proses semua children: jika string, split berdasarkan link video agar urutan teks dan video player sesuai posisi aslinya
                    const videoRegex = /(https?:\/\/(www\.)?(youtube\.com|youtu\.be|vimeo\.com)\/[\w\-\?=&#%\.\/]+)/g;
                    const processed = Array.isArray(children)
                      ? children.flatMap((child, idx) => {
                          if (typeof child === 'string') {
                            // Split string berdasarkan link video
                            const parts = [];
                            let lastIndex = 0;
                            let match;
                            while ((match = videoRegex.exec(child)) !== null) {
                              if (match.index > lastIndex) {
                                parts.push(child.slice(lastIndex, match.index));
                              }
                              parts.push(<VideoEmbed url={match[0]} key={idx + '-' + match.index} />);
                              lastIndex = match.index + match[0].length;
                            }
                            if (lastIndex < child.length) {
                              parts.push(child.slice(lastIndex));
                            }
                            return parts;
                          }
                          if (
                            typeof child === 'object' &&
                            child?.type === 'a' &&
                            typeof child?.props?.href === 'string' &&
                            /youtu\.be|youtube\.com|vimeo\.com/.test(child.props.href)
                          ) {
                            return <VideoEmbed url={child.props.href} key={idx} />;
                          }
                          if (
                            typeof child === 'object' &&
                            child?.type === VideoEmbed
                          ) {
                            return child;
                          }
                          return child;
                        })
                      : children;
                    return <p>{processed}</p>;
                  },
                }}
              >{material.content || ''}</ReactMarkdown>
            )}
          </div>
        )}
        <div className="mt-8 text-center flex flex-col items-center gap-2">
          <Link href="/lms/courses" className="text-blue-600 hover:underline font-semibold">Kembali ke Courses</Link>
          <button
            type="button"
            className="mt-2 px-6 py-2 rounded-lg bg-purple-600 text-white font-semibold shadow hover:bg-purple-700 transition"
            onClick={() => router.back()}
          >
            Kembali
          </button>
        </div>
      </section>
    </main>
  );
}
