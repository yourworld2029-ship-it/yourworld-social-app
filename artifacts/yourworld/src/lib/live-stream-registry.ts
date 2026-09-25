let pendingStream: MediaStream | null = null;

export function handOffLiveStream(stream: MediaStream) {
  if (pendingStream && pendingStream !== stream) {
    pendingStream.getTracks().forEach((track) => track.stop());
  }
  pendingStream = stream;
}

export function takeHandedOffLiveStream() {
  const stream = pendingStream;
  pendingStream = null;
  return stream;
}

export function discardHandedOffLiveStream() {
  pendingStream?.getTracks().forEach((track) => track.stop());
  pendingStream = null;
}