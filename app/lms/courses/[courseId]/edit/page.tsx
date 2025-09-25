import { redirect } from 'next/navigation';

export default async function LegacyCourseEditRedirect({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const { courseId } = await params;
  redirect(`/lms/teacher/courses/${courseId}/edit`);
}
