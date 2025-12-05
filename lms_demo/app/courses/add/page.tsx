import { redirect } from 'next/navigation';

export default function LegacyAddCourseRedirect() {
  redirect('/teacher/courses/add');
}
