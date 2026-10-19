import { useEffect, useState } from "react";
import { ExternalLink, FileText } from "lucide-react";

export function PrivateEvidencePreview({
  path,
  name,
  mimeType,
  getSignedUrl,
  testId,
}: {
  path: string;
  name: string;
  mimeType: string;
  getSignedUrl: (path: string) => Promise<string>;
  testId?: string;
}) {
  const [url, setUrl] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let active = true;
    setUrl(null);
    setFailed(false);
    void getSignedUrl(path)
      .then((signedUrl) => {
        if (active) setUrl(signedUrl);
      })
      .catch(() => {
        if (active) setFailed(true);
      });
    return () => {
      active = false;
    };
  }, [getSignedUrl, path]);

  return (
    <div
      data-testid={testId}
      className="mt-3 w-full basis-full overflow-hidden rounded-xl border border-white/10 bg-black/20"
    >
      {!url ? (
        <div className="flex min-h-20 items-center gap-2 px-3 py-2 text-xs text-zinc-400">
          <FileText className="h-4 w-4 shrink-0 text-amber-200" />
          {failed ? "Preview unavailable" : "Loading file preview…"}
        </div>
      ) : mimeType.startsWith("image/") ? (
        <img
          src={url}
          alt={`${name} preview`}
          className="max-h-56 w-full object-contain"
          loading="lazy"
        />
      ) : mimeType === "application/pdf" ? (
        <iframe
          title={`${name} preview`}
          src={url}
          className="h-56 w-full bg-white"
          loading="lazy"
        />
      ) : (
        <div className="flex min-h-20 items-center gap-2 px-3 py-2 text-xs text-zinc-300">
          <FileText className="h-4 w-4 shrink-0 text-amber-200" />
          {name}
        </div>
      )}
      {url ? (
        <a
          href={url}
          target="_blank"
          rel="noreferrer"
          className="flex items-center justify-center gap-1 border-t border-white/10 px-3 py-2 text-xs font-medium text-amber-100"
        >
          Open file <ExternalLink className="h-3 w-3" />
        </a>
      ) : null}
    </div>
  );
}
