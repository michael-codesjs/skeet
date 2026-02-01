import ffmpeg from 'fluent-ffmpeg';
import * as path from 'path';

/**
 * Extracts audio from a video file.
 * Returns the path to the generated audio file.
 */
export const extractAudio = (inputPath: string, outputDir: string, id: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const outputPath = path.join(outputDir, `${id}-audio.mp3`);

    ffmpeg(inputPath)
      .noVideo()
      .audioCodec('libmp3lame')
      .output(outputPath)
      .on('end', () => resolve(outputPath))
      .on('error', (err) => reject(err))
      .run();
  });
};

/**
 * Extracts video (removes audio) from a video file.
 * Returns the path to the generated video-only file.
 */
export const removeAudio = (inputPath: string, outputDir: string, id: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const outputPath = path.join(outputDir, `${id}-video-only.mp4`);

    ffmpeg(inputPath)
      .noAudio()
      .videoCodec('copy') // Fast copy, no re-encoding
      .output(outputPath)
      .on('end', () => resolve(outputPath))
      .on('error', (err) => reject(err))
      .run();
  });
};

/**
 * Generates a lower quality 720p proxy video.
 * Returns the path to the generated proxy file.
 */
export const generateVideoProxy = (
  inputPath: string,
  outputDir: string,
  id: string,
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const outputPath = path.join(outputDir, `${id}-proxy.mp4`);

    ffmpeg(inputPath)
      .size('1280x?') // Scale to 720p (width 1280, height auto)
      .videoCodec('libx264')
      .audioCodec('aac')
      .outputOptions([
        '-crf 23', // Balance quality/size
        '-preset fast', // Faster encoding
        '-movflags +faststart', // Enable streaming
      ])
      .output(outputPath)
      .on('end', () => resolve(outputPath))
      .on('error', (err) => reject(err))
      .run();
  });
};
/**
 * Extracts metadata (duration, resolution, etc.) from a media file.
 */
export const extractMetadata = (inputPath: string): Promise<{ duration: number }> => {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(inputPath, (err, metadata) => {
      if (err) return reject(err);
      const duration = metadata.format.duration || 0;
      resolve({ duration });
    });
  });
};
