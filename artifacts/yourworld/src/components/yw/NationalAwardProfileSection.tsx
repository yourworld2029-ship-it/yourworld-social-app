import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import {
  NationalAwardProfileCard,
  NationalAwardVerificationDialog,
} from "@/components/yw/NationalAwardProfile";
import {
  getNationalAwardVerificationDetails,
  submitNationalAwardVerification,
} from "@/lib/national-award.functions";
import {
  type NationalAwardEvidenceKind,
  type NationalAwardFormValues,
  type NationalAwardVerificationDetails,
} from "@/lib/national-award";
import { uploadNationalAwardEvidence } from "@/lib/national-award.data";

export function NationalAwardProfileSection({ userId }: { userId: string }) {
  const [details, setDetails] = useState<NationalAwardVerificationDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingKind, setUploadingKind] = useState<NationalAwardEvidenceKind | null>(
    null,
  );

  useEffect(() => {
    let active = true;
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
  }, [userId]);

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

  const handleSubmit = useCallback(
    async (values: NationalAwardFormValues) => {
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
          },
        });
        setDetails(nextDetails);
        setOpen(false);
        toast.success("National Award Verification submitted for review.");
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
      <NationalAwardVerificationDialog
        open={open}
        onOpenChange={setOpen}
        details={details}
        loading={loading}
        saving={saving}
        uploadingKind={uploadingKind}
        onUpload={handleUpload}
        onSubmit={handleSubmit}
      />
    </>
  );
}