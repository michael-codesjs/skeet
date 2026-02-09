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
): Promise<{ timeline: Timeline; warnings: string[] }> => {
  console.log(`[Timeline Builder] 🛠️ Applying ${operations.length} operations...`);
  const warnings: string[] = [];

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

    const trackId = (operation as any).trackId;
    const hasTrackId = trackId !== undefined;
    const targetIdx = hasTrackId ? Math.min(trackId, CORE_TRACKS.length - 1) : -1;
    const track = hasTrackId ? timeline.tracks[targetIdx] : null;

    // Only bail if it's a track-specific operation that's missing its track
    const trackSpecificTypes = [
      'RIPPLE',
      'APPEND',
      'INSERT',
      'OVERLAY',
      'EFFECT',
      'TRIM',
      'EMPTY_TRACK',
    ];
    if (trackSpecificTypes.includes(operation.type) && !track) {
      console.warn(
        `[Timeline Builder] 🛑 Skipping ${operation.type}: Track ID missing or invalid.`,
      );
      continue;
    }

    switch (operation.type) {
      case 'RIPPLE': {
        const { fromTime, delta } = operation;
        if (fromTime === undefined || delta === undefined) {
          console.warn(`[Timeline Builder] 🛑 RIPPLE requires 'fromTime' and 'delta'.`);
          continue;
        }

        let shiftedCount = 0;
        track.children.forEach((clip) => {
          if (clip.start >= fromTime) {
            clip.start += delta;
            shiftedCount++;
          }
        });

        console.log(
          `[Timeline Builder] 🌊 RIPPLE: Shifted ${shiftedCount} clip(s) on track ${targetIdx} from ${fromTime}ms by ${delta > 0 ? '+' : ''}${delta}ms`,
        );
        break;
      }

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
          const warning = `Collision detected at ${start}ms on track ${targetIdx}. INSERT operation skipped. Use RIPPLE to make room first!`;
          console.warn(`[Timeline Builder] 🛑 ${warning}`);
          warnings.push(warning);
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

        // If trackId is specified, only search that track. Otherwise search all tracks.
        const tracksToSearch =
          operation.trackId !== undefined
            ? [{ track: timeline.tracks[operation.trackId], idx: operation.trackId }]
            : timeline.tracks.map((t, idx) => ({ track: t, idx }));

        let foundClip = false;
        for (const { track: searchTrack, idx: trackIdx } of tracksToSearch) {
          if (!searchTrack) continue;

          const clipIdx = searchTrack.children.findIndex((c) => c.id === id);
          if (clipIdx === -1) continue;

          const clip = searchTrack.children[clipIdx];
          const finalStart = newStart !== undefined ? newStart : clip.start;
          const finalDuration = newDuration !== undefined ? newDuration : clip.duration;

          // Collision check (excluding self)
          if (hasCollision(searchTrack, finalStart, finalDuration, id)) {
            console.warn(
              `[Timeline Builder] 🛑 UPDATE collision for ${id} at ${finalStart}ms on track ${trackIdx}.`,
            );
            continue;
          }

          if (newStart !== undefined) clip.start = newStart;
          if (newDuration !== undefined) clip.duration = newDuration;
          if (newSourceStart !== undefined && clip.type === 'Clip') {
            (clip as any).sourceStart = newSourceStart;
          }

          // Persist parameters (transitions, effects, etc) into metadata
          if (operation.parameters) {
            clip.metadata = { ...(clip.metadata || {}), ...operation.parameters };
          }

          console.log(
            `[Timeline Builder] ✅ Updated clip ${id} on track ${trackIdx}: start=${clip.start}, duration=${clip.duration}, sourceStart=${(clip as any).sourceStart}`,
          );
          // Maintain order after update (in case start time changed)
          searchTrack.children.sort((a, b) => a.start - b.start);
          foundClip = true;
          break;
        }

        if (!foundClip) {
          console.warn(`[Timeline Builder] 🛑 UPDATE failed: Clip ${id} not found in any track.`);
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

          // Also persist parameters during trim if provided
          if (operation.parameters) {
            clip.metadata = { ...(clip.metadata || {}), ...operation.parameters };
          }
        }
        break;
      }

      case 'DELETE': {
        const { id, start } = operation;

        // If trackId is specified, only search that track. Otherwise search all tracks.
        const tracksToSearch =
          operation.trackId !== undefined
            ? [{ track: timeline.tracks[operation.trackId], idx: operation.trackId }]
            : timeline.tracks.map((t, idx) => ({ track: t, idx }));

        for (const { track: searchTrack, idx: trackIdx } of tracksToSearch) {
          if (!searchTrack) continue;

          const initialCount = searchTrack.children.length;

          if (id) {
            searchTrack.children = searchTrack.children.filter((c) => c.id !== id);
          } else if (start !== undefined) {
            searchTrack.children = searchTrack.children.filter(
              (c) => !(start >= c.start && start < c.start + c.duration),
            );
          }

          const finalCount = searchTrack.children.length;
          if (finalCount < initialCount) {
            console.log(
              `[Timeline Builder] 🗑️  Deleted ${initialCount - finalCount} clip(s) from track ${trackIdx}${id ? ` (id: ${id})` : ` (at ${start}ms)`}`,
            );
            // Maintain order after deletion
            searchTrack.children.sort((a, b) => a.start - b.start);
            if (id) break; // If deleting by ID, stop after first match
          }
        }
        break;
      }

      case 'EMPTY_TRACK': {
        track.children = [];
        break;
      }
    }

    // Maintain temporal order within children array for consistency
    if (track) {
      track.children.sort((a, b) => a.start - b.start);
    }
  }

  return { timeline, warnings };
};
