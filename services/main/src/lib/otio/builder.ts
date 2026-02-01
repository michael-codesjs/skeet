import { getPrisma } from '@/context';

interface EditOperation {
  type: 'APPEND' | 'INSERT' | 'OVERLAY' | 'TRIM' | 'EFFECT';
  mediaId: string;
  trackId?: number;
  sourceStartTime?: number;
  sourceDuration?: number;
  timelineStartTime?: number;
  newDuration?: number;
  effectType?: string;
  parameters?: Record<string, any>;
  duration?: number;
}

interface RationalTime {
  OTIO_SCHEMA: 'RationalTime';
  value: number;
  rate: number;
}

interface TimeRange {
  OTIO_SCHEMA: 'TimeRange.1';
  start_time: RationalTime;
  duration: RationalTime;
}

interface MediaReference {
  OTIO_SCHEMA: string;
  name: string;
  available_range: TimeRange;
  target_url: string;
  metadata: Record<string, any>;
}

interface Clip {
  OTIO_SCHEMA: 'Clip.1';
  name: string;
  source_range: TimeRange;
  media_reference: MediaReference;
  metadata: Record<string, any>;
  effects?: any[];
}

interface Gap {
  OTIO_SCHEMA: 'Gap.1';
  name: string;
  source_range: TimeRange;
  effects: any[];
  markers: any[];
  metadata: Record<string, any>;
}

type TrackChild = Clip | Gap;

interface Track {
  OTIO_SCHEMA: string;
  name: string;
  children: TrackChild[];
  kind: 'Video' | 'Audio';
  metadata: Record<string, any>;
}

interface Timeline {
  OTIO_SCHEMA: string;
  name: string;
  tracks: {
    OTIO_SCHEMA: string;
    name: string;
    children: Track[];
  };
  metadata: Record<string, any>;
}

const FRAME_RATE = 24; // Standard frame rate

function createRationalTime(seconds: number, rate: number = FRAME_RATE): RationalTime {
  return {
    OTIO_SCHEMA: 'RationalTime',
    value: Math.round(seconds * rate),
    rate,
  };
}

function createTimeRange(startSeconds: number, durationSeconds: number): TimeRange {
  return {
    OTIO_SCHEMA: 'TimeRange.1',
    start_time: createRationalTime(startSeconds),
    duration: createRationalTime(durationSeconds),
  };
}

function createGap(durationSeconds: number): Gap {
  return {
    OTIO_SCHEMA: 'Gap.1',
    name: 'Gap',
    source_range: createTimeRange(0, durationSeconds),
    effects: [],
    markers: [],
    metadata: {},
  };
}

function getTrackDuration(track: Track): number {
  return track.children.reduce((acc, child) => {
    return acc + child.source_range.duration.value / child.source_range.duration.rate;
  }, 0);
}

/**
 * Builds an OTIO timeline from edit operations
 */
