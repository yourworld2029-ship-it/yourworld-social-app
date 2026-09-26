import { useEffect, useMemo } from "react";
import {
  AlertCircle,
  Check,
  FileCheck2,
  Loader2,
  Medal,
  ShieldCheck,
  Upload,
  Video,
  X,
} from "lucide-react";
import type {
  NationalAwardEvidence,
  NationalAwardEvidenceKind,
  NationalAwardFormValues,
  NationalAwardStatus,
  NationalAwardVerificationDetails,
} from "@/lib/national-award";
import {
  NATIONAL_AWARD_OPTIONS,
  NATIONAL_AWARD_YEARS,
} from "@/lib/national-award";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Form } from "@/components/ui/form";
import { useForm, useFormContext } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const EMPTY_FORM: NationalAwardFormValues = {
  fullName: "",
  fatherName: "",
  dateOfBirth: "",
  phoneNumber: "",
  email: "",
  villageTown: "",
  district: "",
  state: "",
  country: "India",
  identityDetailsConfirmed: false,
  awardCode: "",
  awardYear: "",
  certificate: null,
  introductionVideo: null,
};

const nationalAwardFormSchema = z.object({
  fullName: z.string().trim().min(1, "Enter your Full Name."),
  fatherName: z.string().trim().min(1, "Enter your Father's Name."),
  dateOfBirth: z.string().min(1, "Select your date of birth."),
  phoneNumber: z.string().trim().min(1, "Enter your Phone Number."),
  email: z.string().trim().min(1, "Enter your Email."),
  villageTown: z.string().trim().min(1, "Enter your Village / Town."),
  district: z.string().trim().min(1, "Enter your District."),
  state: z.string().trim().min(1, "Enter your State."),
  country: z.literal("India"),
  identityDetailsConfirmed: z.boolean().refine(Boolean, {
    message: "Confirm that your identity details match exactly.",
  }),
  awardCode: z
    .union([
      z.literal(""),
      z.enum([
        "bharat_ratna",
        "padma_award",
        "param_vir_ashoka_chakra",
        "shaurya_kirti_chakra",
        "sena_medal_gallantry",
        "presidents_police_medal_gallantry",
      ]),
    ])
    .refine((value) => Boolean(value), "Select a national award."),
  awardYear: z.string().min(1, "Select the award year."),
  certificate: z
    .object({
      path: z.string().min(1),
      name: z.string().min(1),
      mimeType: z.string(),
      size: z.number(),
    })
    .nullable()
    .refine(Boolean, "Upload your certificate or gazette."),
  introductionVideo: z
    .object({
      path: z.string().min(1),
      name: z.string().min(1),
      mimeType: z.string(),
      size: z.number(),
    })
    .nullable()
    .refine(Boolean, "Upload your introduction video."),
});

const STATUS_COPY: Record<
  NationalAwardStatus,
  { eyebrow: string; title: string; className: string }
> = {
  not_submitted: {
    eyebrow: "NATIONAL HONOUR",
    title: "Award Profile",
    className: "text-amber-100/80",
  },
  pending_verification: {
    eyebrow: "NATIONAL HONOUR",
    title: "Verification pending",
    className: "text-amber-100",
  },
  approved: {
    eyebrow: "NATIONAL HONOUR",
    title: "Verified award profile",
    className: "text-emerald-200",
  },
  rejected: {
    eyebrow: "NATIONAL HONOUR",
    title: "Update award details",
    className: "text-rose-200",
  },
};

