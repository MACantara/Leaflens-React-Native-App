import sharp from 'sharp';

const MAX_WIDTH_1080P = 1920;
const MAX_HEIGHT_1080P = 1080;

const WEBP_CONTENT_TYPE = 'image/webp';
const WEBP_EXTENSION = 'webp';

export interface ProcessedImage {
  buffer: Buffer;
  contentType: string;
  filename: string;
  width: number;
  height: number;
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

async function resizeTo1080pAsWebp(source: sharp.Sharp): Promise<{ data: Buffer; width: number; height: number }> {
  const pipeline = source.rotate().resize({
    width: MAX_WIDTH_1080P,
    height: MAX_HEIGHT_1080P,
    fit: 'inside',
    withoutEnlargement: true
  });

  const { data, info } = await pipeline.webp({ quality: 86 }).toBuffer({ resolveWithObject: true });
  return { data, width: info.width ?? 0, height: info.height ?? 0 };
}

export async function normalizeImageBufferTo1080p(params: {
  image: Buffer;
  contentType: string;
  filename: string;
}): Promise<ProcessedImage> {
  const normalizedFilename = replaceFilenameExtension(params.filename, WEBP_EXTENSION);
  const resized = await resizeTo1080pAsWebp(sharp(params.image));

  return {
    buffer: resized.data,
    contentType: WEBP_CONTENT_TYPE,
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
  const normalizedFilename = replaceFilenameExtension(params.filename, WEBP_EXTENSION);
  const resized = await resizeTo1080pAsWebp(sharp(params.filePath));

  return {
    buffer: resized.data,
    contentType: WEBP_CONTENT_TYPE,
    filename: normalizedFilename,
    width: resized.width,
    height: resized.height
  };
}
