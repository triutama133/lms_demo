"use client";
import { useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import parse from 'html-react-parser';
import { domToReact } from 'html-react-parser';
import { useParams } from 'next/navigation';
import VideoEmbed from '../../../../../../components/VideoEmbed';

export default function MaterialView() {
  const { courseId, materialId } = useParams();
  const [material, setMaterial] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [openSection, setOpenSection] = useState<number | null>(null);

  useEffect(() => {
    if (!materialId) return;
    fetch(`/api/materials/detail?material_id=${materialId}`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          let materialData = { ...data.material };
          if (typeof materialData.sections === 'string') {
            try {
              materialData.sections = JSON.parse(materialData.sections);
            } catch (e) {
              materialData.sections = [];
            }
          }
          setMaterial(materialData);
        } else {
          setError(data.error || 'Gagal fetch data');
        }
        setLoading(false);
      })
      .catch(() => {
        setError('Gagal fetch data');
        setLoading(false);
      });
  }, [materialId]);

  if (loading) return <div className="p-8 text-center">Loading...</div>;
  if (error) return <div className="p-8 text-center text-red-600">{error}</div>;
  if (!material) return <div className="p-8 text-center">Materi tidak ditemukan.</div>;

  let sections = material.sections;
  if (typeof sections === 'string') {
    try {
      sections = JSON.parse(sections);
    } catch (e) {
      sections = [];
    }
  }
  if (!Array.isArray(sections)) {
    sections = [];
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 flex flex-col items-center px-4 pt-24">
      <section className="max-w-2xl w-full bg-white/90 rounded-xl shadow-lg p-8 mt-8">
        <h1 className="text-2xl font-bold text-purple-700 mb-6 text-center">{material.title}</h1>
        {/* Video player jika ada video_url */}
        {material.video_url && (
          <div className="mb-6 text-center">
            {material.video_url.includes('youtube.com') || material.video_url.includes('youtu.be') ? (
              <iframe
                width="100%"
                height="360"
                src={material.video_url.replace('watch?v=', 'embed/')}
                title="Video Player"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="rounded-xl border"
              />
            ) : (
              <video controls src={material.video_url} className="w-full h-80 rounded-xl border" />
            )}
          </div>
        )}
        <div className="mb-4 text-gray-700 text-center">{material.description}</div>
        {material.type === 'pdf' ? (
          <div className="text-center">
            <a href={material.pdf_url} target="_blank" rel="noopener" className="text-blue-700 underline font-semibold">Download PDF</a>
            <iframe src={material.pdf_url} className="w-full h-96 mt-4 border rounded" />
          </div>
        ) : (
          <div className="w-full">
            {sections.length > 0 ? (
              <div className="space-y-4">
                {sections.map((section: any, idx: number) => (
                  <div key={idx} className="border rounded-xl shadow bg-white/95">
                    <button
                      className={`w-full text-left px-6 py-4 flex items-center justify-between font-bold text-lg text-purple-700 hover:bg-purple-50 rounded-xl transition-all ${openSection === idx ? 'bg-purple-100' : ''}`}
                      onClick={() => setOpenSection(openSection === idx ? null : idx)}
                      aria-expanded={openSection === idx}
                    >
                      <span>{section.title}</span>
                      <span className={`ml-2 transition-transform ${openSection === idx ? 'rotate-90' : ''}`}>▶</span>
                    </button>
                    {openSection === idx && (
                      <div className="px-6 pb-6 pt-2 prose prose-lg max-w-none text-gray-800 animate-fadein" style={{marginBottom: '0.5em'}}>
                        {section.content && /<\/?[a-z][\s\S]*>/i.test(section.content)
                          ? parse(section.content, {
                              replace: (domNode: any) => {
                                // If <p> contains a video link, split into fragment
                                if (domNode.name === 'p' && domNode.children) {
                                  const videoLinkIdx = domNode.children.findIndex(
                                    (child: any) => child.name === 'a' && child.attribs?.href && /youtu\.be|youtube\.com|vimeo\.com/.test(child.attribs.href)
                                  );
                                  if (videoLinkIdx !== -1) {
                                    const before = domNode.children.slice(0, videoLinkIdx);
                                    const videoChild = domNode.children[videoLinkIdx];
                                    const after = domNode.children.slice(videoLinkIdx + 1);
                                    return <>
                                      {before.length > 0 && <p>{domToReact(before)}</p>}
                                      <VideoEmbed url={videoChild.attribs.href} />
                                      {after.length > 0 && <p>{domToReact(after)}</p>}
                                    </>;
                                  }
                                }
                                // Render VideoEmbed jika <a> mengandung link video
                                if (domNode.name === 'a' && domNode.attribs?.href && /youtu\.be|youtube\.com|vimeo\.com/.test(domNode.attribs.href)) {
                                  return <VideoEmbed url={domNode.attribs.href} />;
                                }
                                // Jangan render <a> kosong
                                if (domNode.name === 'a' && !domNode.attribs?.href) {
                                  return null;
                                }
                                // Render <p> kosong sebagai <br /> agar baris kosong tetap muncul
                                if (domNode.name === 'p' && (!domNode.children || domNode.children.length === 0)) {
                                  return <br />;
                                }
                                return undefined;
                              }
                            })
                          : (
                            <ReactMarkdown
                              components={{
                                a: ({ href }) => {
                                  if (typeof href === 'string' && (/youtu\.be|youtube\.com|vimeo\.com/.test(href))) {
                                    return <VideoEmbed url={href} />;
                                  }
                                  return <a href={href} className="text-blue-600 underline" target="_blank" rel="noopener noreferrer">{href}</a>;
                                },
                                p: ({ children }) => {
                                  // Jika ada VideoEmbed di children, pecah <p> jadi fragment agar <div> tidak jadi child <p>
                                  const hasVideo = Array.isArray(children) && children.some(
                                    (child) => typeof child === 'object' && child?.type === VideoEmbed
                                  );
                                  if (hasVideo) {
                                    return <>{children}</>;
                                  }
                                  return <p>{children}</p>;
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
              <div className="italic text-gray-400">Tidak ada section materi.</div>
            )}
          </div>
        )}
        <div className="mt-8 text-center">
          <button
            className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold px-4 py-2 rounded shadow"
            onClick={() => window.history.back()}
          >Kembali</button>
        </div>
      </section>
    </main>
  );
}
