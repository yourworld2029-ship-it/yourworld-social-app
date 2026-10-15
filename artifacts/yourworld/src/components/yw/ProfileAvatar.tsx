import { useEffect, useState } from "react";
import { resolveMediaUrl } from "@/lib/social-data";

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
  const [resolvedUrl, setResolvedUrl] = useState("");

  useEffect(() => {
    let current = true;
    setImageFailed(false);
    setResolvedUrl("");
    if (!imgUrl) return () => { current = false; };

    void resolveMediaUrl(imgUrl, "avatars")
      .then((url) => {
        if (current) setResolvedUrl(url);
      })
      .catch(() => {
        if (current) setResolvedUrl(imgUrl);
      });

    return () => {
      current = false;
    };
  }, [imgUrl]);

  if (!resolvedUrl || imageFailed) {
    return (
      <span className="text-white font-semibold text-base flex h-full w-full items-center justify-center">
        {initial}
      </span>
    );
  }

  return (
    <img
      src={resolvedUrl}
      alt=""
      loading="lazy"
      decoding="async"
      data-testid="profile-avatar"
      className="block h-full w-full rounded-full object-cover"
      onError={(event) => {
        event.currentTarget.style.display = "none";
        setImageFailed(true);
      }}
    />
  );
}