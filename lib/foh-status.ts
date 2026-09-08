import type { DispatchStatus } from "@/lib/bookings";
import type { KitchenTicketStatus } from "@/lib/kitchen";
import type { OrderStatus } from "@/lib/orders";

export type FrontOfHouseStage = "pending" | "rejected" | "accepted" | "queued" | "preparing" | "ready" | "completed";

export function stageFromTicket(status: KitchenTicketStatus | undefined): FrontOfHouseStage | null {
  if (!status) return null;
  if (status === "UPCOMING") return "accepted";
  if (status === "PREPARING") return "preparing";
  if (status === "READY") return "ready";
  if (status === "COMPLETED" || status === "DONE") return "completed";
  return "queued";
}

export function stageFromOrderStatus(status: OrderStatus, approvalStatus?: string): FrontOfHouseStage {
  if (status === "REJECTED" || approvalStatus === "REJECTED") return "rejected";
  if (status === "PENDING" || approvalStatus === "PENDING") return "pending";
  if (status === "PREPARING") return "preparing";
  if (status === "READY") return "ready";
  if (status === "SERVED" || status === "COLLECTED" || status === "DELIVERED" || status === "COMPLETED") return "completed";
  if (status === "APPROVED") return "accepted";
  if (status === "QUEUED") return "queued";
  return "queued";
}

export function fohStageChip(
  stage: FrontOfHouseStage,
  pickup: boolean | "delivery" = false,
  dispatch?: DispatchStatus,
) {
  const delivery = pickup === "delivery";
  const isPickup = pickup === true;
  if (delivery && dispatch === "delivered") {
    return { label: "Delivered", className: "bg-[var(--muted)]/15 text-[var(--foreground)]" };
  }
  if (delivery && dispatch === "out") {
    return { label: "Out for delivery", className: "bg-violet-100 text-violet-800" };
  }
  if (delivery && dispatch === "recalled") {
    return { label: "Recalled to pickup", className: "bg-amber-100 text-amber-800" };
  }
  switch (stage) {
    case "pending":
      return { label: "Pending", className: "bg-amber-100 text-amber-800" };
    case "rejected":
      return { label: "Rejected", className: "bg-red-100 text-red-800" };
    case "accepted":
      return { label: "Accepted", className: "bg-teal-100 text-teal-800" };
    case "queued":
      return { label: delivery ? "Queued for dispatch" : "In kitchen", className: "bg-teal-100 text-teal-800" };
    case "preparing":
      return { label: "Preparing", className: "bg-blue-100 text-blue-800" };
    case "ready":
      return {
        label: delivery ? "Ready for dispatch" : isPickup ? "Ready for pickup" : "Ready",
        className: "bg-green-100 text-green-800",
      };
    case "completed":
      return {
        label: delivery ? "Delivered" : isPickup ? "Collected" : "Served",
        className: "bg-[var(--muted)]/15 text-[var(--foreground)]",
      };
  }
}
