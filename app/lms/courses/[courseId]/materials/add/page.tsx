import { redirect } from 'next/navigation';

export default function LegacyAddMaterialRedirect({ params }: { params: { courseId: string } }) {
  redirect(`/lms/teacher/courses/${params.courseId}/materials/add`);
}
