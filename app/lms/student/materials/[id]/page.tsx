"use client";
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import parse, { domToReact, DOMNode, Element } from 'html-react-parser';
import VideoEmbed, { canAutoEmbed } from '../../../../components/VideoEmbed';
import StudentHeader from '../../../../components/StudentHeader';

const HTTP_REGEX = /^https?:\/\//i;
const HTML_DETECTION_REGEX = /<\/?[a-z][\s\S]*>/i;
const TYPE_LABELS: Record<string, string> = {
  pdf: 'Dokumen PDF',
  markdown: 'Konten Interaktif',
  video: 'Video',
  link: 'Tautan Eksternal',
};

type Section = { title: string; content: string; order: number };
type Material = {
  id: string;
  title: string;
  description: string;
  type: string;
  pdf_url?: string;
  content?: string;
  course_id?: string | null;
  sections: Section[];
};

function normalizeExternalUrl(url: string | undefined | null) {
  if (!url) return '';
  return HTTP_REGEX.test(url) ? url : `https://${url}`;
}

function buildIframeClassName(customClass?: string) {
  return [
    'w-full',
    'min-h-[320px]',
    'rounded-2xl',
    'border',
    'border-slate-200',
    'shadow-sm',
    'my-4',
    customClass ?? '',
  ]
    .filter(Boolean)
    .join(' ');
}

type RichContentRenderer = (raw: string) => React.ReactNode;

type HtmlReplacementFn = (domNode: DOMNode, index?: number) => string | boolean | void | object | Element | null;

function createHtmlReplacement(
  renderIframeNode: (node: Element) => React.ReactNode | null,
): HtmlReplacementFn {
  function replacement(domNode: DOMNode, index?: number): string | boolean | void | object | Element | null {
    if (domNode.type !== 'tag') {
      return undefined;
    }
    if (domNode.name === 'iframe') {
      const iframeNode = renderIframeNode(domNode as Element);
      return {
        type: 'div',
        props: { children: iframeNode },
      };
    }
    if (domNode.name === 'a' && domNode.attribs?.href) {
      const href = domNode.attribs.href;
      if (canAutoEmbed(href)) {
        return VideoEmbed({ url: href });
      }
      const safeHref = normalizeExternalUrl(href);
      return {
        type: 'a',
        props: {
          href: safeHref,
          className: 'text-blue-600 underline',
          target: '_blank',
          rel: 'noopener noreferrer',
          children: domToReact(domNode.children as DOMNode[], { replace: replacement }),
        },
      };
    }
    if (domNode.name === 'p') {
      const children = domNode.children ?? [];
      const hasNoVisibleChildren =
        children.length === 0 ||
        children.every((child) =>
          typeof child === 'object' && 'type' in child && child.type === 'text'
            ? !child.data || child.data.trim() === ''
            : false,
        );
      if (hasNoVisibleChildren) {
        return {
          type: 'div',
          props: { className: 'h-4' },
        };
      }
      if (children.length === 1 && children[0].type === 'tag') {
        const childEl = children[0] as Element;
        if (childEl.name === 'a' && childEl.attribs?.href && canAutoEmbed(childEl.attribs.href)) {
          return VideoEmbed({ url: childEl.attribs.href });
        }
        if (childEl.name === 'iframe') {
          const iframeNode = renderIframeNode(childEl);
          return {
            type: 'div',
            props: { children: iframeNode },
          };
        }
      }
      return {
        type: 'div',
        props: {
          className: 'mb-4 whitespace-pre-line',
          children: domToReact(children as DOMNode[], { replace: replacement }),
        },
      };
    }
    return undefined;
  }

  return replacement;
}

