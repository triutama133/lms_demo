import { redirect } from 'next/navigation';

export default async function LegacyMaterialEditRedirect({ params }: { params: Promise<{ courseId: string; materialId: string }> }) {
  const { courseId, materialId } = await params;
  redirect(`/teacher/courses/${courseId}/materials/${materialId}/edit`);
}
