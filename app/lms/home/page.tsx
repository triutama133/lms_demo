import { redirect } from 'next/navigation';

export default function LegacyHomeRedirect() {
  redirect('/lms/student/home');
}
