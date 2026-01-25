import { spawn } from 'child_process';
import ffmpeg from 'fluent-ffmpeg';
import { TimeSeriesData } from './types/manifest';

/**
 * Extracts deep frame-level metrics:
 * 1. SignalStats (YAVG, UAVG, VAVG, SATAVG) for color/light.
 * 2. Motion Vectors (Flow Dx, Flow Dy) for topological matching.
 * 3. Audio Energy (astats).
 */
export async function extractFfmpegStats(filePath: string): Promise<TimeSeriesData[]> {
  console.log('[Analyzer] Starting Deep Signal Extraction...');

  // 1. Parallel Execution: Video Stats, Audio Stats, Motion Vectors
  // We split them to avoid complex filtergraph crashes (like connecting video to audio filters).

  const [videoData, audioData, motionData] = await Promise.all([
    runVideoSignalStats(filePath),
    runAudioStats(filePath),
    runMotionVectors(filePath),
  ]);

  // Merge datasets
  // We align primarily on Video Frames (signalData).
  // Audio packets might differ in count, so we'll just sample/stretch or clamp index.
  // Motion frames should match Video frames 1:1.

  const merged: TimeSeriesData[] = [];
  const len = videoData.length;

  for (let i = 0; i < len; i++) {
    const v = videoData[i];
    // Use motion data if available, else zero
    const m = motionData[i] || { dx: 0, dy: 0, magnitude: 0 };
    // Align audio: map video frame index to audio frame index roughly
    // Assuming both are roughly linear in time.
    // Better: find audio frame with closest timestamp.

    // Simple look-up based on timestamp if possible, or just index scaling if rates differ.
    // For MVP, just clamp index.
    const aIndex = Math.min(Math.floor(i * (audioData.length / len)), audioData.length - 1);
    const a = audioData[aIndex] || { energy: 0 };

    // Refined alignment using timestamp
    // const a = audioData.find(...) // too slow for O(N^2)

    merged.push({
      timestamp: v.time,
      motionScore: m.magnitude,
      flowDx: m.dx,
      flowDy: m.dy,
      audioEnergy: a.energy,
      istransient: a.energy > 0.8,
      luminance: v.yavg,
      colorBalance: {
        u: v.uavg,
        v: v.vavg,
      },
      saturation: v.satavg,
    });
  }

  return merged;
}

interface RawVideoFrame {
  time: number;
  yavg: number;
  uavg: number;
  vavg: number;
  satavg: number;
}

async function runVideoSignalStats(filePath: string): Promise<RawVideoFrame[]> {
  return new Promise((resolve, reject) => {
    // [0:v]signalstats,metadata=print:file=-
    const results: RawVideoFrame[] = [];

    const args = [
      '-i',
      filePath,
      '-filter_complex',
      'signalstats,metadata=print:file=-',
      '-f',
      'null',
      '-',
    ];

    const cmd = spawn('ffmpeg', args);

    let buffer = '';
    cmd.stdout.on('data', (data) => {
      buffer += data.toString();
    });

    cmd.on('close', (code) => {
      // Code 0 is success. Sometimes ffmpeg returns non-zero on partial reads, but we check if we got data.
      // If code is non-zero, check if we have results.

      const lines = buffer.split('\n');
      let currentFrame: Partial<RawVideoFrame> = {};

      for (const line of lines) {
        const trimmed = line.trim();

        if (trimmed.startsWith('frame:')) {
          if (currentFrame.time !== undefined) {
            results.push(currentFrame as RawVideoFrame);
          }
          currentFrame = { yavg: 0, uavg: 128, vavg: 128, satavg: 0 };
        }

        if (trimmed.startsWith('pts_time:')) {
          currentFrame.time = parseFloat(trimmed.split(':')[1]);
        }

        if (trimmed.includes('signalstats.YAVG='))
          currentFrame.yavg = parseFloat(trimmed.split('=')[1]);
        if (trimmed.includes('signalstats.UAVG='))
          currentFrame.uavg = parseFloat(trimmed.split('=')[1]);
        if (trimmed.includes('signalstats.VAVG='))
          currentFrame.vavg = parseFloat(trimmed.split('=')[1]);
        if (trimmed.includes('signalstats.SATAVG='))
          currentFrame.satavg = parseFloat(trimmed.split('=')[1]);
      }
      if (currentFrame.time !== undefined) results.push(currentFrame as RawVideoFrame);

      if (results.length === 0 && code !== 0) {
        // Verify if it was just audio? No, we expect video.
        // Resolving empty so we don't crash the whole pipeline, but logging error.
        console.error(`[Analyzer] Video stats failed with code ${code}`);
      }

      resolve(results);
    });

    cmd.on('error', (err) => reject(err));
  });
}

interface RawAudioFrame {
  time: number;
  energy: number;
}

