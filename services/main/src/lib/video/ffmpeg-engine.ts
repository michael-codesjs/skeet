import ffmpeg from 'fluent-ffmpeg';
import { Readable } from 'stream';

export type FilterComplex = {
  filter: string;
  inputs?: string | string[];
  outputs?: string | string[];
  options?: Record<string, any>;
};

export type EngineOptions = {
  width?: number;
  height?: number;
  fps?: number;
  audioRate?: number;
  crf?: number;
  preset?: string;
};

/**
 * Skeet FFmpeg Engine
 * A modular wrapper around fluent-ffmpeg designed for complex timeline assembly.
 */
export class FFmpegEngine {
  private command: ffmpeg.FfmpegCommand;
  private inputs: string[] = [];
  private filterGraph: FilterComplex[] = [];
  private maps: string[] = [];
  private options: Required<EngineOptions>;

  constructor(opts: EngineOptions = {}) {
    this.command = ffmpeg();
    this.options = {
      width: opts.width || 1080,
      height: opts.height || 1920, // Default to vertical for social media
      fps: opts.fps || 30,
      audioRate: opts.audioRate || 44100,
      crf: opts.crf || 23,
      preset: opts.preset || 'medium',
    };
  }

  /**
   * Adds an input source to the command.
   * Returns the input index ([0], [1], etc.)
   */
  public addInput(source: string | Readable, options: string[] = []): string {
    const index = this.inputs.length;
    this.command.input(source);
    if (options.length > 0) {
      this.command.inputOptions(options);
    }
    this.inputs.push(typeof source === 'string' ? source : `stream_${index}`);
    return `${index}:v`;
  }

  /**
   * Adds a filter to the complex filter graph.
   */
  public addFilter(filter: FilterComplex) {
    this.filterGraph.push(filter);
    return this;
  }

  /**
   * Chains multiple filters together.
   */
  public addFilters(filters: FilterComplex[]) {
    this.filterGraph.push(...filters);
    return this;
  }

  /**
   * Adds a mapping for the output (e.g., "[vfinal]")
   */
  public addMap(label: string) {
    const formattedLabel = label.startsWith('[') ? label : `[${label}]`;
    this.command.map(formattedLabel);
    return this;
  }

  /**
   * Sets up global output parameters (codecs, encoding settings).
   */
  private applyGlobalSettings() {
    this.command
      .videoCodec('libx264')
      .audioCodec('aac')
      .audioFrequency(this.options.audioRate)
      .outputOptions([
        `-crf ${this.options.crf}`,
        `-preset ${this.options.preset}`,
        '-movflags +faststart', // For web/mobile playback optimization
        '-pix_fmt yuv420p', // Widest compatibility
      ])
      .fps(this.options.fps);

    if (this.filterGraph.length > 0) {
      this.command.complexFilter(this.filterGraph);
    }
  }

  /**
   * Renders the project to a file.
   */
  public async render(outputPath: string): Promise<string> {
    return new Promise((resolve, reject) => {
      this.applyGlobalSettings();

      this.command
        .on('start', (cmd) => {
          console.log('[FFmpeg Engine] Spawned with command:', cmd);
        })
        .on('progress', (progress) => {
          console.log(`[FFmpeg Engine] Rendering: ${progress.percent?.toFixed(2)}% done`);
        })
        .on('error', (err, stdout, stderr) => {
          console.error('[FFmpeg Engine] Error:', err.message);
          console.error('[FFmpeg Engine] Stderr:', stderr);
          reject(err);
        })
        .on('end', () => {
          console.log('[FFmpeg Engine] Render complete:', outputPath);
          resolve(outputPath);
        })
        .save(outputPath);
    });
  }

  /**
   * Renders the project to a stream (useful for direct S3 uploads).
   */
  public renderToStream(format: string = 'mp4'): Readable {
    this.applyGlobalSettings();
    return this.command.format(format).pipe() as Readable;
  }

  /**
   * Helper to generate a standardized input label like [v0] or [a1]
   */
  public static getLabel(index: number, type: 'v' | 'a' = 'v'): string {
    return `${index}:${type}`;
  }
}