export async function buildOTIOFromOperations(
  operations: EditOperation[],
  projectId: string,
): Promise<Timeline> {
  const prisma = getPrisma();

  // 1. Fetch existing project to get current timeline state
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { otio: true },
  });

  // 2. Initialize or Load timeline
  let timeline: Timeline;

  if (project?.otio && (project.otio as any).OTIO_SCHEMA === 'Timeline.1') {
    timeline = project.otio as unknown as Timeline;
    console.log(`[OTIO Builder] 📥 Loaded existing timeline for ${projectId}`);
  } else {
    timeline = {
      OTIO_SCHEMA: 'Timeline.1',
      name: 'Skeet Edit',
      tracks: {
        OTIO_SCHEMA: 'Stack.1',
        name: 'tracks',
        children: [
          {
            OTIO_SCHEMA: 'Track.1',
            name: 'Main Video', // Track 0
            children: [],
            kind: 'Video',
            metadata: {},
          },
          {
            OTIO_SCHEMA: 'Track.1',
            name: 'Main Audio', // Track 1
            children: [],
            kind: 'Audio',
            metadata: {},
          },
        ],
      },
      metadata: {
        createdBy: 'Skeet AI Editor',
        createdAt: new Date().toISOString(),
      },
    };
    console.log(`[OTIO Builder] 🆕 Created new timeline for ${projectId}`);
  }

  // 3. Fetch all media referenced in operations
  const mediaIds = [...new Set(operations.map((op) => op.mediaId))];
  const mediaRecords = await prisma.media.findMany({
    where: {
      id: { in: mediaIds },
      projectId,
    },
    select: {
      id: true,
      fileName: true,
      duration: true,
      s3Key: true,
      proxyUrl: true,
    },
  });

  const mediaMap = new Map(mediaRecords.map((m) => [m.id, m]));

  // 4. Process operations
  for (const operation of operations) {
    const media = mediaMap.get(operation.mediaId);
    if (!media) {
      console.warn(`[OTIO Builder] Media ${operation.mediaId} not found, skipping operation`);
      continue;
    }

    const sourceStart = operation.sourceStartTime || 0;
    const sourceDuration = operation.sourceDuration || media.duration || 0;

    // Create the Clip Object
    const clip: Clip = {
      OTIO_SCHEMA: 'Clip.1',
      name: media.fileName,
      source_range: createTimeRange(sourceStart, sourceDuration),
      media_reference: {
        OTIO_SCHEMA: 'ExternalReference.1',
        name: media.fileName,
        available_range: createTimeRange(0, media.duration || 0),
        target_url: '',
        metadata: {
          mediaId: media.id,
          s3Key: media.s3Key,
          proxyS3Key: media.proxyUrl,
        },
      },
      metadata: {
        mediaId: media.id,
      },
    };

    // Determine intended track
    // If not provided, default to 0 (Video)
    let trackIndex = operation.trackId ?? 0;

    // Ensure initial tracks exist if for some reason they don't
    while (timeline.tracks.children.length <= trackIndex) {
      timeline.tracks.children.push({
        OTIO_SCHEMA: 'Track.1',
        name: `Track ${timeline.tracks.children.length}`,
        children: [],
        kind: trackIndex === 1 ? 'Audio' : 'Video',
        metadata: {},
      });
    }

    // Force Track 1 to be Audio (schema enforcement)
    if (trackIndex === 1 && timeline.tracks.children[1].kind !== 'Audio') {
      timeline.tracks.children[1].kind = 'Audio';
    }

    const targetTrack = timeline.tracks.children[trackIndex];

    // Handle Operation Types
    switch (operation.type) {
      case 'APPEND': {
        // Simple append to end of track
        targetTrack.children.push(clip);
        break;
      }

      case 'INSERT': {
        // "Insert at time X".
        // Strategy: Use Oversay/Placement logic to put it at X.
        // If X is undefined, it's just an APPEND.
        const currentDuration = getTrackDuration(targetTrack);
        const insertTime = operation.timelineStartTime;

        if (insertTime !== undefined) {
          if (insertTime >= currentDuration - 0.1) {
            // It is effectively an append (possibly with gap)
            const gapDuration = insertTime - currentDuration;
            if (gapDuration > 0.05) {
              targetTrack.children.push(createGap(gapDuration));
            }
            targetTrack.children.push(clip);
          } else {
            // Collision/Overlap logic.
            // For safety, treat as Overlay (Shift to new track) to avoid deleting content
            console.log(
              `[OTIO Builder] Insert time ${insertTime} < duration ${currentDuration}. Delegating to Layering.`,
            );
            await handleOverlay(timeline, clip, insertTime, trackIndex);
          }
        } else {
          targetTrack.children.push(clip);
        }
        break;
      }

      case 'OVERLAY': {
        // Explicitly place at specific time (stacking)
        const startTime = operation.timelineStartTime ?? getTrackDuration(targetTrack);
        await handleOverlay(timeline, clip, startTime, trackIndex);
        break;
      }

      case 'EFFECT': {
        const time = operation.timelineStartTime ?? 0;
        let pointer = 0;
        let found = false;

        for (const item of targetTrack.children) {
          const dur = item.source_range.duration.value / item.source_range.duration.rate;
          if (time >= pointer && time < pointer + dur) {
            // Found the target clip
            if (!item.effects) item.effects = [];
            item.effects.push({
              OTIO_SCHEMA: 'Effect.1',
              effect_name: operation.effectType || 'Unknown',
              metadata: operation.parameters || {},
            });
            found = true;
            console.log(
              `[OTIO Builder] Added effect ${operation.effectType} to clip ${item.name} at ${time}s`,
            );
            break;
          }
          pointer += dur;
        }
        if (!found) {
          console.warn(`[OTIO Builder] Could not find clip at ${time}s to apply effect`);
        }
        break;
      }

      case 'TRIM': {
        const time = operation.timelineStartTime ?? 0;
        let pointer = 0;

        for (const item of targetTrack.children) {
          const dur = item.source_range.duration.value / item.source_range.duration.rate;
          if (time >= pointer && time < pointer + dur) {
            // Found clip to trim
            if (operation.newDuration && operation.newDuration > 0) {
              // Update duration
              item.source_range.duration = createRationalTime(
                operation.newDuration,
                item.source_range.duration.rate,
              );
              console.log(
                `[OTIO Builder] Trimmed clip ${item.name} from ${dur}s to ${operation.newDuration}s`,
              );
            }
            break;
          }
          pointer += dur;
        }
        break;
      }
    }
  }

  return timeline;
}

