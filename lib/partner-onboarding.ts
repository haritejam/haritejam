import { z } from "zod";
import { indianCities } from "@/lib/cities";

export const conversionPolicies = [
  {
    id: "A",
    title: "Policy A · One price",
    detail: "Dine-in and pickup share the same menu price. FlexiSwitch keeps the original ticket.",
  },
  {
    id: "B",
    title: "Policy B · Pickup offset",
    detail: "Pickup is priced below dine-in. Switching to dine-in collects the difference at the table.",
  },
  {
    id: "C",
    title: "Policy C · Conversion hold",
    detail: "Pre-order is locked at pickup price. FlexiSwitch to dine-in adds a listed conversion charge.",
  },
] as const;

export const posTypes = ["Petpooja", "POSIST", "Square", "Toast", "Excel / CSV", "Other"] as const;
export const cuisines = [
  "Contemporary Indian",
  "Indian",
  "Coastal Indian",
  "Japanese",
  "Italian",
  "Vietnamese",
  "Modern European",
  "Multi-cuisine",
] as const;

function hasFile(value: unknown) {
  if (typeof File !== "undefined" && value instanceof File) {
    return value.size > 0;
  }
  if (typeof FileList !== "undefined" && value instanceof FileList) {
    return value.length > 0 && value[0].size > 0;
  }
  return false;
}

const optionalUpload = z.any().optional();

export const partnerOnboardingSchema = z.object({
  restaurantName: z.string().trim().min(2, "Enter the restaurant name."),
  ownerName: z.string().trim().min(2, "Enter the owner or manager name."),
  ownerPhone: z.string().trim().regex(/^[6-9]\d{9}$/, "Enter a 10-digit Indian mobile number."),
  ownerEmail: z.string().trim().email("Enter a valid email."),
  city: z.enum(indianCities, { message: "Choose a city." }),
  cuisine: z.enum(cuisines, { message: "Choose a cuisine." }),
  fssaiNumber: z.string().trim().regex(/^\d{14}$/, "FSSAI licence must be 14 digits."),
  fssaiCertificate: optionalUpload,
  gstin: z
    .string()
    .trim()
    .regex(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][A-Z0-9]Z[A-Z0-9]$/i, "Enter a valid 15-character GSTIN."),
  bankAccountName: z.string().trim().min(2, "Enter the account holder name."),
  bankAccountNumber: z.string().trim().regex(/^\d{9,18}$/, "Enter a 9 to 18 digit account number."),
  ifsc: z.string().trim().regex(/^[A-Z]{4}0[A-Z0-9]{6}$/i, "Enter a valid IFSC."),
  seatingCapacity: z.number().int().min(8, "Seating must be at least 8.").max(800, "Enter a realistic capacity."),
  posType: z.enum(posTypes, { message: "Choose a POS type." }),
  dineInPrepMinutes: z.number().int().min(5).max(180, "Enter prep time in minutes."),
  pickupPrepMinutes: z.number().int().min(5).max(120, "Enter pickup prep time in minutes."),
  fireTicketMinutes: z.number().int().min(5).max(90, "Enter when the kitchen should fire the ticket."),
  menuFile: optionalUpload,
  conversionPolicy: z.enum(["A", "B", "C"], { message: "Select a conversion policy." }),
}).superRefine((value, ctx) => {
  if (!hasFile(value.fssaiCertificate)) {
    ctx.addIssue({ code: "custom", path: ["fssaiCertificate"], message: "Upload the FSSAI certificate." });
  }
  if (!hasFile(value.menuFile)) {
    ctx.addIssue({ code: "custom", path: ["menuFile"], message: "Upload a menu file." });
  }
});

export type PartnerOnboardingInput = z.infer<typeof partnerOnboardingSchema>;
export type PartnerApplicationStatus = "DRAFT" | "PENDING_APPROVAL";

export const partnerOnboardingDefaults: PartnerOnboardingInput = {
  restaurantName: "",
  ownerName: "",
  ownerPhone: "",
  ownerEmail: "",
  city: "Mumbai",
  cuisine: "Contemporary Indian",
  fssaiNumber: "",
  fssaiCertificate: undefined,
  gstin: "",
  bankAccountName: "",
  bankAccountNumber: "",
  ifsc: "",
  seatingCapacity: 40,
  posType: "Petpooja",
  dineInPrepMinutes: 25,
  pickupPrepMinutes: 18,
  fireTicketMinutes: 20,
  menuFile: undefined,
  conversionPolicy: "A",
};

export const STEP_FIELDS = [
  ["restaurantName", "ownerName", "ownerPhone", "ownerEmail", "city", "cuisine"],
  ["fssaiNumber", "fssaiCertificate", "gstin", "bankAccountName", "bankAccountNumber", "ifsc"],
  ["seatingCapacity", "posType", "dineInPrepMinutes", "pickupPrepMinutes", "fireTicketMinutes"],
  ["menuFile", "conversionPolicy"],
] as const;

const STORAGE_KEY = "flexidine-partner-application";

type StoredApplication = {
  status: PartnerApplicationStatus;
  values: Omit<PartnerOnboardingInput, "fssaiCertificate" | "menuFile"> & {
    fssaiFileName?: string;
    menuFileName?: string;
  };
  savedAt: string;
};

export function readPartnerApplication(): StoredApplication | null {
  if (typeof window === "undefined") {
    return null;
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as StoredApplication) : null;
  } catch {
    return null;
  }
}

export function writePartnerApplication(
  status: PartnerApplicationStatus,
  values: PartnerOnboardingInput,
) {
  const fssai = fileFromUnknown(values.fssaiCertificate);
  const menu = fileFromUnknown(values.menuFile);
  const { fssaiCertificate: _fssai, menuFile: _menu, ...rest } = values;
  const record: StoredApplication = {
    status,
    savedAt: new Date().toISOString(),
    values: {
      ...rest,
      fssaiFileName: fssai?.name,
      menuFileName: menu?.name,
    },
  };
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(record));
  return record;
}

export function fileFromUnknown(value: unknown): File | undefined {
  if (typeof File !== "undefined" && value instanceof File) {
    return value;
  }
  if (typeof FileList !== "undefined" && value instanceof FileList) {
    return value[0];
  }
  return undefined;
}
