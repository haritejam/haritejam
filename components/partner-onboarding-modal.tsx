"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { indianCities } from "@/lib/cities";
import {
  conversionPolicies,
  cuisines,
  partnerOnboardingDefaults,
  partnerOnboardingSchema,
  posTypes,
  readPartnerApplication,
  STEP_FIELDS,
  writePartnerApplication,
  type PartnerOnboardingInput,
} from "@/lib/partner-onboarding";

const fieldClass =
  "mt-1.5 w-full rounded-[6px] border border-line bg-background px-3 py-2.5 text-foreground outline-none focus:border-accent";

const steps = [
  "Account & outlet",
  "Legal KYC & bank",
  "Operational specs",
  "Menu & policy",
] as const;

interface PartnerOnboardingModalProps {
  open: boolean;
  step: number;
  onStepChange: (step: number) => void;
  onClose: () => void;
  onSubmitted: () => void;
}

function FieldError({ message }: { message?: string }) {
  if (!message) {
    return null;
  }
  return <p className="mt-1 text-sm text-accent">{message}</p>;
}

export function PartnerOnboardingModal({
  open,
  step,
  onStepChange,
  onClose,
  onSubmitted,
}: PartnerOnboardingModalProps) {
  const form = useForm<PartnerOnboardingInput>({
    resolver: zodResolver(partnerOnboardingSchema) as Resolver<PartnerOnboardingInput>,
    defaultValues: partnerOnboardingDefaults,
    mode: "onSubmit",
  });
  const {
    register,
    handleSubmit,
    trigger,
    getValues,
    reset,
    formState: { errors },
  } = form;
  const [draftNote, setDraftNote] = useState("");

  useEffect(() => {
    if (!open) {
      return;
    }
    const stored = readPartnerApplication();
    if (stored) {
      reset({
        ...partnerOnboardingDefaults,
        ...stored.values,
        fssaiCertificate: undefined,
        menuFile: undefined,
      });
    }
  }, [open, reset]);

  useEffect(() => {
    if (!open) {
      return;
    }
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
  }, [open, onClose]);

  if (!open || typeof document === "undefined") {
    return null;
  }

  async function goNext() {
    const fields = [...STEP_FIELDS[step]];
    const ok = await trigger(fields, { shouldFocus: true });
    if (ok) {
      onStepChange(Math.min(step + 1, 3));
    }
  }

  function saveDraft() {
    writePartnerApplication("DRAFT", getValues());
    setDraftNote("Draft saved on this device.");
  }

  function submitApplication(values: PartnerOnboardingInput) {
    writePartnerApplication("PENDING_APPROVAL", values);
    onSubmitted();
  }

  return createPortal(
    <div className="booking-gate" role="presentation" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="onboarding-title"
        className="site-card w-[min(40rem,100%)] max-h-[min(42rem,90vh)] overflow-y-auto p-6 shadow-[0_18px_48px_rgba(20,28,30,0.14)]"
        onClick={(event) => event.stopPropagation()}
      >
        <p className="booking-gate__kicker">Restaurant onboarding</p>
        <h2 id="onboarding-title" className="booking-gate__title">
          {steps[step]}
        </h2>
        <ol className="mt-4 flex flex-wrap gap-2">
          {steps.map((label, index) => (
            <li
              key={label}
              className={`rounded-[6px] border px-2.5 py-1 text-[11px] font-semibold ${
                index === step ? "border-accent bg-accent text-ink" : "border-line text-muted"
              }`}
            >
              {index + 1}. {label}
            </li>
          ))}
        </ol>

        <form className="mt-6 space-y-4" onSubmit={handleSubmit((values) => submitApplication(values))}>
          {step === 0 && (
            <>
              <label className="block text-sm text-muted">
                Restaurant name
                <input className={fieldClass} {...register("restaurantName")} />
                <FieldError message={errors.restaurantName?.message} />
              </label>
              <label className="block text-sm text-muted">
                Owner or manager name
                <input className={fieldClass} {...register("ownerName")} />
                <FieldError message={errors.ownerName?.message} />
              </label>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block text-sm text-muted">
                  Owner contact (mobile)
                  <input className={fieldClass} inputMode="numeric" {...register("ownerPhone")} />
                  <FieldError message={errors.ownerPhone?.message} />
                </label>
                <label className="block text-sm text-muted">
                  Owner email
                  <input className={fieldClass} type="email" {...register("ownerEmail")} />
                  <FieldError message={errors.ownerEmail?.message} />
                </label>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block text-sm text-muted">
                  City
                  <select className={fieldClass} {...register("city")}>
                    {indianCities.map((city) => (
                      <option key={city} value={city}>
                        {city}
                      </option>
                    ))}
                  </select>
                  <FieldError message={errors.city?.message} />
                </label>
                <label className="block text-sm text-muted">
                  Cuisine
                  <select className={fieldClass} {...register("cuisine")}>
                    {cuisines.map((cuisine) => (
                      <option key={cuisine} value={cuisine}>
                        {cuisine}
                      </option>
                    ))}
                  </select>
                  <FieldError message={errors.cuisine?.message} />
                </label>
              </div>
            </>
          )}

          {step === 1 && (
            <>
              <label className="block text-sm text-muted">
                FSSAI licence number
                <input className={fieldClass} inputMode="numeric" {...register("fssaiNumber")} />
                <FieldError message={errors.fssaiNumber?.message} />
              </label>
              <label className="block text-sm text-muted">
                FSSAI certificate upload
                <input className={fieldClass} type="file" accept=".pdf,image/*" {...register("fssaiCertificate")} />
                <FieldError message={errors.fssaiCertificate?.message as string | undefined} />
              </label>
              <label className="block text-sm text-muted">
                GSTIN
                <input className={fieldClass} {...register("gstin")} />
                <FieldError message={errors.gstin?.message} />
              </label>
              <label className="block text-sm text-muted">
                Bank account holder
                <input className={fieldClass} {...register("bankAccountName")} />
                <FieldError message={errors.bankAccountName?.message} />
              </label>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block text-sm text-muted">
                  Bank account number
                  <input className={fieldClass} inputMode="numeric" {...register("bankAccountNumber")} />
                  <FieldError message={errors.bankAccountNumber?.message} />
                </label>
                <label className="block text-sm text-muted">
                  IFSC
                  <input className={fieldClass} {...register("ifsc")} />
                  <FieldError message={errors.ifsc?.message} />
                </label>
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <label className="block text-sm text-muted">
                Seating capacity
                <input className={fieldClass} type="number" min={8} {...register("seatingCapacity", { valueAsNumber: true })} />
                <FieldError message={errors.seatingCapacity?.message} />
              </label>
              <label className="block text-sm text-muted">
                POS type
                <select className={fieldClass} {...register("posType")}>
                  {posTypes.map((pos) => (
                    <option key={pos} value={pos}>
                      {pos}
                    </option>
                  ))}
                </select>
                <FieldError message={errors.posType?.message} />
              </label>
              <div className="grid gap-4 sm:grid-cols-3">
                <label className="block text-sm text-muted">
                  Dine-in prep (min)
                  <input className={fieldClass} type="number" {...register("dineInPrepMinutes", { valueAsNumber: true })} />
                  <FieldError message={errors.dineInPrepMinutes?.message} />
                </label>
                <label className="block text-sm text-muted">
                  Pickup prep (min)
                  <input className={fieldClass} type="number" {...register("pickupPrepMinutes", { valueAsNumber: true })} />
                  <FieldError message={errors.pickupPrepMinutes?.message} />
                </label>
                <label className="block text-sm text-muted">
                  Fire ticket (min)
                  <input className={fieldClass} type="number" {...register("fireTicketMinutes", { valueAsNumber: true })} />
                  <FieldError message={errors.fireTicketMinutes?.message} />
                </label>
              </div>
              <p className="text-sm leading-6 text-muted">
                Prep rules tell the kitchen when to start a pre-order so the pass is ready without crowding the floor.
              </p>
            </>
          )}

          {step === 3 && (
            <>
              <label className="block text-sm text-muted">
                Menu upload (PDF or CSV)
                <input className={fieldClass} type="file" accept=".pdf,.csv,.xlsx" {...register("menuFile")} />
                <FieldError message={errors.menuFile?.message as string | undefined} />
              </label>
              <fieldset>
                <legend className="text-sm text-muted">Conversion policy</legend>
                <div className="mt-3 space-y-3">
                  {conversionPolicies.map((policy) => (
                    <label key={policy.id} className="flex gap-3 rounded-[6px] border border-line bg-background p-3">
                      <input type="radio" value={policy.id} className="mt-1 accent-[var(--accent)]" {...register("conversionPolicy")} />
                      <span>
                        <span className="block text-sm font-semibold text-foreground">{policy.title}</span>
                        <span className="mt-1 block text-sm leading-6 text-muted">{policy.detail}</span>
                      </span>
                    </label>
                  ))}
                </div>
                <FieldError message={errors.conversionPolicy?.message} />
              </fieldset>
            </>
          )}

          <div className="flex flex-wrap gap-3 border-t border-line pt-4">
            {step > 0 ? (
              <button type="button" className="booking-gate__stay" onClick={() => onStepChange(step - 1)}>
                Back
              </button>
            ) : null}
            {step < 3 ? (
              <button type="button" className="site-btn" onClick={() => void goNext()}>
                Continue
              </button>
            ) : null}
            <button type="button" className="booking-gate__stay" onClick={saveDraft}>
              Save Draft
            </button>
            <button type="button" className="booking-gate__stay" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="site-btn">
              Submit Application
            </button>
            {draftNote ? <p className="w-full text-sm text-muted">{draftNote}</p> : null}
          </div>
        </form>
      </div>
    </div>,
    document.body,
  );
}
