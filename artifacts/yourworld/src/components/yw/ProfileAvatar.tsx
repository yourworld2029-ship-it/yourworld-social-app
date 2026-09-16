import { useEffect, useState } from "react";
import { ProfilePhotoViewer } from "@/components/yw/ProfilePhotoViewer";

export type ProfileAvatarUser = {
  full_name?: string | null;
  username?: string | null;
  avatar_url?: string | null;
  profile_pic?: string | null;
  profile_image?: string | null;
};

export function ProfileAvatar({ user }: { user?: ProfileAvatarUser | null }) {
  const imgUrl =
    [user?.avatar_url, user?.profile_pic, user?.profile_image]
      .map((value) => value?.trim())
      .find(Boolean) ?? "";
  const initial =
    (user?.full_name || user?.username || "U").trim().charAt(0).toUpperCase() || "U";
  const [imageFailed, setImageFailed] = useState(false);

  useEffect(() => {
    setImageFailed(false);
  }, [imgUrl]);

  if (!imgUrl || imageFailed) {
    return (
      <span className="text-white font-semibold text-base flex h-full w-full items-center justify-center">
        {initial}
      </span>
    );
  }

  return (
    <ProfilePhotoViewer
      src={imgUrl}
      alt=""
      stopPropagation
      className="h-full w-full rounded-full"
      imageClassName="rounded-full"
      testId="profile-avatar"
      onImageError={(event) => {
        event.currentTarget.style.display = "none";
        setImageFailed(true);
      }}
    />
  );
}