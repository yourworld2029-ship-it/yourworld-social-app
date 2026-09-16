import { useEffect, useRef, useState } from "react";
import { Camera, Check, Search, X } from "lucide-react";
import { toast } from "sonner";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { YwAvatar } from "@/components/yw/Avatar";
import { ProfilePhotoCropper } from "@/components/yw/ProfilePhotoCropper";
import type { User } from "@/lib/yw-data";
import { SportsProfileCard, type SportsProfileInfo } from "@/components/yw/SportsProfile";
import {
  NORMAL_PROFILE_CATEGORIES,
  NORMAL_PROFILE_MAIN_CATEGORIES,
  NORMAL_PROFILE_SUBCATEGORIES,
  SPORTS_CATALOGUE,
  SPORTS_PROFILE_ROLES,
  getNormalProfileCategoryMain,
} from "@/lib/profile-category";

export type ProfileEdit = {
  name: string;
  username: string;
  category: string;
  normalCategories: string[];
  bio: string;
  location?: string;
  website?: string;
  avatarUrl?: string;
  coverUrl?: string;
  avatarFile?: File;
  coverFile?: File;
  verificationRequested?: boolean;
};

const BIO_MAX = 300;

export function EditProfileSheet({
  open,
  onOpenChange,
  user,
  value,
  onSave,
  sportsProfile,
  onOpenSportsDetails,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  user: User;
  value: ProfileEdit;
  onSave: (v: ProfileEdit) => void | Promise<void>;
  sportsProfile?: SportsProfileInfo | null;
  onOpenSportsDetails?: () => void;
}) {
  const [draft, setDraft] = useState<ProfileEdit>(value);
  const [saving, setSaving] = useState(false);
  const [avatarCropFile, setAvatarCropFile] = useState<File | null>(null);
  const [categoryQuery, setCategoryQuery] = useState("");
  const [expandedMainCategory, setExpandedMainCategory] = useState<string | null>(null);
  const [pendingSport, setPendingSport] = useState<string | null>(null);
  const avatarInput = useRef<HTMLInputElement>(null);
  const avatarPreviewUrl = useRef<string | null>(null);

  useEffect(() => {
    if (open) {
      setDraft(value);
      setCategoryQuery("");
      setExpandedMainCategory(null);
      setPendingSport(null);
    } else {
      setAvatarCropFile(null);
      if (avatarPreviewUrl.current) {
        URL.revokeObjectURL(avatarPreviewUrl.current);
        avatarPreviewUrl.current = null;
      }
    }
  }, [open, value]);

  useEffect(
    () => () => {
      if (avatarPreviewUrl.current) URL.revokeObjectURL(avatarPreviewUrl.current);
    },
    [],
  );

  const set = <K extends keyof ProfileEdit>(k: K, v: ProfileEdit[K]) =>
    setDraft((d) => ({ ...d, [k]: v }));

  const selectedCategories = draft.normalCategories;
  const selectedMainCategories = selectedCategories.map(getNormalProfileCategoryMain);
  const normalizedQuery = categoryQuery.trim().toLowerCase();
  const visibleMainCategories = NORMAL_PROFILE_MAIN_CATEGORIES.filter((category) =>
    !normalizedQuery
      ? true
      : category.toLowerCase().includes(normalizedQuery) ||
        NORMAL_PROFILE_SUBCATEGORIES[category].some((subCategory) =>
          subCategory.toLowerCase().includes(normalizedQuery),
        ) ||
        (category === "Sports" &&
          [...SPORTS_CATALOGUE, ...SPORTS_PROFILE_ROLES].some((sportOrRole) =>
            sportOrRole.toLowerCase().includes(normalizedQuery),
          )),
  );

  const selectCategory = (mainCategory: string, subCategory?: string) => {
    const value = subCategory ? `${mainCategory} • ${subCategory}` : mainCategory;
    const mainKey = mainCategory.toLowerCase();
    const existingIndex = selectedCategories.findIndex(
      (category) => getNormalProfileCategoryMain(category).toLowerCase() === mainKey,
    );
    if (existingIndex < 0 && selectedMainCategories.length >= 2) return;
    const next = [...selectedCategories];
    if (existingIndex >= 0) {
      next[existingIndex] = value;
    } else {
      next.push(value);
    }
    set("normalCategories", next);
  };

  const removeCategory = (category: string) => {
    set(
      "normalCategories",
      selectedCategories.filter((selected) => selected !== category),
    );
  };

  const openMainCategory = (mainCategory: string) => {
    setPendingSport(null);
    if (mainCategory === "Other") {
      const alreadySelected = selectedMainCategories.some(
        (selected) => selected.toLowerCase() === mainCategory.toLowerCase(),
      );
      if (alreadySelected) removeCategory(
        selectedCategories.find(
          (selected) => getNormalProfileCategoryMain(selected).toLowerCase() === "other",
        ) ?? mainCategory,
      );
      else selectCategory(mainCategory);
      setExpandedMainCategory(null);
      return;
    }
    setExpandedMainCategory(mainCategory);
  };

  const selectSportRole = (role: string) => {
    if (!pendingSport) return;
    selectCategory("Sports", `${pendingSport} • ${role}`);
    setPendingSport(null);
  };

  const pick = (file: File | undefined, key: "avatarUrl" | "coverUrl") => {
    if (!file) return;
    if (key === "avatarUrl") {
      setAvatarCropFile(file);
      return;
    }
    setDraft((d) => ({
      ...d,
      coverUrl: URL.createObjectURL(file),
      coverFile: file,
    }));
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="max-h-[92svh] overflow-y-auto rounded-t-3xl border-border/60 p-0 [&>button]:hidden"
      >
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border/60 glass px-4 py-3">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            aria-label="Close"
            className="grid h-8 w-8 place-items-center rounded-full bg-secondary/70 transition-transform active:scale-90"
          >
            <X className="h-4 w-4" strokeWidth={1.8} />
          </button>
          <h2 className="font-display text-base font-bold">Edit Profile</h2>
          <span className="w-8" />
        </div>

        <div className="px-4 pb-8 pt-4">
          <div className="relative overflow-hidden rounded-3xl bg-secondary/60">
            <div className="flex items-center gap-4 p-4">
              <button
                type="button"
                onClick={() => avatarInput.current?.click()}
                className="relative shrink-0 transition-transform active:scale-95"
                aria-label="Change profile photo"
              >
                {draft.avatarUrl ? (
                  <img
                    src={draft.avatarUrl}
                    alt=""
                    className="h-[68px] w-[68px] rounded-full object-cover"
                  />
                ) : (
                  <YwAvatar user={user} size={68} />
                )}
                <span className="absolute -bottom-0.5 -right-0.5 grid h-7 w-7 place-items-center rounded-full border-2 border-background bg-foreground text-background">
                  <Camera className="h-3.5 w-3.5" strokeWidth={1.9} />
                </span>
              </button>
              <p className="text-sm text-muted-foreground">
                Tap the photo to update your profile picture.
              </p>
            </div>
          </div>

          <input
            ref={avatarInput}
            type="file"
            accept="image/*"
            hidden
            onChange={(e) => {
              pick(e.target.files?.[0], "avatarUrl");
              e.currentTarget.value = "";
            }}
          />

          <ProfilePhotoCropper
            open={Boolean(avatarCropFile)}
            file={avatarCropFile}
            onOpenChange={(cropOpen) => {
              if (!cropOpen) setAvatarCropFile(null);
            }}
            onComplete={({ file, previewUrl }) => {
              if (avatarPreviewUrl.current) URL.revokeObjectURL(avatarPreviewUrl.current);
              avatarPreviewUrl.current = previewUrl;
              setDraft((current) => ({
                ...current,
                avatarUrl: previewUrl,
                avatarFile: file,
              }));
            }}
          />


          <div className="space-y-4 pt-5">
            <Field label="Display Name">
              <Input
                value={draft.name}
                maxLength={40}
                onChange={(e) => set("name", e.target.value)}
                className="h-11 rounded-xl"
              />
            </Field>

            <Field label="Username">
              <div className="relative">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                  @
                </span>
                <Input
                  value={draft.username}
                  maxLength={30}
                  onChange={(e) =>
                    set("username", e.target.value.replace(/[^\w.]/g, "").toLowerCase())
                  }
                  className="h-11 rounded-xl pl-7"
                />
              </div>
            </Field>

            <Field label="Category">
              <div className="space-y-2.5">
                <p className="text-[11px] text-muted-foreground">
                  Choose up to 2 categories
                </p>
                {selectedCategories.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {selectedCategories.map((category) => (
                      <button
                        key={category}
                        type="button"
                        onClick={() => removeCategory(category)}
                        className="inline-flex items-center gap-1 rounded-full border border-foreground/15 bg-foreground/[0.09] px-2.5 py-1 text-[11px] font-semibold text-foreground transition-colors hover:bg-foreground/[0.14] active:scale-95"
                        aria-label={`Remove ${category}`}
                      >
                        {category}
                        <X className="h-3 w-3 text-muted-foreground" strokeWidth={2} />
                      </button>
                    ))}
                  </div>
                ) : null}
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={categoryQuery}
                    onChange={(event) => setCategoryQuery(event.target.value)}
                    placeholder="Search categories"
                    className="h-9 rounded-xl border-border/60 bg-background/30 pl-9 text-xs"
                    aria-label="Search categories"
                  />
                </div>
                <div className="max-h-56 overflow-y-auto rounded-2xl border border-border/60 bg-background/20 p-1.5">
                  <div className="grid grid-cols-2 gap-1">
                    {visibleMainCategories.map((category) => {
                      const active = selectedMainCategories.some(
                        (selected) => selected.toLowerCase() === category.toLowerCase(),
                      );
                      const disabled = !active && selectedMainCategories.length >= 2;
                      return (
                        <button
                          key={category}
                          type="button"
                          onClick={() => openMainCategory(category)}
                          disabled={disabled}
                          aria-pressed={active}
                          aria-expanded={expandedMainCategory === category}
                          className={`flex min-h-8 items-center justify-between gap-2 rounded-xl px-2.5 py-1.5 text-left text-[11px] font-medium transition-colors ${
                            active
                              ? "bg-foreground text-background"
                              : disabled
                                ? "cursor-not-allowed text-muted-foreground/35"
                                : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                          }`}
                        >
                          <span>{category}</span>
                          {active ? <Check className="h-3 w-3 shrink-0" strokeWidth={2.5} /> : null}
                        </button>
                      );
                    })}
                  </div>
                  {visibleMainCategories.length === 0 ? (
                    <p className="px-2 py-3 text-center text-[11px] text-muted-foreground">
                      No categories found
                    </p>
                  ) : null}
                  {expandedMainCategory ? (
                    <div className="mt-2 border-t border-border/60 px-1 pt-2">
                      <p className="px-1 pb-1.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                        {expandedMainCategory === "Sports"
                          ? pendingSport
                            ? `${pendingSport} roles`
                            : "Choose a sport"
                          : `${expandedMainCategory} options`}
                      </p>
                      {expandedMainCategory === "Sports" ? (
                        pendingSport ? (
                          <div className="grid grid-cols-2 gap-1">
                            {SPORTS_PROFILE_ROLES.map((role) => (
                              <button
                                key={role}
                                type="button"
                                onClick={() => selectSportRole(role)}
                                className="rounded-xl px-2.5 py-1.5 text-left text-[11px] text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                              >
                                {role}
                              </button>
                            ))}
                          </div>
                        ) : (
                          <>
                            <button
                              type="button"
                              onClick={() => selectCategory("Sports")}
                              className="mb-1.5 w-full rounded-xl border border-dashed border-border/70 px-2.5 py-1.5 text-left text-[11px] font-medium text-muted-foreground hover:bg-secondary hover:text-foreground"
                            >
                              Use Sports without a specific role
                            </button>
                            <div className="grid grid-cols-2 gap-1">
                              {SPORTS_CATALOGUE.filter((sport) =>
                                !normalizedQuery ||
                                sport.toLowerCase().includes(normalizedQuery),
                              ).map((sport) => (
                                <button
                                  key={sport}
                                  type="button"
                                  onClick={() => setPendingSport(sport)}
                                  className="rounded-xl px-2.5 py-1.5 text-left text-[11px] text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                                >
                                  {sport}
                                </button>
                              ))}
                            </div>
                          </>
                        )
                      ) : (
                        <div className="grid grid-cols-2 gap-1">
                          {NORMAL_PROFILE_SUBCATEGORIES[
                            expandedMainCategory as keyof typeof NORMAL_PROFILE_SUBCATEGORIES
                          ]
                            .filter((subCategory) =>
                              !normalizedQuery ||
                              subCategory.toLowerCase().includes(normalizedQuery) ||
                              expandedMainCategory.toLowerCase().includes(normalizedQuery),
                            )
                            .map((subCategory) => (
                              <button
                                key={subCategory}
                                type="button"
                                onClick={() => selectCategory(expandedMainCategory, subCategory)}
                                className="rounded-xl px-2.5 py-1.5 text-left text-[11px] text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                              >
                                {subCategory}
                              </button>
                            ))}
                        </div>
                      )}
                    </div>
                  ) : null}
                </div>
              </div>
            </Field>

            <Field label="Bio">
              <Textarea
                value={draft.bio}
                maxLength={BIO_MAX}
                rows={5}
                onChange={(e) => set("bio", e.target.value)}
                className="min-h-28 rounded-xl leading-relaxed"
              />
              <p className="pt-1 text-right text-[11px] text-muted-foreground">
                {draft.bio.length}/{BIO_MAX}
              </p>
            </Field>

            {sportsProfile && onOpenSportsDetails ? (
              <SportsProfileCard
                profile={sportsProfile}
                onClick={onOpenSportsDetails}
              />
            ) : null}
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3 border-t border-border/60 pt-4">
            <Button
              variant="secondary"
              className="h-11 rounded-full"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              className="h-11 rounded-full"
              disabled={saving}
              onClick={async () => {
                setSaving(true);
                try {
                  await onSave(draft);
                  onOpenChange(false);
                  toast.success("Profile updated");
                } catch (e) {
                  toast.error(e instanceof Error ? e.message : "Could not save profile");
                } finally {
                  setSaving(false);
                }
              }}
            >
              {saving ? "Saving…" : "Save Changes"}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="pb-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      {children}
    </div>
  );
}