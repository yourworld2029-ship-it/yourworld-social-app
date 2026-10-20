import { useEffect, useMemo, useRef, useState } from "react";
import {
  CalendarDays,
  AlertCircle,
  Check,
  ChevronLeft,
  ChevronRight,
  FileCheck2,
  Loader2,
  Medal,
  ShieldCheck,
  Trash2,
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
  canRepairNationalAwardEvidence,
  NATIONAL_AWARD_OPTIONS,
  NATIONAL_AWARD_YEARS,
  INDIAN_IDENTITY_PROOF_TYPES,
  formatNationalAwardDobDisplay,
  formatNationalAwardDobInput,
  isValidNationalAwardDobIso,
  parseNationalAwardDobInput,
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
import { NationalAwardTermsSection } from "@/components/yw/NationalAwardTermsSection";
import { IntroductionVideoPreview } from "@/components/yw/IntroductionVideoPreview";
import { PrivateEvidencePreview } from "@/components/yw/PrivateEvidencePreview";
import { toast } from "sonner";
import {
  getNationalAwardEvidencePreviewUrl,
  getNationalAwardIntroductionPreviewUrl,
} from "@/lib/national-award.data";
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
  indianIdentityProofType: "",
  indianIdentityProof: null,
  certificate: null,
  introductionVideo: null,
};

