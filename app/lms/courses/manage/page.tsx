import { redirect } from 'next/navigation';

export default function LegacyManageCoursesRedirect() {
  redirect('/lms/teacher/courses/manage');
}
