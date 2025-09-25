import { redirect } from 'next/navigation';

export default function LegacyCoursesRedirect() {
  redirect('/lms/student/courses');
}
