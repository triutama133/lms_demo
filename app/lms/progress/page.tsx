import { redirect } from 'next/navigation';

export default function LegacyProgressRedirect() {
  redirect('/lms/student/progress');
}
