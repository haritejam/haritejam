import { SwitchIcon } from "@/components/icons";
import { cn } from "@/lib/cn";

export function FlexiSwitchBanner({ className }: { className?: string }) {
  return (
    <aside
      className={cn(
        "flex flex-col gap-4 rounded-[10px] bg-accent px-5 py-5 text-ink shadow-[0_16px_40px_rgba(10,92,102,0.28)] sm:flex-row sm:items-center sm:justify-between sm:px-6",
        className,
      )}
    >
      <div className="flex items-start gap-3 sm:items-center">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-[8px] bg-ink/15 ring-1 ring-ink/25">
          <SwitchIcon className="h-5 w-5" />
        </span>
        <span>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-ink/70">On every booking</p>
          <p className="mt-0.5 text-xl font-semibold tracking-[-0.03em]">FlexiSwitch</p>
        </span>
      </div>
      <p className="max-w-md text-sm leading-6 text-ink/90 sm:text-right">
        Dine in or pickup, on your terms. Same kitchen ticket. No cancellations.
      </p>
    </aside>
  );
}
