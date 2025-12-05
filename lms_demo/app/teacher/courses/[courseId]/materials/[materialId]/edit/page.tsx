import EditMaterialClient from "./EditMaterialClient";

export default async function EditMaterialPage({
  params,
}: {
  params: Promise<{ courseId: string; materialId: string }>;
}) {
  const { courseId, materialId } = await params;
  return <EditMaterialClient courseId={courseId} materialId={materialId} />;
}
