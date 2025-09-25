import { redirect } from 'next/navigation';

export default function LegacyCourseEditRedirect({ params }: { params: { courseId: string } }) {
  redirect(`/lms/teacher/courses/${params.courseId}/edit`);
  return null;
}
