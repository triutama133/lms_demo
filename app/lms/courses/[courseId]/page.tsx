import { redirect } from 'next/navigation';

export default function LegacyCourseRedirect({ params }: { params: { courseId: string } }) {
  redirect(`/lms/student/courses/${params.courseId}`);
}
