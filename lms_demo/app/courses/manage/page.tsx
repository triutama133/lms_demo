import { redirect } from 'next/navigation';

export default function LegacyManageCoursesRedirect() {
  redirect('/teacher/courses/manage');
}
