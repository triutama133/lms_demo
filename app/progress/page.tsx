import { redirect } from 'next/navigation';

export default function LegacyProgressRedirect() {
  redirect('/student/progress');
}
