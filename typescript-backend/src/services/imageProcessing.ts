import sharp from 'sharp';

const MAX_WIDTH_1080P = 1920;
const MAX_HEIGHT_1080P = 1080;

type OutputFormat = 'jpeg' | 'png' | 'webp';

interface ResolvedOutputFormat {
  format: OutputFormat;
  contentType: string;
  extension: string;
}

export interface ProcessedImage {
  buffer: Buffer;
  contentType: string;
  filename: string;
  width: number;
  height: number;
}

function resolveOutputFormat(contentType: string): ResolvedOutputFormat {
  const normalized = contentType.trim().toLowerCase();

  if (normalized === 'image/png') {
    return { format: 'png', contentType: 'image/png', extension: 'png' };
  }

  if (normalized === 'image/webp') {
    return { format: 'webp', contentType: 'image/webp', extension: 'webp' };
  }

  return { format: 'jpeg', contentType: 'image/jpeg', extension: 'jpg' };
}

function replaceFilenameExtension(filename: string, extension: string): string {
  const cleaned = filename.trim();
  if (!cleaned) {
    return `leaf-image.${extension}`;
  }

  const dotIndex = cleaned.lastIndexOf('.');
  if (dotIndex <= 0) {
    return `${cleaned}.${extension}`;
  }

  return `${cleaned.slice(0, dotIndex)}.${extension}`;
}

async function resizeTo1080p(source: sharp.Sharp, output: ResolvedOutputFormat): Promise<{ data: Buffer; width: number; height: number }> {
  const pipeline = source.rotate().resize({
    width: MAX_WIDTH_1080P,
    height: MAX_HEIGHT_1080P,
    fit: 'inside',
    withoutEnlargement: true
  });

  if (output.format === 'png') {
    const { data, info } = await pipeline.png({ compressionLevel: 9 }).toBuffer({ resolveWithObject: true });
    return { data, width: info.width ?? 0, height: info.height ?? 0 };
  }

  if (output.format === 'webp') {
    const { data, info } = await pipeline.webp({ quality: 86 }).toBuffer({ resolveWithObject: true });
    return { data, width: info.width ?? 0, height: info.height ?? 0 };
  }

  const { data, info } = await pipeline.jpeg({ quality: 86, mozjpeg: true }).toBuffer({ resolveWithObject: true });
  return { data, width: info.width ?? 0, height: info.height ?? 0 };
}

export async function normalizeImageBufferTo1080p(params: {
  image: Buffer;
  contentType: string;
  filename: string;
}): Promise<ProcessedImage> {
  const output = resolveOutputFormat(params.contentType);
  const normalizedFilename = replaceFilenameExtension(params.filename, output.extension);
  const resized = await resizeTo1080p(sharp(params.image), output);

  return {
    buffer: resized.data,
    contentType: output.contentType,
    filename: normalizedFilename,
    width: resized.width,
    height: resized.height
  };
}

export async function normalizeImageFileTo1080p(params: {
  filePath: string;
  contentType: string;
  filename: string;
}): Promise<ProcessedImage> {
  const output = resolveOutputFormat(params.contentType);
  const normalizedFilename = replaceFilenameExtension(params.filename, output.extension);
  const resized = await resizeTo1080p(sharp(params.filePath), output);

  return {
    buffer: resized.data,
    contentType: output.contentType,
    filename: normalizedFilename,
    width: resized.width,
    height: resized.height
  };
}
