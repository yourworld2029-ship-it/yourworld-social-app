/** Native file-driver boundary: video bytes never pass through JS or base64. */
export type HlsFileDriver = {
  readText(url: string): Promise<string>;
  save(url: string, path: string): Promise<number>;
  writeText(path: string, text: string): Promise<void>;
  removeDirectory(path: string): Promise<void>;
};

export function selectHlsVariant(text: string) {
  const lines = text.split(/\r?\n/);
  const variants = lines.flatMap((line, index) => {
    if (!line.startsWith("#EXT-X-STREAM-INF:")) return [];
    const uri = lines.slice(index + 1).find((item) => item.trim() && !item.startsWith("#"));
    return uri ? [{ line, uri, bandwidth: Number(line.match(/(?:^|[:,])BANDWIDTH=(\d+)/)?.[1] ?? 0) }] : [];
  });
  return variants.sort((a, b) => b.bandwidth - a.bandwidth)[0] ?? null;
}

export async function downloadOfflineHls(url: string, localPlaylist: string, driver: HlsFileDriver,
  onProgress?: (bytes: number, total: number) => void) {
  const directory = `${localPlaylist}.assets`;
  const assets = new Map<string, string>();
  let bytes = 0;
  let count = 0;
  let playlistCount = 0;
  const resolve = (reference: string, base: string) => {
    const target = new URL(reference, base);
    if (!["https:", "http:"].includes(target.protocol)) throw new Error("Invalid playlist media URL.");
    return target.toString();
  };
  const saveAsset = async (reference: string, base: string) => {
    const target = resolve(reference, base);
    const existing = assets.get(target);
    if (existing) return existing;
    if (++count > 20_000) throw new Error("The offline video has too many segments.");
    const name = `asset-${count}`;
    const size = await driver.save(target, `${directory}/${name}`);
    if (size <= 0) throw new Error("A video segment was empty.");
    bytes += size;
    if (bytes > 512 * 1024 * 1024) throw new Error("This video exceeds the 512 MB offline limit.");
    assets.set(target, name);
    onProgress?.(bytes, 0);
    return name;
  };
  const playlist = async (remote: string, local: string, depth: number): Promise<void> => {
    if (depth > 4) throw new Error("The video playlist contains a recursive reference.");
    const text = await driver.readText(remote);
    if (text.length > 256 * 1024 || !text.trimStart().startsWith("#EXTM3U")) {
      throw new Error("The server did not return a valid video playlist.");
    }
    const variant = selectHlsVariant(text);
    if (variant) {
      const group = variant.line.match(/AUDIO="([^"]+)"/)?.[1];
      const audioLines = text.split(/\r?\n/).filter((line) =>
        line.startsWith("#EXT-X-MEDIA:") && line.includes('TYPE=AUDIO') &&
        (!group || line.includes(`GROUP-ID="${group}"`)));
      const output = ["#EXTM3U"];
      for (const [index, line] of audioLines.entries()) {
        const uri = line.match(/URI="([^"]+)"/)?.[1];
        if (!uri) { output.push(line); continue; }
        const name = `audio-${depth}-${index}-${++playlistCount}.m3u8`;
        await playlist(resolve(uri, remote), `${directory}/${name}`, depth + 1);
        const relative = local === localPlaylist ? `${localPlaylist.split("/").pop()}.assets/${name}` : name;
        output.push(line.replace(`URI="${uri}"`, `URI="${relative}"`));
      }
      const name = `video-${depth}-${++playlistCount}.m3u8`;
      await playlist(resolve(variant.uri, remote), `${directory}/${name}`, depth + 1);
      const relative = local === localPlaylist ? `${localPlaylist.split("/").pop()}.assets/${name}` : name;
      output.push(variant.line, relative);
      await driver.writeText(local, output.join("\n") + "\n");
      return;
    }
    if (!text.includes("#EXT-X-ENDLIST")) {
      throw new Error("Wait until this live broadcast ends before saving it offline.");
    }
    const output: string[] = [];
    for (const line of text.split(/\r?\n/)) {
      if (line.startsWith("#") && /URI="/.test(line)) {
        if (/METHOD=SAMPLE-AES|KEYFORMAT=/.test(line)) throw new Error("This encrypted stream does not support device downloads.");
        const uri = line.match(/URI="([^"]+)"/)?.[1];
        const name = uri ? await saveAsset(uri, remote) : null;
        const relative = local === localPlaylist ? `${localPlaylist.split("/").pop()}.assets/${name}` : name;
        output.push(uri && name ? line.replace(`URI="${uri}"`, `URI="${relative}"`) : line);
      } else if (line.trim() && !line.startsWith("#")) {
        const name = await saveAsset(line.trim(), remote);
        output.push(local === localPlaylist ? `${localPlaylist.split("/").pop()}.assets/${name}` : name);
      } else output.push(line);
    }
    if (!count) throw new Error("The video playlist has no media segments.");
    await driver.writeText(local, output.join("\n"));
  };
  try {
    await playlist(url, localPlaylist, 0);
    return bytes;
  } catch (error) {
    await driver.removeDirectory(directory).catch(() => undefined);
    throw error;
  }
}