const nationalAwardFormSchema = z.object({
  fullName: z.string().trim().min(1, "Enter your Full Name."),
  fatherName: z.string().trim().min(1, "Enter your Father's Name."),
  dateOfBirth: z
    .string()
    .min(1, "Enter your date of birth.")
    .refine(isValidNationalAwardDobIso, "Enter a valid date in DD/MM/YYYY format."),
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
  indianIdentityProofType: z
    .union([z.literal(""), z.enum(["aadhaar", "indian_passport", "voter_id"])])
    .refine(Boolean, "Select Aadhaar, Indian Passport, or Voter ID."),
  indianIdentityProof: z
    .object({
      path: z.string().min(1),
      name: z.string().min(1),
      mimeType: z.string(),
      size: z.number(),
    })
    .nullable()
    .refine(Boolean, "Upload Aadhaar, an Indian Passport, or Voter ID."),
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
  draft: {
    eyebrow: "NATIONAL HONOUR",
    title: "Award Profile draft",
    className: "text-amber-100",
  },
  pending: {
    eyebrow: "NATIONAL HONOUR",
    title: "Verification pending",
    className: "text-amber-100",
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
      : status === "draft"
        ? "Draft saved"
        : status === "pending" || status === "pending_verification"
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
                : status === "pending" || status === "pending_verification"
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
  savingDraft,
  uploadingKind,
  onUpload,
  onEvidenceUploadActivityChange,
  onSaveDraft,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  details: NationalAwardVerificationDetails | null;
  loading: boolean;
  saving: boolean;
  savingDraft: boolean;
  uploadingKind: NationalAwardEvidenceKind | null;
  onUpload: (
    kind: NationalAwardEvidenceKind,
    file: File,
  ) => Promise<NationalAwardEvidence>;
  onEvidenceUploadActivityChange?: (active: boolean) => void;
  onSaveDraft: (values: NationalAwardFormValues) => Promise<void>;
  onSubmit: (values: NationalAwardFormValues, termsAccepted: true) => Promise<void>;
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
  const [termsAgreed, setTermsAgreed] = useState(false);
  const [evidencePickerActive, setEvidencePickerActive] = useState(false);
  const [introductionPreviewUrl, setIntroductionPreviewUrl] = useState<string | null>(null);
  const [introductionVideoValid, setIntroductionVideoValid] = useState(false);
  const editable =
    !details ||
    details.status === "not_submitted" ||
    details.status === "draft" ||
    details.status === "rejected";
  const isRejected = details?.status === "rejected";
  const isPending =
    details?.status === "pending" || details?.status === "pending_verification";
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

  useEffect(() => {
    if (open) setTermsAgreed(false);
  }, [open]);

  useEffect(() => {
    const path = values.introductionVideo?.path;
    if (!open || !path) {
      setIntroductionPreviewUrl(null);
      setIntroductionVideoValid(false);
      return;
    }

    let active = true;
    setIntroductionPreviewUrl(null);
    setIntroductionVideoValid(false);
    void getNationalAwardIntroductionPreviewUrl(path)
      .then((url) => {
        if (active) setIntroductionPreviewUrl(url);
      })
      .catch((error) => {
        if (active) {
          setIntroductionPreviewUrl(null);
          toast.error(
            error instanceof Error ? error.message : "Could not load the introduction preview.",
          );
        }
      });
    return () => {
      active = false;
    };
  }, [open, values.introductionVideo?.path]);

  const uploadEvidence = async (
    kind: NationalAwardEvidenceKind,
    file: File | undefined,
  ) => {
    if (!file || !editable) return;
    const previousPreviewUrl = introductionPreviewUrl;
    const temporaryPreviewUrl =
      kind === "introduction" ? URL.createObjectURL(file) : null;
    if (temporaryPreviewUrl) {
      setIntroductionPreviewUrl(temporaryPreviewUrl);
      setIntroductionVideoValid(false);
    }
    try {
      const evidence = await onUpload(kind, file);
      const evidenceField =
        kind === "certificate"
          ? "certificate"
          : kind === "introduction"
            ? "introductionVideo"
            : "indianIdentityProof";
      setValue(evidenceField, evidence, {
        shouldValidate: true,
        shouldDirty: true,
      });
      clearErrors(evidenceField);
      if (kind === "introduction") {
        const signedUrl = await getNationalAwardIntroductionPreviewUrl(evidence.path);
        setIntroductionPreviewUrl(signedUrl);
        if (temporaryPreviewUrl) URL.revokeObjectURL(temporaryPreviewUrl);
      }
    } catch (error) {
      const evidenceField =
        kind === "certificate"
          ? "certificate"
          : kind === "introduction"
            ? "introductionVideo"
            : "indianIdentityProof";
      setError(evidenceField, {
        type: "manual",
        message: error instanceof Error ? error.message : "Could not upload this file.",
      });
      if (kind === "introduction") {
        setIntroductionPreviewUrl(previousPreviewUrl);
        if (temporaryPreviewUrl) URL.revokeObjectURL(temporaryPreviewUrl);
      }
      toast.error(error instanceof Error ? error.message : "Could not upload this file.");
    }
  };

  const submit = async (submittedValues: NationalAwardFormValues) => {
    if (!editable || saving || savingDraft || !termsAgreed) return;
    if (!introductionVideoValid) {
      toast.error("Select a valid 5 to 50 second vertical introduction video.");
      return;
    }
    await onSubmit(normalizeNationalAwardValues(submittedValues), true);
  };

  const saveDraft = async (draftValues: NationalAwardFormValues) => {
    if (!editable || saving || savingDraft) return;
    if (!introductionVideoValid) {
      toast.error("Select a valid 5 to 50 second vertical introduction video.");
      return;
    }
    await onSaveDraft(normalizeNationalAwardValues(draftValues));
  };

  const setEvidencePickerActivity = (active: boolean) => {
    setEvidencePickerActive(active);
    onEvidenceUploadActivityChange?.(active);
  };
  const handleDialogOpenChange = (nextOpen: boolean) => {
    if (!nextOpen && (evidencePickerActive || uploadingKind !== null)) return;
    onOpenChange(nextOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleDialogOpenChange}>
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
              onClick={() => handleDialogOpenChange(false)}
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
              {isPending ? (
                <div
                  data-testid="status-national-award-under-review"
                  className="mb-4 flex items-start gap-2 rounded-2xl border border-amber-200/25 bg-amber-200/[0.08] px-4 py-3 text-sm text-amber-100"
                >
                  <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>Under Review • 12 to 72 Hours. Your submitted details are locked until review is complete.</span>
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

              {(details?.status === "rejected" || details?.status === "draft") &&
              details.reviewReason ? (
                <div
                  data-testid="status-national-award-review-reason"
                  className="mb-4 rounded-2xl border border-rose-200/25 bg-rose-200/[0.08] px-4 py-3"
                >
                  <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-rose-200">
                    <AlertCircle className="h-4 w-4" />
                    Verification Issue
                  </p>
                  <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-zinc-200">
                    {details.reviewReason}
                  </p>
                </div>
              ) : null}

              <fieldset disabled={!editable || isRejected} className="space-y-5">
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
                    <NationalAwardDobField disabled={!editable || isRejected} />
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
                        disabled={!editable || isRejected}
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
                        disabled={!editable || isRejected}
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

                </fieldset>

                <section className="space-y-3">
                  <SectionHeading
                    title="Private verification evidence"
                    description="Uploaded files are visible only to you and authorized verification reviewers."
                  />
                  <div className="space-y-2">
                    <label
                      htmlFor="national-award-indian-identity-proof-type"
                      className="text-xs font-medium text-zinc-400"
                    >
                      Indian identity document type
                    </label>
                    <Select
                      value={values.indianIdentityProofType || undefined}
                      onValueChange={(value) =>
                        setValue(
                          "indianIdentityProofType",
                          value as NationalAwardFormValues["indianIdentityProofType"],
                          { shouldDirty: true, shouldValidate: true },
                        )
                      }
                      disabled={!editable || isRejected}
                    >
                      <SelectTrigger
                        id="national-award-indian-identity-proof-type"
                        data-testid="select-national-award-indian-identity-proof-type"
                        className="h-11 border-white/10 bg-white/[0.04] text-sm text-white"
                      >
                        <SelectValue placeholder="Select Aadhaar, Indian Passport, or Voter ID" />
                      </SelectTrigger>
                      <SelectContent className="border-[#c79a42]/30 bg-[#11100d] text-white">
                        {INDIAN_IDENTITY_PROOF_TYPES.map((option) => (
                          <SelectItem
                            key={option.value}
                            value={option.value}
                            className="text-xs text-zinc-100 focus:bg-[#c79a42]/20 focus:text-white"
                          >
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <EvidenceUpload
                    kind="identity"
                    label="Aadhaar / Indian Passport / Voter ID"
                    hint="A reviewer must confirm the document is Indian-issued."
                    accept="application/pdf,image/jpeg,image/png"
                    evidence={values.indianIdentityProof}
                    uploading={uploadingKind === "identity"}
                    disabled={
                      !editable ||
                      (isRejected &&
                        !canRepairNationalAwardEvidence(details?.reviewReason, "identity"))
                    }
                    onUpload={(file) => uploadEvidence("identity", file)}
                    onPickerActivityChange={setEvidencePickerActivity}
                    onDelete={() =>
                      setValue("indianIdentityProof", null, {
                        shouldDirty: true,
                        shouldValidate: true,
                      })
                    }
                  />
                  <EvidenceUpload
                    kind="certificate"
                    label="Certificate / Gazette"
                    hint="Upload a private certificate or gazette image/PDF."
                    accept="application/pdf,image/jpeg,image/png,image/webp"
                    evidence={values.certificate}
                    uploading={uploadingKind === "certificate"}
                    disabled={
                      !editable ||
                      (isRejected &&
                        !canRepairNationalAwardEvidence(details?.reviewReason, "certificate"))
                    }
                    onUpload={(file) => uploadEvidence("certificate", file)}
                    onPickerActivityChange={setEvidencePickerActivity}
                    onDelete={() =>
                      setValue("certificate", null, {
                        shouldDirty: true,
                        shouldValidate: true,
                      })
                    }
                  />
                  <div className="space-y-3 rounded-xl border border-white/10 bg-black/10 p-3">
                    <div>
                      <p className="text-sm font-medium text-zinc-200">Introduction Video</p>
                      <p className="mt-1 text-xs text-zinc-400">
                        5 to 50 Seconds • Vertical Video (9:16)
                      </p>
                      <p className="mt-2 text-xs leading-5 text-amber-100">
                        Natural Voice Only: No background music, songs, or added audio effects
                        allowed.
                      </p>
                      <p className="mt-2 text-xs leading-5 text-zinc-300">
                        Speak in your natural voice: 1. Full name &amp; Sport 2. Role
                        (National/International Player/Coach) 3. City, State &amp; Country 4. Major
                        tournament achievement or medal 5. Your @YourWorld username. (No need to
                        show certificates on camera).
                      </p>
                    </div>
                    {introductionPreviewUrl ? (
                      <IntroductionVideoPreview
                        src={introductionPreviewUrl}
                        onValidityChange={setIntroductionVideoValid}
                      />
                    ) : values.introductionVideo ? (
                      <p className="text-xs text-zinc-500">Loading your video preview…</p>
                    ) : (
                      <p className="text-xs text-zinc-500">
                        Choose a vertical video between 5 and 50 seconds.
                      </p>
                    )}
                    <div className="flex flex-wrap items-center gap-2">
                      <label
                        htmlFor="national-award-introduction-video"
                        className={`inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-amber-200/25 bg-amber-200/10 px-3 py-1.5 text-xs font-semibold text-amber-100 hover:bg-amber-200/20 ${
                          uploadingKind === "introduction" ||
                          !editable ||
                          (isRejected &&
                            !canRepairNationalAwardEvidence(
                              details?.reviewReason,
                              "introduction",
                            ))
                            ? "pointer-events-none opacity-60"
                            : ""
                        }`}
                      >
                        <Upload className="h-3.5 w-3.5" />
                        {uploadingKind === "introduction"
                          ? "Uploading…"
                          : values.introductionVideo
                            ? "Replace / Retake Video"
                            : "Upload Video"}
                      </label>
                      <input
                        id="national-award-introduction-video"
                        type="file"
                        accept="video/mp4,video/webm,video/quicktime"
                        className="sr-only"
                        disabled={
                          uploadingKind === "introduction" ||
                          !editable ||
                          (isRejected &&
                            !canRepairNationalAwardEvidence(
                              details?.reviewReason,
                              "introduction",
                            ))
                        }
                        onChange={(event) => {
                          const file = event.currentTarget.files?.[0];
                          event.currentTarget.value = "";
                          if (file) void uploadEvidence("introduction", file);
                        }}
                      />
                      {values.introductionVideo &&
                      editable &&
                      (!isRejected ||
                        canRepairNationalAwardEvidence(
                          details?.reviewReason,
                          "introduction",
                        )) ? (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          disabled={uploadingKind === "introduction"}
                          onClick={() => {
                            setValue("introductionVideo", null, {
                              shouldDirty: true,
                              shouldValidate: true,
                            });
                            setIntroductionPreviewUrl(null);
                            setIntroductionVideoValid(false);
                          }}
                          className="rounded-full text-red-200 hover:bg-red-400/10 hover:text-red-100"
                        >
                          <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                          Delete / Retake Video
                        </Button>
                      ) : null}
                    </div>
                  </div>
                </section>
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

              {editable && !isRejected ? (
                <Button
                  type="button"
                  data-testid="button-save-national-award-verification"
                  disabled={
                    saving ||
                    savingDraft ||
                    Boolean(uploadingKind) ||
                    !introductionVideoValid
                  }
                  onClick={() => void handleSubmit(saveDraft)()}
                  className="mt-5 h-11 w-full rounded-full bg-[#e2b75e] font-semibold text-black hover:bg-[#f0cb7b]"
                >
                  {savingDraft ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving…
                    </>
                  ) : (
                    "Save Verification Details"
                  )}
                </Button>
              ) : isRejected ? (
                <p className="mt-5 rounded-xl border border-amber-200/15 bg-amber-200/[0.05] px-3 py-2 text-xs leading-5 text-amber-100">
                  Replace the flagged evidence, accept the terms, and submit again for review.
                </p>
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
              <NationalAwardTermsSection
                accepted={termsAgreed}
                editable={editable}
                busy={
                  saving ||
                  savingDraft ||
                  Boolean(uploadingKind) ||
                  !introductionVideoValid
                }
                submitting={saving}
                onAcceptedChange={setTermsAgreed}
              />
              </form>
            </Form>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function normalizeNationalAwardValues(values: NationalAwardFormValues) {
  return {
    ...values,
    fullName: values.fullName.trim(),
    fatherName: values.fatherName.trim(),
    phoneNumber: values.phoneNumber.trim(),
    email: values.email.trim(),
    villageTown: values.villageTown.trim(),
    district: values.district.trim(),
    state: values.state.trim(),
  };
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

function NationalAwardDobField({ disabled }: { disabled: boolean }) {
  const { clearErrors, formState, setValue, watch } =
    useFormContext<NationalAwardFormValues>();
  const dateOfBirth = watch("dateOfBirth") ?? "";
  const [displayValue, setDisplayValue] = useState(() =>
    formatNationalAwardDobDisplay(dateOfBirth),
  );
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [visibleMonth, setVisibleMonth] = useState(() =>
    parseNationalAwardIsoDate(dateOfBirth) ?? new Date(),
  );
  const selectedDate = parseNationalAwardIsoDate(dateOfBirth);
  const year = visibleMonth.getFullYear();
  const month = visibleMonth.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstWeekday = new Date(year, month, 1).getDay();
  const daySlots = Array.from({ length: 42 }, (_, slot) => {
    const day = slot - firstWeekday + 1;
    return day > 0 && day <= daysInMonth ? day : null;
  });
  const dateError = formState.errors.dateOfBirth?.message;

  useEffect(() => {
    if (!dateOfBirth) {
      setDisplayValue("");
    } else if (isValidNationalAwardDobIso(dateOfBirth)) {
      setDisplayValue(formatNationalAwardDobDisplay(dateOfBirth));
    }
  }, [dateOfBirth]);

  const openCalendar = () => {
    setVisibleMonth(selectedDate ?? new Date());
    setCalendarOpen(true);
  };

  const selectDate = (isoDate: string) => {
    setDisplayValue(formatNationalAwardDobDisplay(isoDate));
    setValue("dateOfBirth", isoDate, {
      shouldDirty: true,
      shouldValidate: true,
    });
    clearErrors("dateOfBirth");
    setCalendarOpen(false);
  };

  return (
    <div className="space-y-1.5">
      <label
        htmlFor="national-award-date-of-birth"
        className="text-xs font-medium text-zinc-400"
      >
        DOB
      </label>
      <div className="relative">
        <Input
          id="national-award-date-of-birth"
          data-testid="input-national-award-date-of-birth"
          type="text"
          inputMode="numeric"
          autoComplete="bday"
          maxLength={10}
          placeholder="DD/MM/YYYY"
          aria-label="Date of birth, enter as day/month/year"
          aria-invalid={Boolean(dateError)}
          value={displayValue}
          disabled={disabled}
          onChange={(event) => {
            const nextDisplayValue = formatNationalAwardDobInput(event.target.value);
            const parsedDate = parseNationalAwardDobInput(nextDisplayValue);
            setDisplayValue(nextDisplayValue);
            setValue("dateOfBirth", parsedDate ?? (nextDisplayValue ? "__invalid_dob__" : ""), {
              shouldDirty: true,
              shouldValidate: nextDisplayValue.length === 10,
            });
            clearErrors("dateOfBirth");
          }}
          className="h-11 border-white/10 bg-white/[0.04] pr-12 text-sm text-white placeholder:text-zinc-500 focus-visible:ring-[#e2b75e]/60"
        />
        <button
          type="button"
          data-testid="button-open-national-award-dob-calendar"
          aria-label="Open date of birth calendar"
          disabled={disabled}
          onClick={openCalendar}
          className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-white transition-colors hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e2b75e]/60 disabled:opacity-50"
        >
          <CalendarDays aria-hidden="true" className="h-4 w-4" />
        </button>
      </div>
      {dateError ? (
        <p className="text-xs text-rose-300" role="alert">
          {dateError}
        </p>
      ) : null}

      <Dialog open={calendarOpen} onOpenChange={setCalendarOpen}>
        <DialogContent
          data-testid="dialog-national-award-dob-calendar"
          className="z-[90] w-[calc(100%-2rem)] max-w-sm border-white/15 bg-[#111111] p-4 text-white"
          overlayClassName="z-[80] bg-black/80"
        >
          <DialogHeader>
            <DialogTitle className="text-left text-white">Date of birth</DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              data-testid="button-national-award-dob-previous-month"
              aria-label="Previous month"
              onClick={() => setVisibleMonth(new Date(year, month - 1, 1))}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 text-white hover:bg-white/10"
            >
              <ChevronLeft aria-hidden="true" className="h-5 w-5" />
            </button>
            <p
              data-testid="text-national-award-dob-month-year"
              className="text-base font-semibold text-white"
            >
              {visibleMonth.toLocaleDateString(undefined, {
                month: "long",
                year: "numeric",
              })}
            </p>
            <button
              type="button"
              data-testid="button-national-award-dob-next-month"
              aria-label="Next month"
              onClick={() => setVisibleMonth(new Date(year, month + 1, 1))}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 text-white hover:bg-white/10"
            >
              <ChevronRight aria-hidden="true" className="h-5 w-5" />
            </button>
          </div>
          <div className="grid grid-cols-7 gap-1 text-center">
            {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((weekday) => (
              <span
                key={weekday}
                className="py-2 text-xs font-medium text-white"
              >
                {weekday}
              </span>
            ))}
            {daySlots.map((day, slot) =>
              day ? (
                <button
                  key={slot}
                  type="button"
                  data-testid={`button-national-award-dob-day-${day}`}
                  aria-label={`${visibleMonth.toLocaleDateString(undefined, {
                    month: "long",
                  })} ${day}, ${year}`}
                  aria-pressed={
                    selectedDate?.getFullYear() === year &&
                    selectedDate.getMonth() === month &&
                    selectedDate.getDate() === day
                  }
                  onClick={() =>
                    selectDate(
                      `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`,
                    )
                  }
                  className={`h-10 rounded-lg text-sm text-white transition-colors hover:bg-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e2b75e]/60 ${
                    selectedDate?.getFullYear() === year &&
                    selectedDate.getMonth() === month &&
                    selectedDate.getDate() === day
                      ? "bg-fuchsia-600 font-semibold"
                      : ""
                  }`}
                >
                  {day}
                </button>
              ) : (
                <span key={slot} aria-hidden="true" className="h-10" />
              ),
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function parseNationalAwardIsoDate(value: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;
  const date = new Date(0);
  date.setFullYear(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  date.setHours(0, 0, 0, 0);
  return isValidNationalAwardDobIso(value) ? date : null;
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
  onPickerActivityChange,
  onDelete,
}: {
  kind: NationalAwardEvidenceKind;
  label: string;
  hint: string;
  accept: string;
  evidence: NationalAwardEvidence | null;
  uploading: boolean;
  disabled: boolean;
  onUpload: (file: File | undefined) => void | Promise<void>;
  onPickerActivityChange?: (active: boolean) => void;
  onDelete: () => void;
}) {
  const inputId = `national-award-upload-${kind}`;
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    const input = inputRef.current;
    if (!input) return;
    const handleCancel = (event: Event) => {
      event.stopPropagation();
      onPickerActivityChange?.(false);
    };
    input.addEventListener("cancel", handleCancel);
    return () => input.removeEventListener("cancel", handleCancel);
  }, [onPickerActivityChange]);
  return (
    <div
      data-testid={`control-national-award-evidence-${kind}`}
      className="flex flex-wrap items-start gap-3 rounded-2xl border border-white/10 bg-white/[0.025] p-3"
    >
      {kind === "certificate" ? (
        <FileCheck2 className="mt-0.5 h-4 w-4 shrink-0 text-[#e2b75e]" />
      ) : kind === "introduction" ? (
        <Video className="mt-0.5 h-4 w-4 shrink-0 text-[#e2b75e]" />
      ) : (
        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-[#e2b75e]" />
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
      {evidence ? (
        <PrivateEvidencePreview
          path={evidence.path}
          name={evidence.name}
          mimeType={evidence.mimeType}
          getSignedUrl={getNationalAwardEvidencePreviewUrl}
          testId={`preview-national-award-evidence-${kind}`}
        />
      ) : null}
      <div className="ml-auto flex shrink-0 flex-wrap items-center justify-end gap-2">
        <label
          htmlFor={inputId}
          data-testid={`button-upload-national-award-${kind}`}
          className={`inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-[#e2b75e]/35 bg-[#e2b75e]/10 px-3 py-1.5 text-xs font-semibold text-[#f0cb7b] transition-colors hover:bg-[#e2b75e]/20 ${
            disabled || uploading ? "pointer-events-none opacity-50" : ""
          }`}
        >
          <Upload className="h-3.5 w-3.5" />
          {uploading ? "Uploading…" : evidence ? "Replace" : "Upload"}
        </label>
        {evidence && !disabled ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={uploading}
            data-testid={`button-delete-national-award-${kind}`}
            onClick={onDelete}
            className="rounded-full text-red-200 hover:bg-red-400/10 hover:text-red-100"
          >
            <Trash2 className="mr-1.5 h-3.5 w-3.5" />
            Delete
          </Button>
        ) : null}
      </div>
      <input
        ref={inputRef}
        id={inputId}
        data-testid={`input-upload-national-award-${kind}`}
        type="file"
        accept={accept}
        disabled={disabled || uploading}
        className="sr-only"
        onClick={(event) => {
          event.stopPropagation();
          onPickerActivityChange?.(true);
        }}
        onChange={(event) => {
          event.preventDefault();
          event.stopPropagation();
          const input = event.currentTarget;
          const file = input.files?.[0];
          input.value = "";
          if (!file) {
            onPickerActivityChange?.(false);
            return;
          }
          void Promise.resolve(onUpload(file))
            .finally(() => onPickerActivityChange?.(false))
            .catch(() => undefined);
        }}
      />
    </div>
  );
}