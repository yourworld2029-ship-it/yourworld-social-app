import { useCallback, useEffect, useState } from "react";
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

export function NationalAwardProfileSection({
  userId,
  sportsVerificationCountry,
}: {
  userId: string;
  sportsVerificationCountry?: string | null;
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
    : sportsCountryIsIndia === true;
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savingDraft, setSavingDraft] = useState(false);
  const [uploadingKind, setUploadingKind] = useState<NationalAwardEvidenceKind | null>(
    null,
  );

  useEffect(() => {
    let active = true;
    const providedCountry = sportsVerificationCountry?.trim();
    const country = providedCountry
      ? Promise.resolve(providedCountry)
      : getSportsVerificationCountry(userId);
    void country
      .then((value) => {
        if (!active) return;
        const isIndia = isIndiaSportsCountry(value);
        setSportsCountryIsIndia(isIndia);
        if (!isIndia) setOpen(false);
      })
      .catch(() => {
        if (!active) return;
        setSportsCountryIsIndia(false);
        setOpen(false);
        toast.error("Could not confirm country for National Award eligibility.");
      });
    return () => {
      active = false;
    };
  }, [sportsVerificationCountry, userId]);

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
      setUploadingKind(kind);
      try {
        return await uploadNationalAwardEvidence(userId, kind, file);
      } finally {
        setUploadingKind(null);
      }
    },
    [userId],
  );

  const handleSaveDraft = useCallback(
    async (values: NationalAwardFormValues) => {
      if (!values.certificate || !values.introductionVideo) {
        toast.error("Upload both required verification files before saving.");
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
      if (!values.certificate || !values.introductionVideo) {
        toast.error("Upload both required verification files before submitting.");
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
            certificatePath: values.certificate.path,
            certificateFileName: values.certificate.name,
            introductionPath: values.introductionVideo.path,
            introductionFileName: values.introductionVideo.name,
            termsAccepted,
          },
        });
        setDetails(nextDetails);
        setOpen(false);
        toast.success("National Award Profile submitted for verification.");
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
        onOpenChange={setOpen}
        details={details}
        loading={loading}
        saving={saving}
        savingDraft={savingDraft}
        uploadingKind={uploadingKind}
        onUpload={handleUpload}
        onSaveDraft={handleSaveDraft}
        onSubmit={handleSubmit}
      />
    </>
  );
}