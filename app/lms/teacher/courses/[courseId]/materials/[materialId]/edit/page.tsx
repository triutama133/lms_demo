import EditMaterialClient from "./EditMaterialClient";

export default function EditMaterialPage({
  params,
}: {
  params: { courseId: string; materialId: string };
}) {
  const { courseId, materialId } = params;
  return <EditMaterialClient courseId={courseId} materialId={materialId} />;
}
