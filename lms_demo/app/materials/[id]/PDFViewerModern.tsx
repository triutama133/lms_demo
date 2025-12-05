"use client";
import React from "react";
import "@react-pdf-viewer/core/lib/styles/index.css";
import "@react-pdf-viewer/page-navigation/lib/styles/index.css";

interface PDFViewerModernProps {
  pdfUrl: string;
  totalPages: number;
}

import { useRouter } from 'next/navigation';
const PDFViewerModern: React.FC<PDFViewerModernProps> = ({ pdfUrl }) => {
  const router = useRouter();

  // Back handler
  const handleBack = () => {
    router.back();
  };
  // Progress: hitung sebagai "completed" ketika PDF di-load
  const handlePdfLoad = () => {
    try {
      const enrollment_id = localStorage.getItem('enrollment_id');
      const material_id = localStorage.getItem('current_material_id');
      let user_id = localStorage.getItem('user_id');
      if (!user_id) {
        const userData = localStorage.getItem('lms_user');
        if (userData) {
          try {
            const userObj = JSON.parse(userData);
            user_id = userObj.id;
          } catch {}
        }
      }
      if (enrollment_id && material_id && user_id) {
        fetch('/api/progress/update', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user_id,
            enrollment_id,
            material_id,
            status: 'completed',
          }),
        });
      }
    } catch {}
  };

    // Ref for iframe
    const iframeRef = React.useRef<HTMLIFrameElement>(null);

    // Fullscreen handler
    const handleFullscreen = () => {
      const iframe = iframeRef.current;
      if (iframe) {
        if (iframe.requestFullscreen) {
          iframe.requestFullscreen();
        } else if ((iframe as unknown as { webkitRequestFullscreen?: () => void }).webkitRequestFullscreen) {
          (iframe as unknown as { webkitRequestFullscreen: () => void }).webkitRequestFullscreen();
        } else if ((iframe as unknown as { mozRequestFullScreen?: () => void }).mozRequestFullScreen) {
          (iframe as unknown as { mozRequestFullScreen: () => void }).mozRequestFullScreen();
        } else if ((iframe as unknown as { msRequestFullscreen?: () => void }).msRequestFullscreen) {
          (iframe as unknown as { msRequestFullscreen: () => void }).msRequestFullscreen();
        }
      }
    };
  return (
      <div className="flex flex-col items-center w-full">
        <div className="w-full flex justify-center items-center mb-4">
          <iframe
            ref={iframeRef}
            src={pdfUrl}
            title="PDF Viewer"
            className="w-full h-[80vh] border shadow rounded-lg"
            style={{ minHeight: '600px', maxWidth: '900px' }}
            onLoad={handlePdfLoad}
          />
        </div>
        <div className="flex gap-4 justify-center mt-4">
          <button
            onClick={handleBack}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg shadow"
          >
            Kembali
          </button>
          <button
            onClick={handleFullscreen}
            className="bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-4 rounded-lg shadow"
          >
            Full Screen
          </button>
        </div>
      </div>
  );
};

export default PDFViewerModern;