/**
 * Smart Overlay: Tries to place a clip at ‘startTime’ on ‘trackIndex’.
 * If that space is occupied, it creates/finds a higher track to place it without collision.
 */
async function handleOverlay(
  timeline: Timeline,
  clip: Clip,
  startTime: number,
  preferredTrackIndex: number,
) {
  let placed = false;
  let currentTrackIdx = preferredTrackIndex;

  // What kind of track are we looking for?
  const expectedKind = preferredTrackIndex === 1 ? 'Audio' : 'Video';

  while (!placed) {
    // SKIP Main Audio Track (Track 1) if we are looking for valid Video real estate
    // (Assuming preferredTrackIndex 0 means Video. If preferred 1, we stay on Audio)
    if (expectedKind === 'Video' && currentTrackIdx === 1) {
      currentTrackIdx++;
      continue;
    }

    // Ensure track exists
    while (timeline.tracks.children.length <= currentTrackIdx) {
      timeline.tracks.children.push({
        OTIO_SCHEMA: 'Track.1',
        name: `Overlay ${currentTrackIdx}`,
        children: [],
        kind: expectedKind,
        metadata: {},
      });
    }

    const track = timeline.tracks.children[currentTrackIdx];

    // Safety check for Kind (don't put Audio on Video track or vice versa)
    if (track.kind !== expectedKind) {
      currentTrackIdx++;
      continue;
    }

    const trackDuration = getTrackDuration(track);

    // Check if we can append here (Track is shorter than specific time)
    // This assumes we only "Stack Upwards". We don't fill gaps "inside" a track yet.
    // If track len is 10, and start time is 12, we fit!
    if (trackDuration <= startTime + 0.05) {
      const gapNeeded = startTime - trackDuration;
      if (gapNeeded > 0.01) {
        track.children.push(createGap(gapNeeded));
      }
      track.children.push(clip);
      placed = true;
      console.log(
        `[OTIO Builder] Placed overlay on Track ${currentTrackIdx} (Kind: ${expectedKind}) at ${startTime}s`,
      );
    } else {
      // Track occupied at this time. Try next.
      currentTrackIdx++;

      if (currentTrackIdx > 20) {
        console.warn(
          `[OTIO Builder] ⚠️ Could not find free track for overlay after 20 tries. Giving up.`,
        );
        placed = true; // Break infinite loop
      }
    }
  }
}

/**
 * Saves OTIO timeline to the project
 */
export async function saveTimelineToProject(projectId: string, timeline: Timeline): Promise<void> {
  const prisma = getPrisma();

  await prisma.project.update({
    where: { id: projectId },
    data: {
      otio: timeline as any,
    },
  });

  console.log(`[OTIO Builder] Timeline saved to project ${projectId}`);
}
