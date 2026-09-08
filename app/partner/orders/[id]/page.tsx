import { PartnerOrderDetail } from "@/components/partner-order-detail";

export const metadata = {
  title: "Order detail | FlexiDine",
};

export default async function PartnerOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <PartnerOrderDetail orderId={id} />;
}
