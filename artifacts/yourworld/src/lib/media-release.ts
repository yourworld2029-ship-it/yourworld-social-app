/** Release network buffers and the decoder before React removes a list player. */
export function releaseListVideo(player: HTMLVideoElement | null) {
  if (!player) return;
  player.pause();
  player.preload = "none";
  player.setAttribute("src", "");
  player.removeAttribute("src");
  player.querySelectorAll("source").forEach((source) => source.removeAttribute("src"));
  player.load();
}