async function runAudioStats(filePath: string): Promise<RawAudioFrame[]> {
  return new Promise((resolve, reject) => {
    // [0:a]astats=metadata=1:reset=1,metadata=print:file=-
    const results: RawAudioFrame[] = [];

    const args = [
      '-i',
      filePath,
      '-filter_complex',
      'astats=metadata=1:reset=1,metadata=print:file=-',
      '-f',
      'null',
      '-',
    ];

    const cmd = spawn('ffmpeg', args);

    let buffer = '';
    cmd.stdout.on('data', (data) => (buffer += data.toString()));

    cmd.on('close', (code) => {
      // Parse output
      const lines = buffer.split('\n');
      let currentFrame: Partial<RawAudioFrame> = {};

      for (const line of lines) {
        const trimmed = line.trim();

        // Audio doesn't always start with 'frame:', astats might output 'frame:' too but for audio frames, or just samples
        // Usually `metadata=print` prints `frame:X`
        if (trimmed.startsWith('frame:')) {
          if (currentFrame.time !== undefined) results.push(currentFrame as RawAudioFrame);
          currentFrame = { energy: 0 };
        }
        if (trimmed.startsWith('pts_time:')) {
          currentFrame.time = parseFloat(trimmed.split(':')[1]);
        }
        if (trimmed.includes('astats.Overall.RMS_level=')) {
          // RMS level is usually negative dB. We want 0-1 energy.
          // -60dB (silent) to 0dB (loud).
          const db = parseFloat(trimmed.split('=')[1]);
          // Normalize: (db + 60) / 60, clamped 0..1
          let energy = (db + 60) / 60;
          if (energy < 0) energy = 0;
          if (energy > 1) energy = 1;
          currentFrame.energy = energy;
        }
      }
      if (currentFrame.time !== undefined) results.push(currentFrame as RawAudioFrame);
      resolve(results);
    });

    cmd.on('error', (err) => {
      // Audio might fail if no audio stream. Resolve empty.
      console.log('[Analyzer] Audio extraction failed (no audio?), returning silence.');
      resolve([]);
    });
  });
}

interface RawMotionFrame {
  dx: number;
  dy: number;
  magnitude: number;
}

async function runMotionVectors(filePath: string): Promise<RawMotionFrame[]> {
  return new Promise((resolve, reject) => {
    // ffprobe -flags2 +export_mvs -show_frames -show_entries frame=side_data_list -print_format json

    const args = [
      '-v',
      'quiet',
      '-flags2',
      '+export_mvs',
      '-show_frames',
      '-show_entries',
      'frame=pkt_pts_time,side_data_list',
      '-print_format',
      'json',
      filePath,
    ];

    const cmd = spawn('ffprobe', args);

    let jsonBuffer = '';
    cmd.stdout.on('data', (data) => (jsonBuffer += data.toString()));

    cmd.on('close', (code) => {
      if (code !== 0) return reject(new Error(`MotionVectors exited with code ${code}`));

      try {
        const data = JSON.parse(jsonBuffer);
        const frames = data.frames || [];

        const metrics: RawMotionFrame[] = frames.map((f: any) => {
          let totalDx = 0;
          let totalDy = 0;
          let count = 0;

          if (f.side_data_list) {
            for (const sd of f.side_data_list) {
              if (sd.side_data_type === 'Motion vectors' && sd.motion_vectors) {
                for (const mv of sd.motion_vectors) {
                  // source < 0 means it's predicted from past?
                  // We just want flow.
                  if (mv.dst_x !== undefined && mv.src_x !== undefined) {
                    totalDx += mv.dst_x - mv.src_x;
                    totalDy += mv.dst_y - mv.src_y;
                    count++;
                  }
                }
              }
            }
          }

          const avgDx = count > 0 ? totalDx / count : 0;
          const avgDy = count > 0 ? totalDy / count : 0;
          const mag = Math.sqrt(avgDx * avgDx + avgDy * avgDy);

          // Normalize Magnitude to 0..1 range roughly (assuming max motion ~20px/frame is high)
          const normMag = Math.min(mag / 20, 1.0);

          return {
            dx: avgDx,
            dy: avgDy,
            magnitude: normMag,
          };
        });

        resolve(metrics);
      } catch (err) {
        reject(err);
      }
    });

    cmd.on('error', (err) => reject(err));
  });
}

/**
 * Creates a lightweight proxy version of the video for AI analysis.
 * Target: 720p, 15fps, ~1.5Mbps
 */
export async function createProxyVideo(inputPath: string): Promise<string> {
  // Output to same dir with _proxy suffix
  const outputPath = inputPath.replace(/(\.[\w\d]+)$/, '_proxy.mp4');

  return new Promise((resolve, reject) => {
    // Check if proxy already exists?
    // For now, always recreate to ensure specs.

    // fluent-ffmpeg command
    ffmpeg(inputPath)
      .size('720x?') // 720p height, auto width
      .fps(15)
      .videoBitrate('1500k')
      .outputOptions([
        '-c:v libx264',
        '-preset fast', // Speed over compression
        '-an', // Remove audio to save tokens? Or keep it?
        // User asked for "rhythmic" editing, so maybe keeping audio is safer for the model to see beats?
        // But usually Vision models rely on visuals.
        // Let's Keep Audio but low quality.
        '-c:a aac',
        '-b:a 64k',
      ])
      .output(outputPath)
      .on('end', () => resolve(outputPath))
      .on('error', (err) => reject(err))
      .run();
  });
}
