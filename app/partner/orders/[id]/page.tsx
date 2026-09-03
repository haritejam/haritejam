import { PartnerOrderDetail } from "@/components/partner-order-detail";

export const metadata = {
  title: "Order detail | FlexiDine",
};

export default function PartnerOrderDetailPage({
  params,
}: {
  params: { id: string };
}) {
  return <PartnerOrderDetail orderId={params.id} />;
}
