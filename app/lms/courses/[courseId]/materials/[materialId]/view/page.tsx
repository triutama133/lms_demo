"use client";
import React, { useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import parse, { domToReact, DOMNode } from 'html-react-parser';
import { useParams } from 'next/navigation';
import VideoEmbed from '../../../../../../components/VideoEmbed';

export default function MaterialView() {
  const { materialId } = useParams();
  type Section = { id?: string; title: string; content: string; order?: number };
  type Material = { id: string; title: string; description?: string; type: string; video_url?: string; pdf_url?: string; sections: Section[] };
  const [material, setMaterial] = useState<Material | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [openSection, setOpenSection] = useState<number | null>(null);

  useEffect(() => {
    if (!materialId) return;
    fetch(`/api/materials/detail?material_id=${materialId}`)
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
    } catch {
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
                {sections.map((section: Section, idx: number) => (
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
                              replace: (domNode: DOMNode) => {
                                if (domNode.type === 'tag' && domNode.name === 'p') {
                                  // Empty <p>
                                  if (!domNode.children || domNode.children.length === 0 || domNode.children.every((c) => typeof c === 'object' && 'type' in c && c.type === 'text' && 'data' in c && typeof c.data === 'string' && c.data.trim() === '')) {
                                    return <div style={{height: '1em'}}>&nbsp;</div>;
                                  }
                                  // <p> hanya berisi satu <a> YouTube/Vimeo
                                  if (
                                    domNode.children &&
                                    domNode.children.length === 1 &&
                                    typeof domNode.children[0] === 'object' &&
                                    'type' in domNode.children[0] && domNode.children[0].type === 'tag' &&
                                    'name' in domNode.children[0] && domNode.children[0].name === 'a' &&
                                    'attribs' in domNode.children[0] && domNode.children[0].attribs &&
                                    /youtu\.be|youtube\.com|vimeo\.com/.test(domNode.children[0].attribs.href)
                                  ) {
                                    return <VideoEmbed url={domNode.children[0].attribs.href} />;
                                  }
                                  // <p> biasa
                                  return <div style={{marginBottom: '1em', whiteSpace: 'pre-line'}}>{domToReact(domNode.children as DOMNode[])}</div>;
                                }
                                if (domNode.type === 'tag' && domNode.name === 'a' && domNode.attribs && domNode.attribs.href && /youtu\.be|youtube\.com|vimeo\.com/.test(domNode.attribs.href)) {
                                  if (domNode.parent && domNode.parent.type === 'tag' && domNode.parent.name === 'p') {
                                    return <React.Fragment>{<VideoEmbed url={domNode.attribs.href} />}</React.Fragment>;
                                  }
                                  return <VideoEmbed url={domNode.attribs.href} />;
                                }
                              }
                            })
                          : <ReactMarkdown>{section.content || ''}</ReactMarkdown>}
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
