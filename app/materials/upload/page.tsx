import { redirect } from 'next/navigation';

export default function LegacyMaterialUploadRedirect() {
  redirect('/teacher/materials/upload');
}
