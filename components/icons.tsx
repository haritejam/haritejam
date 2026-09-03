import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

function Icon({ children, ...props }: IconProps) {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      {children}
    </svg>
  );
}

export function ArrowUpRight(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M7 17 17 7" />
      <path d="M8 7h9v9" />
    </Icon>
  );
}

export function CalendarIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <rect x="3.5" y="5" width="17" height="15.5" rx="1.5" />
      <path d="M7.5 3v4M16.5 3v4M3.5 9.5h17" />
    </Icon>
  );
}

export function ChevronDown(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="m7 10 5 5 5-5" />
    </Icon>
  );
}

export function ClockIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3 2" />
    </Icon>
  );
}

export function CloseIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="m6 6 12 12M18 6 6 18" />
    </Icon>
  );
}

export function LocationPin(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M19 10.3c0 5.1-7 10.2-7 10.2s-7-5.1-7-10.2a7 7 0 1 1 14 0Z" />
      <circle cx="12" cy="10.3" r="2.35" />
    </Icon>
  );
}

export function MenuIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M4 7h16M4 12h16M4 17h16" />
    </Icon>
  );
}

export function PackageIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="m4 7.5 8-4 8 4-8 4-8-4Z" />
      <path d="M4 7.5V16l8 4.5 8-4.5V7.5M12 11.5V20" />
    </Icon>
  );
}

export function SearchIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="10.8" cy="10.8" r="6.3" />
      <path d="m16 16 4.3 4.3" />
    </Icon>
  );
}

export function StarIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="m12 3.6 2.45 5 5.5.8-3.98 3.89.94 5.49L12 16.2l-4.92 2.59.94-5.49-3.98-3.89 5.5-.8 2.46-5Z" />
    </Icon>
  );
}

export function TableIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M4 10.5h16M6.5 10.5V20M17.5 10.5V20M3.5 6.5h17v4h-17z" />
    </Icon>
  );
}

export function UtensilsIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M6 3v7M3.5 3v4.2A2.8 2.8 0 0 0 6.3 10H7a2.5 2.5 0 0 0 2.5-2.5V3M6 10v11M16.5 3v18M16.5 3c2.6 1.9 4 4.3 4 7.2h-4" />
    </Icon>
  );
}

export function BagIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M7 8h10l-.8 11.2a2 2 0 0 1-2 1.8H9.8a2 2 0 0 1-2-1.8L7 8Z" />
      <path d="M9 8V6.8A3 3 0 0 1 12 3.8 3 3 0 0 1 15 6.8V8" />
    </Icon>
  );
}

export function SwitchIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M7 8h9.5l-2.2-2.2M17 16H7.5l2.2 2.2" />
    </Icon>
  );
}

export function CheckIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="m5 12.5 4.2 4.2L19 7.5" />
    </Icon>
  );
}

export function ClocheIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M4 17h16M12 6v1M6.5 17C6.5 11.8 8.9 7 12 7s5.5 4.8 5.5 10" />
    </Icon>
  );
}

export function ChevronRight(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="m9 6 6 6-6 6" />
    </Icon>
  );
}

export function BrandMark({ className, ...props }: IconProps) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      viewBox="0 0 64 56"
      fill="none"
      {...props}
    >
      <path d="M16 8.5v24.5" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
      <path d="M12.2 8.5v7.2c0 2.1 1.7 3.8 3.8 3.8s3.8-1.7 3.8-3.8V8.5" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
      <path d="M47.8 8.5v24.5" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
      <path d="M44.6 8.5h6.4v8.2c0 1.8-1.4 3.2-3.2 3.2s-3.2-1.4-3.2-3.2V8.5Z" stroke="currentColor" strokeWidth="2.2" strokeLinejoin="round" />
      <circle cx="32" cy="26" r="11.2" stroke="currentColor" strokeWidth="2.2" />
      <path d="M32 18.6v1.6M32 31.8v1.6M23.8 26h1.6M38.6 26h1.6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      <path d="M32 26v-5.2M32 26l4.4 2.6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M20.5 16.5c4.2-6.8 18.8-6.8 23 0" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
      <path d="M42.2 11.2 45.4 16.2 39.8 16" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M18 42c8.8 6.4 19.2 6.4 28 0" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  );
}
