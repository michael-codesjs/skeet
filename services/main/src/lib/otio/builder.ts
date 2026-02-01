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
  OTIO_SCHEMA: string;
  name: string;
  source_range: TimeRange;
  media_reference: MediaReference;
  metadata: Record<string, any>;
}

interface Track {
  OTIO_SCHEMA: string;
  name: string;
  children: Clip[];
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

/**
 * Builds an OTIO timeline from edit operations
 */
export async function buildOTIOFromOperations(
  operations: EditOperation[],
  projectId: string,
): Promise<Timeline> {
  const prisma = getPrisma();
  const { s3 } = await import('@/lib/storage/s3');

  // Fetch all media referenced in operations
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
      proxyUrl: true, // This now stores the S3 key of the proxy video
    },
  });

  const mediaMap = new Map(mediaRecords.map((m) => [m.id, m]));

  // Initialize timeline structure
  const timeline: Timeline = {
    OTIO_SCHEMA: 'Timeline.1',
    name: 'Skeet Edit',
    tracks: {
      OTIO_SCHEMA: 'Stack.1',
      name: 'tracks',
      children: [
        {
          OTIO_SCHEMA: 'Track.1',
          name: 'Main Video',
          children: [],
          kind: 'Video',
          metadata: {},
        },
        {
          OTIO_SCHEMA: 'Track.1',
          name: 'Main Audio',
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

  // Process operations in order
  for (const operation of operations) {
    const media = mediaMap.get(operation.mediaId);
    if (!media) {
      console.warn(`[OTIO Builder] Media ${operation.mediaId} not found, skipping operation`);
      continue;
    }

    const trackIndex = operation.trackId || 0;

    // Ensure track exists
    while (timeline.tracks.children.length <= trackIndex) {
      timeline.tracks.children.push({
        OTIO_SCHEMA: 'Track.1',
        name: `Track ${timeline.tracks.children.length + 1}`,
        children: [],
        kind: 'Video', // Default to Video for extra tracks
        metadata: {},
      });
    }

    // Force Track 1 to be Audio if it was somehow overwritten or accessed
    if (trackIndex === 1 && timeline.tracks.children[1].kind !== 'Audio') {
      timeline.tracks.children[1].kind = 'Audio';
    }

    const track = timeline.tracks.children[trackIndex];

    switch (operation.type) {
      case 'APPEND': {
        const sourceStart = operation.sourceStartTime || 0;
        const sourceDuration = operation.sourceDuration || media.duration || 0;

        if (operation.sourceDuration === undefined && (media.duration || 0) > 60) {
          console.warn(
            `[OTIO Builder] ⚠️ No sourceDuration provided for long clip (${media.fileName}). Defaulting to full duration: ${media.duration}s`,
          );
        }

        console.log(`[OTIO Builder] Creating clip for ${media.fileName}, mediaId: ${media.id}`);

        const clip: Clip = {
          OTIO_SCHEMA: 'Clip.1',
          name: media.fileName,
          source_range: createTimeRange(sourceStart, sourceDuration),
          media_reference: {
            OTIO_SCHEMA: 'ExternalReference.1',
            name: media.fileName,
            available_range: createTimeRange(0, media.duration || 0),
            // Leave empty - frontend AssetManager will resolve this
            target_url: '',
            metadata: {
              mediaId: media.id,
              s3Key: media.s3Key,
              proxyS3Key: media.proxyUrl, // Stored as S3 key now
            },
          },
          metadata: {
            mediaId: media.id,
          },
        };

        track.children.push(clip);
        break;
      }

      case 'INSERT':
      case 'OVERLAY': {
        // For INSERT and OVERLAY, we need to handle timeline positioning
        // This is more complex and would require gap insertion logic
        console.warn(`[OTIO Builder] ${operation.type} not fully implemented yet`);
        break;
      }

      case 'TRIM':
      case 'EFFECT': {
        // These modify existing clips
        console.warn(`[OTIO Builder] ${operation.type} not fully implemented yet`);
        break;
      }
    }
  }

  return timeline;
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
