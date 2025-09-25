import { redirect } from 'next/navigation';

interface PageProps {
  params: { courseId: string };
}

export default function LegacyCourseEditRedirect(props: PageProps) {
  redirect(`/lms/teacher/courses/${props.params.courseId}/edit`);
  return null;
}
