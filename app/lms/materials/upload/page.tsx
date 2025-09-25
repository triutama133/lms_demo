import { redirect } from 'next/navigation';

export default function LegacyMaterialUploadRedirect() {
  redirect('/lms/teacher/materials/upload');
}
