import { redirect } from 'next/navigation';

export default async function LegacyMaterialRedirect({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  redirect(`/lms/student/materials/${id}`);
}