export default function MaterialDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [material, setMaterial] = useState<Material | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [progressUpdated, setProgressUpdated] = useState(false);
  const [sections, setSections] = useState<Section[]>([]);
  const [expandedIndex, setExpandedIndex] = useState<number>(-1);
  const sectionRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    fetch(`/api/materials/detail?material_id=${id}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          const materialData: Material = {
            ...data.material,
            sections: Array.isArray(data.material.sections) ? data.material.sections : [],
          };
          setMaterial(materialData);
          setSections(materialData.sections);
          try {
            localStorage.setItem('lms_last_material', JSON.stringify({
              materialId: materialData.id,
              materialTitle: materialData.title,
              courseId: materialData.course_id ?? null,
            }));
          } catch (storageError) {
            console.error('Failed to persist last material reference', storageError);
          }
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

  useEffect(() => {
    if (sections.length > 0) {
      setExpandedIndex(0);
    } else {
      setExpandedIndex(-1);
    }
  }, [sections]);

  const renderIframeNode = (node: Element) => {
    const src = node.attribs?.src ? normalizeExternalUrl(node.attribs.src.trim()) : '';
    if (!src) return null;
    const allow = node.attribs?.allow;
    const title = node.attribs?.title || 'Embedded content';
    const loadingAttr = node.attribs?.loading === 'eager' ? 'eager' : 'lazy';
    const allowFullScreen =
      typeof node.attribs?.allowfullscreen !== 'undefined' ||
      typeof node.attribs?.allowFullScreen !== 'undefined';
    return (
      <iframe
        src={src}
        className={buildIframeClassName(node.attribs?.class)}
        title={title}
        allow={allow}
        loading={loadingAttr}
        allowFullScreen={allowFullScreen}
      />
    );
  };

  const renderRichContent: RichContentRenderer = (raw) => {
    if (!raw) {
      return <p className="text-sm text-slate-500">Konten belum tersedia.</p>;
    }
    if (HTML_DETECTION_REGEX.test(raw)) {
      return parse(raw, {
        replace: createHtmlReplacement(renderIframeNode),
      });
    }
    return (
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          a: ({ href, children }) => {
            if (typeof href === 'string' && canAutoEmbed(href)) {
              return <VideoEmbed url={href} />;
            }
            const safeHref = normalizeExternalUrl(typeof href === 'string' ? href : '');
            return (
              <a
                href={safeHref}
                className="text-blue-600 underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                {children}
              </a>
            );
          },
        }}
      >
        {raw}
      </ReactMarkdown>
    );
  };

  const handleScrollToSection = (index: number) => {
    setExpandedIndex(index);
    const target = sectionRefs.current[index];
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const typeLabel = useMemo(() => {
    if (!material) return '';
    return TYPE_LABELS[material.type] || 'Materi Pembelajaran';
  }, [material]);

  if (loading) {
    return (
      <>
        <StudentHeader />
        <div className="min-h-screen flex items-center justify-center">Loading...</div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <StudentHeader />
        <div className="min-h-screen flex items-center justify-center text-red-600">{error}</div>
      </>
    );
  }

  if (!material) {
    return (
      <>
        <StudentHeader />
        <div className="min-h-screen flex items-center justify-center">Materi tidak ditemukan.</div>
      </>
    );
  }

  return (
    <>
      <StudentHeader />
      <main className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 px-4 pb-20">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 pt-28">
          <nav className="flex flex-wrap items-center gap-3 text-xs font-semibold text-slate-500">
            <button
              type="button"
              onClick={() => router.back()}
              className="inline-flex items-center gap-1 rounded-full border border-blue-100 bg-white/70 px-3 py-1 text-blue-700 transition hover:bg-white"
            >
              ← Kembali
            </button>
            <span>/</span>
            <Link href="/lms/student/courses" className="hover:text-blue-700">
              Daftar Course
            </Link>
            <span>/</span>
            <span className="text-blue-800">{material.title}</span>
          </nav>

          <div className="grid gap-8 lg:grid-cols-[2fr,1fr]">
            <article className="space-y-6">
              <section className="rounded-3xl border border-white/80 bg-white/90 p-8 shadow-xl">
                <span className="inline-flex items-center gap-2 rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">
                  <span className="h-2 w-2 rounded-full bg-blue-500" />
                  {typeLabel}
                </span>
                <h1 className="mt-4 text-3xl font-bold text-blue-900 md:text-4xl">{material.title}</h1>
                <p className="mt-3 text-sm text-slate-600 md:text-base">{material.description}</p>
                {/* Removed bagian materi, perkiraan, dan status as requested */}
              </section>

              {material.type === 'pdf' && material.pdf_url ? (
                <section className="rounded-3xl border border-white/80 bg-white/95 p-6 shadow-md">
                  <div className="flex items-center justify-between gap-4 flex-wrap">
                    <div>
                      <h2 className="text-lg font-semibold text-blue-800">Pratinjau Dokumen</h2>
                      <p className="text-sm text-slate-500">Tekan tombol di bawah untuk membuka dokumen penuh layar atau baca langsung dari pratinjau.</p>
                    </div>
                    <a
                      href={normalizeExternalUrl(material.pdf_url)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 px-4 py-2 text-sm font-semibold text-white shadow transition hover:from-blue-700 hover:to-purple-700"
                    >
                      Buka di Tab Baru
                    </a>
                  </div>
                  <iframe
                    src={normalizeExternalUrl(material.pdf_url)}
                    title="Pratinjau PDF"
                    className="mt-6 h-[520px] w-full rounded-2xl border border-slate-200 shadow-lg"
                  />
                </section>
              ) : null}

              {sections.length > 0 ? (
                <section className="space-y-4">
                  {sections.map((section, index) => (
                    <div
                      key={section.order ?? `${section.title}-${index}`}
                      ref={(el) => {
                        sectionRefs.current[index] = el;
                      }}
                      className="rounded-3xl border border-slate-100 bg-white/95 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
                    >
                      <button
                        type="button"
                        className={`w-full rounded-3xl px-6 py-5 text-left transition ${
                          expandedIndex === index ? 'bg-blue-50' : 'bg-white'
                        }`}
                        onClick={() => setExpandedIndex((prev) => (prev === index ? -1 : index))}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-center gap-4">
                            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-base font-semibold text-blue-700 shadow">
                              {index + 1}
                            </span>
                            <div>
                              <h2 className="text-lg font-semibold text-blue-900">{section.title}</h2>
                              <p className="text-xs text-slate-500">Bagian ke-{index + 1} dari {sections.length}</p>
                            </div>
                          </div>
                          <span className={`mt-1 text-xl text-blue-500 transition-transform ${expandedIndex === index ? 'rotate-90' : ''}`}>
                            ▶
                          </span>
                        </div>
                      </button>
                      {expandedIndex === index && (
                        <div className="px-6 pb-6 text-slate-700">
                          {renderRichContent(section.content)}
                        </div>
                      )}
                    </div>
                  ))}
                </section>
              ) : (
                <section className="rounded-3xl border border-white/80 bg-white/95 p-6 shadow-md">
                  <h2 className="text-lg font-semibold text-blue-800">Konten Materi</h2>
                  <div className="mt-4 text-slate-700">{renderRichContent(material.content || '')}</div>
                </section>
              )}

              <div className="flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-white/80 bg-white/90 p-6 shadow-md">
                <div>
                  <h3 className="text-sm font-semibold text-blue-800">Selesai belajar?</h3>
                  <p className="text-xs text-slate-500">Akses course lain atau review materi sebelumnya untuk memperkuat pemahamanmu.</p>
                </div>
                <div className="flex flex-wrap gap-3">
                  <Link
                    href="/lms/student/courses"
                    className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-100"
                  >
                    ← Kembali ke Courses
                  </Link>
                  <button
                    type="button"
                    onClick={() => router.back()}
                    className="rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 px-4 py-2 text-xs font-semibold text-white shadow transition hover:from-purple-700 hover:to-blue-700"
                  >
                    Tutup Materi
                  </button>
                </div>
              </div>
            </article>

            <aside className="flex flex-col gap-6">
              <div className="rounded-3xl border border-white/80 bg-white/95 p-6 shadow-md">
                <h2 className="text-sm font-semibold text-blue-800">Ringkasan Materi</h2>
                <ul className="mt-4 space-y-3 text-xs text-slate-500">
                  <li className="flex items-center gap-2">
                    <span className="inline-flex h-2 w-2 rounded-full bg-blue-500" /> Jenis materi: {typeLabel}
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="inline-flex h-2 w-2 rounded-full bg-blue-500" /> Total bagian: {sections.length || 1}
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="inline-flex h-2 w-2 rounded-full bg-blue-500" /> Progress tercatat otomatis
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="inline-flex h-2 w-2 rounded-full bg-blue-500" /> Update terakhir: {new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })}
                  </li>
                </ul>
              </div>

              {sections.length > 0 && (
                <div className="rounded-3xl border border-white/80 bg-white/95 p-6 shadow-md">
                  <h3 className="text-sm font-semibold text-blue-800">Navigasi Cepat</h3>
                  <p className="mt-1 text-xs text-slate-500">Pilih bagian untuk melompat langsung ke konten yang diinginkan.</p>
                  <ul className="mt-4 space-y-2">
                    {sections.map((section, index) => (
                      <li key={`nav-${section.order ?? index}`}>
                        <button
                          type="button"
                          onClick={() => handleScrollToSection(index)}
                          className={`w-full rounded-2xl border px-4 py-3 text-left text-sm font-medium transition ${
                            expandedIndex === index
                              ? 'border-blue-500 bg-blue-600 text-white shadow'
                              : 'border-transparent bg-white/80 text-slate-600 hover:border-blue-200 hover:bg-blue-50'
                          }`}
                        >
                          <span className="block text-xs uppercase tracking-wider text-blue-300">Bagian {index + 1}</span>
                          {section.title}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

            </aside>
          </div>
        </div>
      </main>
    </>
  );
}
