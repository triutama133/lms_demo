import { redirect } from 'next/navigation';

export default function LegacyMaterialEditRedirect({ params }: { params: { courseId: string; materialId: string } }) {
  redirect(`/lms/teacher/courses/${params.courseId}/materials/${params.materialId}/edit`);
}
