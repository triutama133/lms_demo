import { redirect } from 'next/navigation';

export default function LegacyAddCourseRedirect() {
  redirect('/lms/teacher/courses/add');
}
