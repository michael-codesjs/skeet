import { EditOperation, Timeline, TimelineTrack } from './types';

/**
 * Checks if a time range overlaps with any existing children on a track
 */
const hasCollision = (
  track: TimelineTrack,
  start: number,
  duration: number,
  excludeId?: string,
) => {
  const end = start + duration;
  return track.children.some((child) => {
    if (excludeId && child.id === excludeId) return false;
    const childEnd = child.start + child.duration;
    // Overlap condition: (StartA < EndB) and (EndA > StartB)
    return start < childEnd && end > child.start;
  });
};

const genId = () => Math.random().toString(36).substring(2, 10);

/**
 * Applies edit operations to a timeline with strict collision prevention
 */
export const applyOperationsToTimeline = async (
  timeline: Timeline,
  operations: EditOperation[],
): Promise<Timeline> => {
  console.log(`[Timeline Builder] 🛠️ Applying ${operations.length} operations...`);

  const CORE_TRACKS = [
    { name: 'Main Visuals', kind: 'Video' as const },
    { name: 'Soundtrack', kind: 'Audio' as const },
    { name: 'FX & Overlays', kind: 'Video' as const },
    { name: 'Sound Effects', kind: 'Audio' as const },
  ];

  // Help Heal & Lock: Ensure all existing clips have IDs and track architecture is rigid
  timeline.tracks.forEach((track, idx) => {
    if (idx < CORE_TRACKS.length) {
      track.name = CORE_TRACKS[idx].name;
      track.kind = CORE_TRACKS[idx].kind;
    }
    track.children.forEach((child) => {
      if (!child.id) child.id = genId();
    });
  });

  // Strict Enforce: Exactly 4 tracks
  while (timeline.tracks.length < CORE_TRACKS.length) {
    const idx = timeline.tracks.length;
    timeline.tracks.push({
      name: CORE_TRACKS[idx].name,
      kind: CORE_TRACKS[idx].kind,
      children: [],
      metadata: {},
    });
  }

  // Remove any stray tracks beyond core
  if (timeline.tracks.length > CORE_TRACKS.length) {
    timeline.tracks = timeline.tracks.slice(0, CORE_TRACKS.length);
  }

  for (const operation of operations) {
    // 1. Handle Track Management (Disabled for Agent as we are strict now)
    if (operation.type === 'ADD_TRACK') {
      console.warn(`[Timeline Builder] 🛑 ADD_TRACK ignored. Architecture is locked to 4 tracks.`);
      continue;
    }

    // Surgical Cap: Only allow operations on 0-3
    const targetIdx = Math.min(operation.trackId, CORE_TRACKS.length - 1);
    const track = timeline.tracks[targetIdx];
    if (!track) continue; // Should never happen now

    switch (operation.type) {
      case 'APPEND': {
        const { mediaId, sourceStart = 0, duration } = operation;
        if (duration === undefined || !mediaId) continue;

        let lastEnd = 0;
        track.children.forEach((child) => {
          lastEnd = Math.max(lastEnd, child.start + child.duration);
        });

        track.children.push({
          id: genId(),
          type: 'Clip',
          start: lastEnd,
          duration,
          mediaId,
          sourceStart,
          metadata: { mediaId, ...operation.parameters },
          effects: [],
        });
        break;
      }

      case 'INSERT':
      case 'OVERLAY': {
        const { mediaId, sourceStart = 0, duration, start } = operation;
        if (duration === undefined || start === undefined || !mediaId) continue;

        const targetIdx = Math.min(operation.trackId, CORE_TRACKS.length - 1);
        if (hasCollision(track, start, duration)) {
          console.warn(
            `[Timeline Builder] 🛑 Collision detected at ${start}ms on track ${targetIdx}. Operation skipped.`,
          );
          continue;
        }

        track.children.push({
          id: genId(),
          type: 'Clip',
          start,
          duration,
          mediaId,
          sourceStart,
          metadata: { mediaId, ...operation.parameters },
          effects: [],
        });
        break;
      }

      case 'EFFECT': {
        const { effectType, start, duration, parameters } = operation;
        if (!effectType || start === undefined || duration === undefined) continue;

        if (hasCollision(track, start, duration)) {
          console.warn(
            `[Timeline Builder] 🛑 Effect collision at ${start}ms on track ${operation.trackId}.`,
          );
          continue;
        }

        track.children.push({
          id: genId(),
          type: 'Effect',
          name: effectType,
          start,
          duration,
          effectType: effectType as any,
          parameters: parameters || {},
          metadata: {},
        });
        break;
      }

      case 'UPDATE': {
        const {
          id,
          start: newStart,
          duration: newDuration,
          sourceStart: newSourceStart,
        } = operation;
        if (!id) continue;

        const clipIdx = track.children.findIndex((c) => c.id === id);
        if (clipIdx === -1) {
          console.warn(`[Timeline Builder] 🛑 UPDATE failed: Clip ${id} not found.`);
          continue;
        }

        const clip = track.children[clipIdx];
        const finalStart = newStart !== undefined ? newStart : clip.start;
        const finalDuration = newDuration !== undefined ? newDuration : clip.duration;

        // Collision check (excluding self)
        if (hasCollision(track, finalStart, finalDuration, id)) {
          console.warn(`[Timeline Builder] 🛑 UPDATE collision for ${id} at ${finalStart}ms.`);
          continue;
        }

        if (newStart !== undefined) clip.start = newStart;
        if (newDuration !== undefined) clip.duration = newDuration;
        if (newSourceStart !== undefined && clip.type === 'Clip') {
          (clip as any).sourceStart = newSourceStart;
        }
        break;
      }

      case 'TRIM': {
        const { start, duration, id } = operation;
        if (duration === undefined) continue;

        const clip = id
          ? track.children.find((c) => c.id === id)
          : track.children.find(
              (c) => start !== undefined && start >= c.start && start < c.start + c.duration,
            );

        if (clip) {
          clip.duration = duration;
        }
        break;
      }

      case 'DELETE': {
        const { id, start } = operation;
        if (id) {
          track.children = track.children.filter((c) => c.id !== id);
        } else if (start !== undefined) {
          track.children = track.children.filter(
            (c) => !(start >= c.start && start < c.start + c.duration),
          );
        }
        break;
      }

      case 'EMPTY_TRACK': {
        track.children = [];
        break;
      }
    }

    // Maintain temporal order within children array for consistency
    track.children.sort((a, b) => a.start - b.start);
  }

  return timeline;
};
