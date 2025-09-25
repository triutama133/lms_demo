"use client";

import type { FormEvent } from "react";
import { useEffect, useState } from "react";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";

const SectionEditor = dynamic<{
  value: string;
  onChange: (val: string) => void;
}>(() => import("../../../../../../../components/SectionEditor"), { ssr: false });

type Material = {
  id: string;
  title: string;
  description?: string;
  type: string;
  pdf_url?: string;
  sections?: Section[];
};

type Section = {
  id?: string;
  title: string;
  content: string;
  order?: number;
};

interface EditMaterialClientProps {
  courseId: string;
  materialId: string;
}

export default function EditMaterialClient({ courseId, materialId }: EditMaterialClientProps) {
  const router = useRouter();
  const [material, setMaterial] = useState<Material | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!materialId) {
      return;
    }
    fetch(`/api/materials/detail?material_id=${materialId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          const fetchedMaterial: Material = {
            ...data.material,
            sections: Array.isArray(data.material.sections) ? data.material.sections : [],
          };
          setMaterial(fetchedMaterial);
          setTitle(fetchedMaterial.title);
          setDescription(fetchedMaterial.description || "");
          if (Array.isArray(fetchedMaterial.sections)) {
            setSections(
              fetchedMaterial.sections.map((s: Section, idx: number) => ({
                id: s.id,
                title: s.title,
                content: s.content,
                order: s.order ?? idx + 1,
              })),
            );
          }
        } else {
          setError(data.error || "Gagal fetch data");
        }
        setLoading(false);
      })
      .catch(() => {
        setError("Gagal fetch data");
        setLoading(false);
      });
  }, [materialId]);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      let res: Response;
      if (material?.type === "pdf") {
        const formData = new FormData();
        formData.append("id", materialId);
        formData.append("title", title);
        formData.append("description", description);
        if (pdfFile) {
          formData.append("pdf", pdfFile);
        }
        res = await fetch("/api/materials", {
          method: "PUT",
          body: formData,
        });
      } else {
        res = await fetch("/api/materials", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: materialId,
            title,
            description,
            sections: sections.map((section, idx) => ({
              id: section.id,
              title: section.title,
              content: section.content,
              order: idx + 1,
            })),
          }),
        });
      }

      const responseData = await res.json();
      if (res.ok && responseData.success) {
        router.push(`/lms/teacher/courses/${courseId}/materials`);
      } else {
        setError(responseData.error || "Gagal update materi");
      }
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message || "Gagal update materi");
      } else {
        setError("Gagal update materi");
      }
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-8">
        <div className="mb-3 h-8 w-8 animate-spin rounded-full border-b-2 border-t-2 border-purple-600"></div>
        <span className="text-lg font-semibold text-purple-700">Memuat data materi...</span>
      </div>
    );
  }

  if (error) {
    return <div className="p-8 text-center text-red-600">{error}</div>;
  }

  if (!material) {
    return <div className="p-8 text-center">Materi tidak ditemukan.</div>;
  }

  return (
    <main className="flex min-h-screen flex-col items-center bg-gradient-to-br from-purple-50 via-white to-blue-50 px-4 pt-24">
      <section className="mt-8 w-full max-w-xl rounded-xl bg-white/90 p-8 shadow-lg">
        <h1 className="mb-6 text-center text-2xl font-bold text-purple-700">Edit Materi</h1>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="mb-1 block font-semibold">Judul Materi</label>
            <input
              type="text"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              required
              className="w-full rounded border px-3 py-2"
            />
          </div>
          <div>
            <label className="mb-1 block font-semibold">Deskripsi Materi</label>
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              rows={3}
              className="w-full rounded border px-3 py-2"
              placeholder="Deskripsi singkat materi"
            />
          </div>
          {material?.type === "pdf" && (
            <div>
              <label className="mb-1 block font-semibold">File PDF Saat Ini</label>
              {material.pdf_url ? (
                <a
                  href={material.pdf_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold text-blue-700 underline"
                >
                  Download PDF Lama
                </a>
              ) : (
                <span className="text-gray-500">Tidak ada file PDF</span>
              )}
              <label className="mb-1 mt-4 block font-semibold">Ganti PDF (opsional)</label>
              <input
                type="file"
                accept="application/pdf"
                onChange={(event) => setPdfFile(event.target.files?.[0] ?? null)}
                className="w-full"
              />
            </div>
          )}
          {material?.type === "markdown" && (
            <div>
              <label className="mb-1 block font-semibold">Section Materi</label>
              <div className="mb-2 flex items-center gap-2 text-sm text-gray-600">
                <span>
                  Urutkan section dengan cara drag & drop menggunakan ikon ☰ di kiri. Urutan akan disimpan saat menekan
                  "Simpan Perubahan".
                </span>
              </div>
              <DragDropContext
                onDragEnd={(result: DropResult) => {
                  if (!result.destination) {
                    return;
                  }
                  const newSections = [...sections];
                  const [removed] = newSections.splice(result.source.index, 1);
                  newSections.splice(result.destination.index, 0, removed);
                  setSections(newSections);
                }}
              >
                <Droppable droppableId="sections-droppable">
                  {(provided) => (
                    <div ref={provided.innerRef} {...provided.droppableProps}>
                      {sections.map((section, idx) => (
                        <Draggable key={section.id ?? `section-${idx}`} draggableId={section.id ?? `section-${idx}`} index={idx}>
                          {(dragProvided, dragSnapshot) => (
                            <div
                              key={section.id ?? `section-${idx}`}
                              ref={dragProvided.innerRef}
                              {...dragProvided.draggableProps}
                              {...dragProvided.dragHandleProps}
                              className={`mb-4 flex items-start gap-2 bg-white ${
                                dragSnapshot.isDragging ? "border-2 border-purple-400 shadow-lg" : ""
                              }`}
                              style={dragProvided.draggableProps.style}
                            >
                              <div className="flex cursor-grab flex-col gap-1 pt-3">
                                <span className="text-lg text-gray-400">☰</span>
                              </div>
                              <div className="flex-1 rounded border bg-gray-50 p-3">
                                <div className="mb-2 flex items-center gap-2">
                                  <input
                                    type="text"
                                    value={section.title}
                                    onChange={(event) => {
                                      const updatedSections = [...sections];
                                      updatedSections[idx].title = event.target.value;
                                      setSections(updatedSections);
                                    }}
                                    placeholder={`Judul Section ${idx + 1}`}
                                    className="w-full rounded border px-2 py-1"
                                  />
                                  <button
                                    type="button"
                                    className="px-2 font-bold text-red-600"
                                    onClick={() => setSections((current) => current.filter((_, sectionIdx) => sectionIdx !== idx))}
                                  >
                                    Hapus
                                  </button>
                                </div>
                                <SectionEditor
                                  key={section.id ?? `section-${idx}`}
                                  value={section.content}
                                  onChange={(value: string) => {
                                    const updatedSections = [...sections];
                                    updatedSections[idx].content = value;
                                    setSections(updatedSections);
                                  }}
                                />
                              </div>
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
                <button
                  type="button"
                  className="mt-2 w-fit rounded bg-blue-100 px-3 py-1 font-semibold text-blue-700 shadow hover:bg-blue-200"
                  onClick={() =>
                    setSections((current) => [
                      ...current,
                      { id: `${Date.now()}-${Math.random()}`, title: "", content: "" },
                    ])
                  }
                >
                  Tambah Section
                </button>
              </DragDropContext>
            </div>
          )}
          <div className="flex justify-end gap-2">
            <button
              type="button"
              className="rounded bg-gray-300 px-4 py-2 font-semibold text-gray-800 hover:bg-gray-400"
              onClick={() => router.back()}
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="rounded bg-purple-600 px-4 py-2 font-semibold text-white shadow transition-all hover:bg-purple-700"
            >
              Simpan Perubahan
            </button>
          </div>
          {loading && (
            <div className="mt-4 flex flex-col items-center">
              <div className="mb-2 h-6 w-6 animate-spin rounded-full border-b-2 border-t-2 border-purple-600"></div>
              <span className="font-semibold text-purple-700">Menyimpan perubahan...</span>
            </div>
          )}
        </form>
      </section>
    </main>
  );
}
