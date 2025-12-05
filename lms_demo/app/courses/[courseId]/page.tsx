import { redirect } from 'next/navigation';

export default async function LegacyCourseRedirect({ params }: { params: Promise<{ courseId: string }> }) {
  const { courseId } = await params;
  redirect(`/student/courses/${courseId}`);
}
