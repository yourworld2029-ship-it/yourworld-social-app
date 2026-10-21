import { validateVerificationDocumentFile, VERIFICATION_DOCUMENT_SIZE_ERROR } from "@/lib/verification-upload-rules";

export function validateCoachDiplomaSelection(files: readonly File[]) {
  if (files.length === 0) {
    throw new Error("Choose one multi-page PDF or up to two JPG/PNG images.");
  }
  if (files.length > 2) {
    throw new Error("Select at most two images, or choose one multi-page PDF.");
  }

  const mimeTypes = files.map(validateVerificationDocumentFile);
  if (files.length === 1) return "single" as const;
  if (mimeTypes.every((mimeType) => mimeType === "image/jpeg" || mimeType === "image/png")) {
    return "image-pair" as const;
  }

  throw new Error("Choose one multi-page PDF or up to two JPG/PNG images, not a mixture.");
}

function readImageAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    if (typeof FileReader === "undefined") {
      reject(new Error("Image conversion is unavailable here. Choose a PDF instead."));
      return;
    }

    const reader = new FileReader();
    reader.onerror = () => reject(new Error(`Could not read ${file.name}.`));
    reader.onload = () => {
      if (typeof reader.result !== "string") {
        reject(new Error(`Could not read ${file.name}.`));
        return;
      }
      resolve(reader.result);
    };
    reader.readAsDataURL(file);
  });
}

export async function prepareCoachDiplomaUpload(files: readonly File[]): Promise<File> {
  const selectionType = validateCoachDiplomaSelection(files);
  if (selectionType === "single") return files[0];

  const [{ jsPDF }, imageDataUrls] = await Promise.all([
    import("jspdf"),
    Promise.all(files.map(readImageAsDataUrl)),
  ]);
  const imageProbe = new jsPDF({ unit: "pt", format: "a4" });
  const images = imageDataUrls.map((dataUrl) => ({
    dataUrl,
    properties: imageProbe.getImageProperties(dataUrl),
  }));
  const orientationFor = (image: (typeof images)[number]) =>
    image.properties.width > image.properties.height ? "landscape" : "portrait";
  const pdf = new jsPDF({
    orientation: orientationFor(images[0]),
    unit: "pt",
    format: "a4",
    compress: true,
  });

  images.forEach((image, index) => {
    const orientation = orientationFor(image);
    if (index > 0) pdf.addPage("a4", orientation);
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 18;
    const scale = Math.min(
      (pageWidth - margin * 2) / image.properties.width,
      (pageHeight - margin * 2) / image.properties.height,
    );
    const width = image.properties.width * scale;
    const height = image.properties.height * scale;
    const imageType = image.properties.fileType === "PNG" ? "PNG" : "JPEG";
    pdf.addImage(
      image.dataUrl,
      imageType,
      (pageWidth - width) / 2,
      (pageHeight - height) / 2,
      width,
      height,
      undefined,
      "FAST",
    );
  });

  const combinedPdf = pdf.output("blob");
  if (combinedPdf.size > 10 * 1024 * 1024) throw new Error(VERIFICATION_DOCUMENT_SIZE_ERROR);

  const file = new File([combinedPdf], "coaching-diploma-front-back.pdf", {
    type: "application/pdf",
  });
  validateVerificationDocumentFile(file);
  return file;
}
