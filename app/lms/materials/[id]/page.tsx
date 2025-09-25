import { redirect } from 'next/navigation';

export default function LegacyMaterialRedirect({ params }: { params: { id: string } }) {
  redirect(`/lms/student/materials/${params.id}`);
}
