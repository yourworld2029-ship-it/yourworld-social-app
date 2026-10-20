import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import {
  NationalAwardProfileCard,
  NationalAwardVerificationDialog,
} from "@/components/yw/NationalAwardProfile";
import {
  getNationalAwardVerificationDetails,
  saveNationalAwardVerificationDraft,
  submitNationalAwardVerification,
} from "@/lib/national-award.functions";
import {
  type NationalAwardEvidenceKind,
  type NationalAwardFormValues,
  type NationalAwardVerificationDetails,
} from "@/lib/national-award";
import { uploadNationalAwardEvidence } from "@/lib/national-award.data";
import { getSportsVerificationCountry } from "@/lib/profile-data";
import { isIndiaSportsCountry } from "@/lib/sports-country";
import {
  clearVerificationPickerResume,
  hasVerificationPickerResume,
} from "@/lib/verification-picker-resume";

export function NationalAwardProfileSection({
  userId,
  sportsVerificationCountry,
  onSubmitted,
  onBeforeOpen,
  onEvidenceUploadActivityChange,
}: {
  userId: string;
  sportsVerificationCountry?: string | null;
  onSubmitted?: () => void;
  onBeforeOpen?: () => boolean;
  onEvidenceUploadActivityChange?: (active: boolean) => void;
}) {
  const [details, setDetails] = useState<NationalAwardVerificationDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [sportsCountryIsIndia, setSportsCountryIsIndia] = useState<boolean | null>(() => {
    const country = sportsVerificationCountry?.trim();
    return country ? isIndiaSportsCountry(country) : null;
  });
  const providedCountry = sportsVerificationCountry?.trim();
  const canShowNationalAward = providedCountry
    ? isIndiaSportsCountry(providedCountry)
    : sportsCountryIsIndia !== false;
  const [open, setOpen] = useState(false);
  const [pickerResumeActive, setPickerResumeActive] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savingDraft, setSavingDraft] = useState(false);
  const [uploadingKind, setUploadingKind] = useState<NationalAwardEvidenceKind | null>(
    null,
  );
  const uploadingKindRef = useRef<NationalAwardEvidenceKind | null>(null);
  const resumeTimeoutRef = useRef<number | null>(null);
  const evidenceActivityChangeRef = useRef(onEvidenceUploadActivityChange);
  evidenceActivityChangeRef.current = onEvidenceUploadActivityChange;

  const reportEvidenceUploadActivity = (active: boolean) => {
    if (!active) {
      setPickerResumeActive(false);
      clearVerificationPickerResume(userId, "national-award");
      if (resumeTimeoutRef.current) {
        clearTimeout(resumeTimeoutRef.current);
        resumeTimeoutRef.current = null;
      }
    }
    evidenceActivityChangeRef.current?.(active);
  };

  useEffect(() => {
    let active = true;
    const providedCountry = sportsVerificationCountry?.trim();
    const country = providedCountry
      ? Promise.resolve(providedCountry)
      : getSportsVerificationCountry(userId);
    void country
      .then((value) => {
        if (!active) return;
        const normalizedCountry = value.trim();
        const isIndia = normalizedCountry ? isIndiaSportsCountry(normalizedCountry) : null;
        setSportsCountryIsIndia(isIndia);
        if (isIndia === false) setOpen(false);
      })
      .catch(() => {
        if (!active) return;
        setSportsCountryIsIndia(null);
        setOpen(false);
        toast.error("Could not confirm country for National Award eligibility.");
      });
    return () => {
      active = false;
    };
  }, [sportsVerificationCountry, userId]);

  useEffect(() => {
    if (!canShowNationalAward || !hasVerificationPickerResume(userId, "national-award")) {
      return;
    }

    setOpen(true);
    setPickerResumeActive(true);
    reportEvidenceUploadActivity(true);
    resumeTimeoutRef.current = window.setTimeout(() => {
      if (uploadingKindRef.current !== null) return;
      setPickerResumeActive(false);
      reportEvidenceUploadActivity(false);
      resumeTimeoutRef.current = null;
    }, 2500);
    return () => {
      if (resumeTimeoutRef.current) {
        clearTimeout(resumeTimeoutRef.current);
        resumeTimeoutRef.current = null;
      }
    };
  }, [canShowNationalAward, userId]);

  useEffect(() => {
    let active = true;
    if (!canShowNationalAward) {
      setDetails(null);
      setLoading(false);
      setLoadError(null);
      return () => {
        active = false;
      };
    }

    setDetails(null);
    setLoading(true);
    setLoadError(null);
    void getNationalAwardVerificationDetails()
      .then((nextDetails) => {
        if (active) setDetails(nextDetails);
      })
      .catch((error: unknown) => {
        if (!active) return;
        const message =
          error instanceof Error
            ? error.message
            : "Could not load National Award Verification details.";
        setLoadError(message);
        toast.error(message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [canShowNationalAward, userId]);

  const handleUpload = useCallback(
    async (kind: NationalAwardEvidenceKind, file: File) => {
      if (resumeTimeoutRef.current) {
        clearTimeout(resumeTimeoutRef.current);
        resumeTimeoutRef.current = null;
      }
      uploadingKindRef.current = kind;
      setUploadingKind(kind);
      try {
        return await uploadNationalAwardEvidence(userId, kind, file);
      } finally {
        uploadingKindRef.current = null;
        setUploadingKind(null);
      }
    },
    [userId],
  );

  const handleSaveDraft = useCallback(
    async (values: NationalAwardFormValues) => {
      if (
        !values.indianIdentityProof ||
        !values.indianIdentityProofType ||
        !values.certificate ||
        !values.introductionVideo
      ) {
        toast.error("Select and upload an accepted Indian identity proof and both verification files.");
        return;
      }

      setSavingDraft(true);
      try {
        const nextDetails = await saveNationalAwardVerificationDraft({
          data: {
            fullName: values.fullName,
            fatherName: values.fatherName,
            dateOfBirth: values.dateOfBirth,
            phoneNumber: values.phoneNumber,
            email: values.email,
            villageTown: values.villageTown,
            district: values.district,
            state: values.state,
            identityDetailsConfirmed: values.identityDetailsConfirmed,
            awardCode: values.awardCode,
            awardYear: values.awardYear,
            indianIdentityProofType: values.indianIdentityProofType,
            indianIdentityProofPath: values.indianIdentityProof.path,
            indianIdentityProofFileName: values.indianIdentityProof.name,
            certificatePath: values.certificate.path,
            certificateFileName: values.certificate.name,
            introductionPath: values.introductionVideo.path,
            introductionFileName: values.introductionVideo.name,
          },
        });
        setDetails(nextDetails);
        toast.success("Verification details saved.");
      } catch (error) {
        toast.error(
          error instanceof Error
            ? error.message
            : "Could not save National Award Verification details.",
        );
      } finally {
        setSavingDraft(false);
      }
    },
    [],
  );

  const handleSubmit = useCallback(
    async (values: NationalAwardFormValues, termsAccepted: true) => {
      if (
        !values.indianIdentityProof ||
        !values.indianIdentityProofType ||
        !values.certificate ||
        !values.introductionVideo
      ) {
        toast.error("Select and upload an accepted Indian identity proof and both verification files.");
        return;
      }

      setSaving(true);
      try {
        const nextDetails = await submitNationalAwardVerification({
          data: {
            fullName: values.fullName,
            fatherName: values.fatherName,
            dateOfBirth: values.dateOfBirth,
            phoneNumber: values.phoneNumber,
            email: values.email,
            villageTown: values.villageTown,
            district: values.district,
            state: values.state,
            identityDetailsConfirmed: values.identityDetailsConfirmed,
            awardCode: values.awardCode,
            awardYear: values.awardYear,
            indianIdentityProofType: values.indianIdentityProofType,
            indianIdentityProofPath: values.indianIdentityProof.path,
            indianIdentityProofFileName: values.indianIdentityProof.name,
            certificatePath: values.certificate.path,
            certificateFileName: values.certificate.name,
            introductionPath: values.introductionVideo.path,
            introductionFileName: values.introductionVideo.name,
            termsAccepted,
          },
        });
        setDetails(nextDetails);
        setOpen(false);
        toast.success(
          "Application submitted! Your intro is live on Reels. Verification badge will be reviewed within 12–72 hours.",
        );
        onSubmitted?.();
      } catch (error) {
        toast.error(
          error instanceof Error
            ? error.message
            : "Could not submit National Award Verification.",
        );
      } finally {
        setSaving(false);
      }
    },
    [],
  );

  return (
    <>
      {canShowNationalAward ? (
        <NationalAwardProfileCard
          status={details?.status ?? "not_submitted"}
          onClick={() => {
            if (onBeforeOpen && !onBeforeOpen()) return;
            if (loadError) {
              toast.error(loadError);
              return;
            }
            setOpen(true);
          }}
        />
      ) : null}
      <NationalAwardVerificationDialog
        open={open}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) {
            setPickerResumeActive(false);
            reportEvidenceUploadActivity(false);
          }
          setOpen(nextOpen);
        }}
        details={details}
        loading={loading}
        saving={saving}
        savingDraft={savingDraft}
        uploadingKind={uploadingKind}
        onUpload={handleUpload}
        onEvidenceUploadActivityChange={reportEvidenceUploadActivity}
        pickerResumeActive={pickerResumeActive}
        onSaveDraft={handleSaveDraft}
        onSubmit={handleSubmit}
      />
    </>
  );
}