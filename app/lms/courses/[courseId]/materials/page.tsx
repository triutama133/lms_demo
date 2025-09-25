import { redirect } from 'next/navigation';

export default function LegacyMaterialsRedirect({ params }: { params: { courseId: string } }) {
  redirect(`/lms/teacher/courses/${params.courseId}/materials`);
}
