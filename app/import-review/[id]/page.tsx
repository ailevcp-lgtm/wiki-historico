import { redirect } from "next/navigation";

export default async function ImportReviewDetailPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/admin/review/${id}`);
}
