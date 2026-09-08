"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";
import { useLockPageScroll } from "@/lib/use-lock-page-scroll";
import { clearKitchenSession, emitPartnerHome, readKitchenSession } from "@/lib/partner-ops";

export function isRestaurantDeskPath(pathname: string) {
  return (
    pathname.startsWith("/partner/dashboard") ||
    pathname.startsWith("/partner/kitchen") ||
    pathname.startsWith("/partner/orders") ||
    pathname.startsWith("/partner/reservations") ||
    pathname.startsWith("/partner/tables") ||
    pathname.startsWith("/partner/settings")
  );
}

export function hasKitchenClientSession() {
  return Boolean(readKitchenSession());
}

export function leaveKitchenClient() {
  clearKitchenSession();
  emitPartnerHome();
}

interface PartnerLeaveDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function PartnerLeaveDialog({ open, onClose, onConfirm }: PartnerLeaveDialogProps) {
  useLockPageScroll(open);

  useEffect(() => {
    if (!open) {
      return;
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open || typeof document === "undefined") {
    return null;
  }

  return createPortal(
    <div className="booking-gate" role="presentation" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="partner-leave-title"
        className="booking-gate__panel"
        onClick={(event) => event.stopPropagation()}
      >
        <p className="booking-gate__kicker">Restaurant desk</p>
        <h2 id="partner-leave-title" className="booking-gate__title">
          Log out of the restaurant desk?
        </h2>
        <p className="booking-gate__copy">
          You are signed in as a restaurant. Logging out takes you back to restaurant onboarding, not the diner site.
        </p>
        <div className="booking-gate__actions">
          <button type="button" className="site-btn" onClick={onConfirm}>
            Log out
          </button>
          <button type="button" className="booking-gate__stay" onClick={onClose}>
            Stay signed in
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
