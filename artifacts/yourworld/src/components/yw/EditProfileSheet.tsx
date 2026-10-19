import { useEffect, useRef, useState } from "react";
import { Camera, Check, ChevronDown, LockKeyhole, Search, X } from "lucide-react";
import { toast } from "sonner";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { YwAvatar } from "@/components/yw/Avatar";
import { ProfilePhotoCropper } from "@/components/yw/ProfilePhotoCropper";
import type { User } from "@/lib/yw-data";
import { SportsProfileCard, type SportsProfileInfo } from "@/components/yw/SportsProfile";
import { NationalAwardProfileSection } from "@/components/yw/NationalAwardProfileSection";
import {
  NORMAL_PROFILE_MAIN_CATEGORIES,
  NORMAL_PROFILE_SUBCATEGORIES,
  SPORTS_CATALOGUE,
  SPORTS_PROFILE_ROLES,
  getNormalProfileCategoryMain,
} from "@/lib/profile-category";
import { SPORTS_COUNTRY_OPTIONS } from "@/lib/sports-country";

export type ProfileEdit = {
  name: string;
  username: string;
  country: string;
  countryChangeCount: number;
  countryLocked: boolean;
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
  sportsVerificationCountry,
  onVerificationSubmitted,
  onOpenSportsDetails,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  user: User;
  value: ProfileEdit;
  onSave: (v: ProfileEdit) => void | Promise<void>;
  sportsProfile?: SportsProfileInfo | null;
  sportsVerificationCountry?: string | null;
  onVerificationSubmitted?: () => void;
  onOpenSportsDetails?: () => void;
}) {
  const [draft, setDraft] = useState<ProfileEdit>(value);
  const [saving, setSaving] = useState(false);
  const [avatarCropFile, setAvatarCropFile] = useState<File | null>(null);
  const [categoryQuery, setCategoryQuery] = useState("");
  const [countryQuery, setCountryQuery] = useState("");
  const [countryOptionsOpen, setCountryOptionsOpen] = useState(false);
  const [expandedMainCategory, setExpandedMainCategory] = useState<string | null>(null);
  const [pendingSport, setPendingSport] = useState<string | null>(null);
  const [categoryOptionsOpen, setCategoryOptionsOpen] = useState(false);
  const avatarInput = useRef<HTMLInputElement>(null);
  const avatarPreviewUrl = useRef<string | null>(null);

  useEffect(() => {
    if (open) {
      setDraft(value);
      setCategoryQuery("");
      setCountryQuery("");
      setCountryOptionsOpen(false);
      setExpandedMainCategory(null);
      setPendingSport(null);
      setCategoryOptionsOpen(false);
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
  const countryIsFrozen =
    draft.countryLocked || Number(draft.countryChangeCount ?? 0) >= 1;
  const selectedCountry = SPORTS_COUNTRY_OPTIONS.find(
    (country) => country.name === draft.country,
  );
  const normalizedCountryQuery = countryQuery.trim().toLocaleLowerCase();
  const visibleCountries = SPORTS_COUNTRY_OPTIONS.filter(
    (country) =>
      !normalizedCountryQuery ||
      country.name.toLocaleLowerCase().includes(normalizedCountryQuery) ||
      country.code.toLocaleLowerCase().includes(normalizedCountryQuery),
  );
  const selectedMainCategories = selectedCategories.map(getNormalProfileCategoryMain);
  const normalizedQuery = categoryQuery.trim().toLowerCase();
  const sportsQueryMatchesRole = SPORTS_PROFILE_ROLES.some((role) =>
    role.toLowerCase().includes(normalizedQuery),
  );
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
    if (
      mainCategory === "Other" ||
      (mainCategory !== "Sports" &&
        NORMAL_PROFILE_SUBCATEGORIES[mainCategory as keyof typeof NORMAL_PROFILE_SUBCATEGORIES].length === 0)
    ) {
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

  const openCategoryOptions = () => {
    setCategoryOptionsOpen(true);
    setExpandedMainCategory(null);
    setPendingSport(null);
    setCategoryQuery("");
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

            <Field label="Country / Region">
              <div className="space-y-2">
                <button
                  type="button"
                  data-testid="button-profile-country"
                  aria-label="Select country or region"
                  aria-expanded={countryOptionsOpen}
                  disabled={countryIsFrozen}
                  onClick={() => {
                    setCountryOptionsOpen((open) => !open);
                    setCountryQuery("");
                  }}
                  className="flex h-11 w-full items-center gap-3 rounded-xl border border-border/60 bg-background/30 px-3 text-left text-sm transition-colors hover:border-foreground/25 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <span className="min-w-0 flex-1 truncate">
                    {selectedCountry
                      ? `${selectedCountry.flag}  ${selectedCountry.name}`
                      : draft.country || "Choose a country or region"}
                  </span>
                  {countryIsFrozen ? (
                    <LockKeyhole
                      className="h-4 w-4 shrink-0 text-muted-foreground"
                      aria-label="Country locked"
                    />
                  ) : (
                    <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
                  )}
                </button>
                {countryIsFrozen ? (
                  <p
                    data-testid="text-profile-country-locked"
                    className="text-[11px] leading-4 text-muted-foreground"
                  >
                    {draft.countryLocked
                      ? "Country is permanently locked after verification submission."
                      : "The one allowed country change has been used."}
                  </p>
                ) : null}
                {countryOptionsOpen && !countryIsFrozen ? (
                  <div
                    id="profile-country-options"
                    className="overflow-hidden rounded-2xl border border-border/60 bg-[#111114] shadow-xl"
                  >
                    <div className="relative border-b border-border/50 p-2">
                      <Search className="pointer-events-none absolute left-5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        autoFocus
                        value={countryQuery}
                        onChange={(event) => setCountryQuery(event.target.value)}
                        placeholder="Search countries"
                        aria-label="Search countries"
                        data-testid="input-profile-country-search"
                        className="h-9 rounded-xl border-border/60 bg-background/40 pl-9 text-xs"
                      />
                    </div>
                    <div
                      role="listbox"
                      aria-label="Countries"
                      className="max-h-56 overflow-y-auto p-1.5"
                    >
                      {visibleCountries.map((country) => (
                        <button
                          key={country.code}
                          type="button"
                          role="option"
                          aria-selected={draft.country === country.name}
                          data-testid={`option-profile-country-${country.code.toLowerCase()}`}
                          onClick={() => {
                            set("country", country.name);
                            setCountryOptionsOpen(false);
                            setCountryQuery("");
                          }}
                          className="flex min-h-9 w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-xs text-foreground transition-colors hover:bg-white/10"
                        >
                          <span aria-hidden="true" className="text-base leading-none">
                            {country.flag}
                          </span>
                          <span className="flex-1">{country.name}</span>
                          {draft.country === country.name ? (
                            <Check className="h-3.5 w-3.5 text-emerald-300" />
                          ) : null}
                        </button>
                      ))}
                      {visibleCountries.length === 0 ? (
                        <p className="px-2 py-4 text-center text-xs text-muted-foreground">
                          No countries found
                        </p>
                      ) : null}
                    </div>
                  </div>
                ) : null}
              </div>
            </Field>

            <Field label="Category">
              <div className="space-y-2.5">
                <p className="text-[11px] text-muted-foreground">
                  Choose up to 2 categories
                </p>
                <div
                  role="button"
                  tabIndex={0}
                  aria-label={categoryOptionsOpen ? "Category options open" : "Open category options"}
                  onClick={() => {
                    if (!categoryOptionsOpen) openCategoryOptions();
                  }}
                  onKeyDown={(event) => {
                    if (!categoryOptionsOpen && (event.key === "Enter" || event.key === " ")) {
                      event.preventDefault();
                      openCategoryOptions();
                    }
                  }}
                  className="rounded-2xl border border-border/60 bg-background/20 p-2 transition-colors hover:border-foreground/25"
                >
                  {selectedCategories.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {selectedCategories.map((category) => (
                        <button
                          key={category}
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            removeCategory(category);
                          }}
                          className="inline-flex items-center gap-1 rounded-full border border-foreground/15 bg-foreground/[0.09] px-2.5 py-1 text-[11px] font-semibold text-foreground transition-colors hover:bg-foreground/[0.14] active:scale-95"
                          aria-label={`Remove ${category}`}
                        >
                          {category}
                          <X className="h-3 w-3 text-muted-foreground" strokeWidth={2} />
                        </button>
                      ))}
                    </div>
                  ) : (
                    <p className="px-1 py-1 text-xs text-muted-foreground">
                      Tap to choose categories
                    </p>
                  )}
                </div>
                {categoryOptionsOpen ? (
                  <>
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
                                    sportsQueryMatchesRole ||
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
                  </>
                ) : null}
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

            <div
              className={`grid gap-3 ${
                sportsProfile && onOpenSportsDetails ? "grid-cols-2" : "grid-cols-1"
              }`}
              data-testid="row-profile-verification-cards"
            >
              {sportsProfile && onOpenSportsDetails ? (
                <SportsProfileCard
                  profile={sportsProfile}
                  onClick={onOpenSportsDetails}
                />
              ) : null}
              <NationalAwardProfileSection
                userId={user.id}
                sportsVerificationCountry={sportsVerificationCountry}
                onSubmitted={onVerificationSubmitted}
              />
            </div>
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
                  setCategoryOptionsOpen(false);
                  setExpandedMainCategory(null);
                  setPendingSport(null);
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