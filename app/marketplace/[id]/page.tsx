import { redirect } from "next/navigation";

export default async function MarketplaceDetailRedirect({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/dashboard/marketplace/${id}`);
}