export function NationalAwardProfileCard({
  status,
  onClick,
}: {
  status: NationalAwardStatus;
  onClick: () => void;
}) {
  const copy = STATUS_COPY[status];
  const statusLabel =
    status === "approved"
      ? "Approved"
      : status === "pending_verification"
        ? "Pending verification"
        : status === "rejected"
          ? "Rejected — corrections available"
          : "Not submitted";

  return (
    <button
      type="button"
      data-testid="button-national-award-profile-details"
      aria-label="Open National Award Profile"
      onClick={onClick}
      className="group relative mt-4 w-full overflow-hidden rounded-3xl border border-[#b8903c]/30 bg-gradient-to-br from-[#211b0d] via-[#17130d] to-[#0c0c0c] p-4 text-left shadow-[0_14px_40px_rgba(0,0,0,0.24)] transition-transform active:scale-[0.99]"
    >
      <div className="pointer-events-none absolute -right-12 -top-12 h-36 w-36 rounded-full bg-[#d9aa45]/10 blur-3xl" />
      <div className="relative flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span
            data-testid="icon-national-award-profile"
            className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl border border-[#e2b75e]/35 bg-[#d9aa45]/10 text-[#e7bf6b]"
          >
            <Medal className="h-5 w-5" strokeWidth={1.7} />
          </span>
          <div className="min-w-0">
            <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-[#e7bf6b]/75">
              {copy.eyebrow}
            </p>
            <p
              data-testid="text-national-award-profile-title"
              className={`mt-0.5 truncate text-[13px] font-semibold ${copy.className}`}
            >
              {copy.title} <span className="text-[#e7bf6b]/80">&gt;</span>
            </p>
            <p
              data-testid="status-national-award-profile"
              className="mt-1 text-[10px] text-zinc-400"
            >
              {statusLabel}
            </p>
          </div>
        </div>
        <span
          data-testid="status-national-award-profile-indicator"
          className={`mt-1 h-2 w-2 shrink-0 rounded-full ${
            status === "approved"
              ? "bg-emerald-300"
              : status === "rejected"
                ? "bg-rose-300"
                : status === "pending_verification"
                  ? "bg-amber-300"
                  : "bg-zinc-600"
          }`}
          aria-label={statusLabel}
        />
      </div>
    </button>
  );
}

export function NationalAwardVerificationDialog({
  open,
  onOpenChange,
  details,
  loading,
  saving,
  uploadingKind,
  onUpload,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  details: NationalAwardVerificationDetails | null;
  loading: boolean;
  saving: boolean;
  uploadingKind: NationalAwardEvidenceKind | null;
  onUpload: (
    kind: NationalAwardEvidenceKind,
    file: File,
  ) => Promise<NationalAwardEvidence>;
  onSubmit: (values: NationalAwardFormValues) => Promise<void>;
}) {
  const form = useForm<NationalAwardFormValues>({
    resolver: zodResolver(nationalAwardFormSchema),
    defaultValues: EMPTY_FORM,
    mode: "onSubmit",
  });
  const {
    clearErrors,
    formState: { errors: fieldErrors },
    handleSubmit,
    reset,
    setError,
    setValue,
    watch,
  } = form;
  const values = watch();
  const editable = !details || details.status === "not_submitted" || details.status === "rejected";
  const selectedAwardLabel = useMemo(
    () => NATIONAL_AWARD_OPTIONS.find((option) => option.value === values.awardCode)?.label,
    [values.awardCode],
  );
  const errors = useMemo(
    () =>
      Object.values(fieldErrors)
        .map((error) => error?.message)
        .filter((message): message is string => typeof message === "string"),
    [fieldErrors],
  );

  useEffect(() => {
    if (open) {
      reset(details ? { ...details } : { ...EMPTY_FORM });
    }
  }, [open, details, reset]);

  const uploadEvidence = async (
    kind: NationalAwardEvidenceKind,
    file: File | undefined,
  ) => {
    if (!file || !editable) return;
    try {
      const evidence = await onUpload(kind, file);
      setValue(kind === "certificate" ? "certificate" : "introductionVideo", evidence, {
        shouldValidate: true,
        shouldDirty: true,
      });
      clearErrors(kind === "certificate" ? "certificate" : "introductionVideo");
    } catch (error) {
      setError(kind === "certificate" ? "certificate" : "introductionVideo", {
        type: "manual",
        message: error instanceof Error ? error.message : "Could not upload this file.",
      });
    }
  };

  const submit = async (submittedValues: NationalAwardFormValues) => {
    if (!editable || saving) return;
    await onSubmit({
      ...submittedValues,
      fullName: submittedValues.fullName.trim(),
      fatherName: submittedValues.fatherName.trim(),
      phoneNumber: submittedValues.phoneNumber.trim(),
      email: submittedValues.email.trim(),
      villageTown: submittedValues.villageTown.trim(),
      district: submittedValues.district.trim(),
      state: submittedValues.state.trim(),
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        data-testid="dialog-national-award-verification"
        className="max-h-[94svh] max-w-2xl overflow-hidden rounded-3xl border border-[#c79a42]/30 bg-black p-0 text-white shadow-[0_20px_90px_rgba(0,0,0,0.72)] [&>button]:hidden"
      >
        <div className="flex max-h-[94svh] flex-col">
          <div className="flex items-start justify-between border-b border-white/10 px-5 py-4">
            <DialogHeader className="space-y-1 text-left">
              <DialogTitle className="text-lg font-semibold text-white">
                National Award Profile
              </DialogTitle>
              <DialogDescription className="text-xs leading-5 text-zinc-400">
                Private identity verification for a national honour.
              </DialogDescription>
            </DialogHeader>
            <button
              type="button"
              data-testid="button-close-national-award-dialog"
              aria-label="Close National Award Profile"
              onClick={() => onOpenChange(false)}
              className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-white/10 text-zinc-400 transition-colors hover:bg-white/10 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {loading ? (
            <div
              data-testid="status-national-award-loading"
              className="space-y-3 overflow-y-auto px-5 py-6"
            >
              <div className="h-5 w-40 animate-pulse rounded bg-white/10" />
              <div className="h-11 animate-pulse rounded-xl bg-white/10" />
              <div className="h-11 animate-pulse rounded-xl bg-white/10" />
              <div className="h-28 animate-pulse rounded-2xl bg-white/10" />
            </div>
          ) : (
            <Form {...form}>
              <form
                onSubmit={(event) => {
                  event.preventDefault();
                  void handleSubmit(submit)(event);
                }}
                className="min-h-0 overflow-y-auto px-5 py-5"
              >
              {details?.status === "pending_verification" ? (
                <div
                  data-testid="status-national-award-under-review"
                  className="mb-4 flex items-start gap-2 rounded-2xl border border-amber-200/25 bg-amber-200/[0.08] px-4 py-3 text-sm text-amber-100"
                >
                  <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>Under review. Your submitted details are locked until review is complete.</span>
                </div>
              ) : null}

              {details?.status === "approved" ? (
                <div
                  data-testid="status-national-award-approved"
                  className="mb-4 flex items-start gap-2 rounded-2xl border border-emerald-200/25 bg-emerald-200/[0.08] px-4 py-3 text-sm text-emerald-100"
                >
                  <Check className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>National Award Profile verified successfully.</span>
                </div>
              ) : null}

              {details?.status === "rejected" && details.reviewReason ? (
                <div
                  data-testid="status-national-award-review-reason"
                  className="mb-4 rounded-2xl border border-rose-200/25 bg-rose-200/[0.08] px-4 py-3"
                >
                  <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-rose-200">
                    <AlertCircle className="h-4 w-4" />
                    Review reason
                  </p>
                  <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-zinc-200">
                    {details.reviewReason}
                  </p>
                </div>
              ) : null}

              <fieldset disabled={!editable} className="space-y-5">
                <section className="space-y-3">
                  <SectionHeading
                    title="Identity Details"
                    description="Enter your name, father's name, and date of birth exactly as shown on your identity documents."
                  />
                  <div className="grid gap-3 sm:grid-cols-2">
                    <TextField
                      name="fullName"
                      id="national-award-full-name"
                      testId="input-national-award-full-name"
                      label="Full Name"
                      placeholder="Exactly as on your identity document"
                    />
                    <TextField
                      name="fatherName"
                      id="national-award-father-name"
                      testId="input-national-award-father-name"
                      label="Father's Name"
                      placeholder="Exactly as on your identity document"
                    />
                    <TextField
                      name="dateOfBirth"
                      id="national-award-date-of-birth"
                      testId="input-national-award-date-of-birth"
                      label="DOB"
                      type="date"
                    />
                    <TextField
                      name="phoneNumber"
                      id="national-award-phone-number"
                      testId="input-national-award-phone-number"
                      label="Phone Number"
                      type="tel"
                      placeholder="Phone number"
                    />
                    <TextField
                      name="email"
                      id="national-award-email"
                      testId="input-national-award-email"
                      label="Email"
                      type="email"
                      placeholder="Email address"
                    />
                    <TextField
                      name="villageTown"
                      id="national-award-village-town"
                      testId="input-national-award-village-town"
                      label="Village / Town"
                      placeholder="Village or town"
                    />
                    <TextField
                      name="district"
                      id="national-award-district"
                      testId="input-national-award-district"
                      label="District"
                      placeholder="District"
                    />
                    <TextField
                      name="state"
                      id="national-award-state"
                      testId="input-national-award-state"
                      label="State"
                      placeholder="State"
                    />
                    <TextField
                      name="country"
                      id="national-award-country"
                      testId="input-national-award-country"
                      label="Country"
                      readOnly
                    />
                  </div>
                  <label
                    data-testid="control-national-award-identity-confirmation"
                    className="flex cursor-pointer items-start gap-3 pt-1 text-xs leading-5 text-zinc-300"
                  >
                    <input
                      type="checkbox"
                      data-testid="checkbox-national-award-identity-match"
                      checked={values.identityDetailsConfirmed}
                      onChange={(event) =>
                        setValue("identityDetailsConfirmed", event.target.checked, {
                          shouldDirty: true,
                          shouldValidate: true,
                        })
                      }
                      className="mt-1 h-4 w-4 accent-[#e2b75e]"
                    />
                    <span>
                      I confirm that my Full Name, Father&apos;s Name, and DOB match my identity
                      documents exactly.
                    </span>
                  </label>
                </section>

                <section className="space-y-3">
                  <SectionHeading
                    title="National Award"
                    description="Choose the national honour exactly as shown on your official record."
                  />
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-1.5 sm:col-span-2">
                      <label
                        htmlFor="national-award-award-code"
                        className="text-xs font-medium text-zinc-400"
                      >
                        Award
                      </label>
                      <Select
                        value={values.awardCode || undefined}
                        onValueChange={(value) =>
                          setValue("awardCode", value as NationalAwardFormValues["awardCode"], {
                            shouldDirty: true,
                            shouldValidate: true,
                          })
                        }
                        disabled={!editable}
                      >
                        <SelectTrigger
                          id="national-award-award-code"
                          data-testid="select-national-award-award"
                          className="h-auto min-h-11 border-[#c79a42]/35 bg-[#0d0d0d] py-2 text-left text-sm text-white data-[placeholder]:text-zinc-500"
                        >
                          <SelectValue placeholder="Select a national award">
                            {selectedAwardLabel}
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent
                          data-testid="menu-national-award-awards"
                          className="border-[#c79a42]/30 bg-[#11100d] text-white"
                        >
                          {NATIONAL_AWARD_OPTIONS.map((option) => (
                            <SelectItem
                              key={option.value}
                              value={option.value}
                              data-testid={`option-national-award-${option.value}`}
                              className="py-2.5 text-xs text-zinc-100 focus:bg-[#c79a42]/20 focus:text-white"
                            >
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5 sm:max-w-[220px]">
                      <label
                        htmlFor="national-award-year"
                        className="text-xs font-medium text-zinc-400"
                      >
                        Award Year
                      </label>
                      <Select
                        value={values.awardYear || undefined}
                        onValueChange={(value) =>
                          setValue("awardYear", value, {
                            shouldDirty: true,
                            shouldValidate: true,
                          })
                        }
                        disabled={!editable}
                      >
                        <SelectTrigger
                          id="national-award-year"
                          data-testid="select-national-award-year"
                          className="h-11 border-[#c79a42]/35 bg-[#0d0d0d] text-white data-[placeholder]:text-zinc-500"
                        >
                          <SelectValue placeholder="Select year" />
                        </SelectTrigger>
                        <SelectContent
                          data-testid="menu-national-award-years"
                          className="border-[#c79a42]/30 bg-[#11100d] text-white"
                        >
                          {NATIONAL_AWARD_YEARS.map((year) => (
                            <SelectItem
                              key={year}
                              value={year}
                              data-testid={`option-national-award-year-${year}`}
                              className="text-xs text-zinc-100 focus:bg-[#c79a42]/20 focus:text-white"
                            >
                              {year}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </section>

                <section className="space-y-3">
                  <SectionHeading
                    title="Private verification evidence"
                    description="Uploaded files are visible only to you and authorized verification reviewers."
                  />
                  <EvidenceUpload
                    kind="certificate"
                    label="Certificate / Gazette"
                    hint="Upload a private certificate or gazette image/PDF."
                    accept="application/pdf,image/jpeg,image/png,image/webp"
                    evidence={values.certificate}
                    uploading={uploadingKind === "certificate"}
                    disabled={!editable}
                    onUpload={(file) => void uploadEvidence("certificate", file)}
                  />
                  <EvidenceUpload
                    kind="introduction"
                    label="Introduction Video"
                    hint="Upload a short introduction video about your award."
                    accept="video/*"
                    evidence={values.introductionVideo}
                    uploading={uploadingKind === "introduction"}
                    disabled={!editable}
                    onUpload={(file) => void uploadEvidence("introduction", file)}
                  />
                </section>
              </fieldset>

              {errors.length ? (
                <div
                  data-testid="status-national-award-validation-errors"
                  role="alert"
                  className="mt-5 rounded-2xl border border-rose-200/25 bg-rose-200/[0.08] px-4 py-3 text-sm text-rose-100"
                >
                  <p className="font-semibold">Please complete the required details.</p>
                  <ul className="mt-1 list-disc space-y-0.5 pl-5 text-xs text-rose-100/90">
                    {errors.map((error) => (
                      <li key={error}>{error}</li>
                    ))}
                  </ul>
                </div>
              ) : null}

               {editable ? (
                <Button
                  type="submit"
                  data-testid="button-save-national-award-verification"
                  disabled={saving || Boolean(uploadingKind)}
                  className="mt-5 h-11 w-full rounded-full bg-[#e2b75e] font-semibold text-black hover:bg-[#f0cb7b]"
                >
                  {saving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving…
                    </>
                  ) : (
                    "Save Verification Details"
                  )}
                </Button>
              ) : (
                <p
                  data-testid="status-national-award-readonly"
                  className="mt-5 flex items-center justify-center gap-2 text-xs text-zinc-500"
                >
                  <ShieldCheck className="h-4 w-4" />
                  {details?.status === "approved"
                    ? "Approved submissions are read-only."
                    : "Pending submissions are read-only."}
                </p>
               )}
              </form>
            </Form>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function SectionHeading({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div>
      <h3 className="text-sm font-semibold text-white">{title}</h3>
      <p className="mt-1 text-xs leading-5 text-zinc-500">{description}</p>
    </div>
  );
}

function TextField({
  name,
  id,
  testId,
  label,
  placeholder,
  type = "text",
  readOnly = false,
}: {
  name:
    | "fullName"
    | "fatherName"
    | "dateOfBirth"
    | "phoneNumber"
    | "email"
    | "villageTown"
    | "district"
    | "state"
    | "country";
  id: string;
  testId: string;
  label: string;
  placeholder?: string;
  type?: string;
  readOnly?: boolean;
}) {
  const { clearErrors, register } = useFormContext<NationalAwardFormValues>();
  const field = register(name);
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="text-xs font-medium text-zinc-400">
        {label}
      </label>
      <Input
        id={id}
        data-testid={testId}
        type={type}
        {...field}
        onChange={(event) => {
          void field.onChange(event);
          clearErrors(name);
        }}
        placeholder={placeholder}
        readOnly={readOnly}
        className="h-11 border-white/10 bg-white/[0.04] text-sm text-white placeholder:text-zinc-600 focus-visible:ring-[#e2b75e]/60"
      />
    </div>
  );
}

function EvidenceUpload({
  kind,
  label,
  hint,
  accept,
  evidence,
  uploading,
  disabled,
  onUpload,
}: {
  kind: NationalAwardEvidenceKind;
  label: string;
  hint: string;
  accept: string;
  evidence: NationalAwardEvidence | null;
  uploading: boolean;
  disabled: boolean;
  onUpload: (file: File | undefined) => void;
}) {
  const inputId = `national-award-upload-${kind}`;
  return (
    <div
      data-testid={`control-national-award-evidence-${kind}`}
      className="flex flex-wrap items-start gap-3 rounded-2xl border border-white/10 bg-white/[0.025] p-3"
    >
      {kind === "certificate" ? (
        <FileCheck2 className="mt-0.5 h-4 w-4 shrink-0 text-[#e2b75e]" />
      ) : (
        <Video className="mt-0.5 h-4 w-4 shrink-0 text-[#e2b75e]" />
      )}
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-zinc-200">{label}</p>
        <p className="mt-0.5 text-xs leading-5 text-zinc-500">{hint}</p>
        <p
          data-testid={`status-national-award-evidence-${kind}`}
          className="mt-1 truncate text-xs text-zinc-400"
        >
          {uploading
            ? "Uploading…"
            : evidence
              ? `${evidence.name} · Uploaded`
              : "Not uploaded"}
        </p>
      </div>
      <label
        htmlFor={inputId}
        data-testid={`button-upload-national-award-${kind}`}
        className={`inline-flex shrink-0 cursor-pointer items-center gap-1.5 rounded-full border border-[#e2b75e]/35 bg-[#e2b75e]/10 px-3 py-1.5 text-xs font-semibold text-[#f0cb7b] transition-colors hover:bg-[#e2b75e]/20 ${
          disabled || uploading ? "pointer-events-none opacity-50" : ""
        }`}
      >
        <Upload className="h-3.5 w-3.5" />
        {uploading ? "Uploading…" : evidence ? "Replace" : "Upload"}
      </label>
      <input
        id={inputId}
        data-testid={`input-upload-national-award-${kind}`}
        type="file"
        accept={accept}
        disabled={disabled || uploading}
        className="sr-only"
        onChange={(event) => {
          const file = event.currentTarget.files?.[0];
          event.currentTarget.value = "";
          onUpload(file);
        }}
      />
    </div>
  );
}