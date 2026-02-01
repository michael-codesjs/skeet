import ffmpeg from 'fluent-ffmpeg';
import * as os from 'os';
import * as path from 'path';

/**
 * Generates a thumbnail from a local video file.
 *
 * @param videoPath Local path to the video file
 * @param mediaId ID of the media (used for naming the temp thumbnail)
 * @returns Local path to the generated thumbnail
 */
export const generateThumbnail = async (videoPath: string, mediaId: string): Promise<string> => {
  const tempDir = os.tmpdir();
  const thumbPath = path.join(tempDir, `${mediaId}-thumb.jpg`);

  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(videoPath, (err, metadata) => {
      if (err) {
        reject(err);
        return;
      }

      const duration = metadata.format.duration || 10;
      const seekTime = Math.max(1, duration * 0.1); // Seek to 10% or 1s

      ffmpeg(videoPath)
        .screenshots({
          timestamps: [seekTime],
          filename: path.basename(thumbPath),
          folder: path.dirname(thumbPath),
        })
        .outputOptions(['-q:v 2']) // High quality JPEG
        .on('end', () => resolve(thumbPath))
        .on('error', reject);
    });
  });
};
