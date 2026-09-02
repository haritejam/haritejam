"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";

interface BookingGateProps {
  name: string;
  href: string;
  onClose: () => void;
}

export function BookingGate({ name, href, onClose }: BookingGateProps) {
  const router = useRouter();

  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  return createPortal(
    <div className="booking-gate" role="presentation" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="booking-gate-title"
        className="booking-gate__panel"
        onClick={(event) => event.stopPropagation()}
      >
        <p className="booking-gate__kicker">Restaurant booking</p>
        <h2 id="booking-gate-title" className="booking-gate__title">
          {name}
        </h2>
        <p className="booking-gate__copy">
          Continue to the restaurant list to complete this booking. You will pick a place, then confirm the table or pickup there.
        </p>
        <div className="booking-gate__actions">
          <button type="button" className="site-btn" onClick={() => router.push(href)}>
            Continue to booking
          </button>
          <button type="button" className="booking-gate__stay" onClick={onClose}>
            Stay here
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
