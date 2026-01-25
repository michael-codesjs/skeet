import 'dotenv/config';
import { PrismaClient } from '../src/generated/prisma_client';
import { generateEditDecisionList } from '../src/lib/director';
import { FrameManifest } from '../src/lib/types/manifest';

const prisma = new PrismaClient();

async function main() {
  console.log('🔍 Finding a test video file...');
  const videoFile = await prisma.videoFile.findFirst({
    take: 1,
  });

  if (!videoFile) {
    console.error('❌ No video files found in DB. Please upload one first.');
    return;
  }

  console.log(`✅ Found Video: ${videoFile.fileName} (ID: ${videoFile.id})`);

  // TEST 1: ANALYZER
  console.log('\n--- TEST 1: ANALYSIS ENGINE ---');
  // Mock S3 download URL or local path - for verification we might need to skip actual download
  // if we don't have AWS creds in this env or if file doesn't exist locally.
  // Ideally we mock the analyzer response if we can't run it fully.
  // But let's try to run it. If it fails on FFmpeg/Gemini, we catch it.

  let manifest: FrameManifest | null = null;

  try {
    // NOTE: We are passing a dummy URL locally if we can't sign URLs,
    // but let's assume getDownloadUrl works or we use a valid path if available.
    // For safety, let's mock the "Deep" part if we don't want to burn tokens/time,
    // OR we just assume the file has analysisData already and test the Director?

    if (videoFile.analysisData) {
      console.log('ℹ️ Video already has analysis data. Using existing.');
      manifest = videoFile.analysisData as unknown as FrameManifest;
    } else {
      console.log(
        '⚠️ Video missing analysis data. Skipping deep analysis verification (requires API keys/files).',
      );
      // Create dummy manifest for Director test
      manifest = {
        activeTimeline: Array.from({ length: 30 }, (_, i) => ({
          timestamp: i * 0.5,
          motionScore: i === 10 ? 0.95 : Math.random(), // Force high motion at frame 10 (5.0s)
          flowDx: (Math.random() - 0.5) * 10,
          flowDy: (Math.random() - 0.5) * 5,
          audioEnergy: Math.random(),
          istransient: i === 10 ? true : Math.random() > 0.9, // Force transient at frame 10
          luminance: 100,
          colorBalance: { u: 128, v: 128 },
          saturation: 1.0,
        })),
        semantic: {
          dominantColors: ['#000000'],
          aestheticScore: 0.8,
          momentum: { direction: 'E', velocity: 8.5 },
          subject: { label: 'Test Subject', aesthetic: 'Cinematic' },
          impactMoments: [5000],
          description: 'A test video for verification',
          vibeTags: ['high_energy', 'test'],
        },
        technical: {
          stability: 0.9,
          focusScore: 0.8,
          cameraMotion: 'static',
          resolution: [1920, 1080],
          fps: 30,
          duration: 15.0,
          codec: 'h264',
        },
      } as FrameManifest;
    }

    console.log(`✅ Manifest Ready: ${manifest.activeTimeline.length} frames.`);
  } catch (e) {
    console.error('❌ Analysis failed:', e);
    return;
  }

  // TEST 2: REASONING ENGINE (DIRECTOR)
  console.log('\n--- TEST 2: REASONING ENGINE ---');
  try {
    // Mock asset list
    const assets = [
      {
        id: videoFile.id,
        duration: 15.0, // Mock duration
        analysisData: manifest,
      },
      {
        id: 'mock-file-2',
        duration: 10.0,
        analysisData: manifest, // Reuse manifest for test
      },
    ];

    const prompt = 'High energy sci-fi action';
    const edl = await generateEditDecisionList(prompt, assets, {
      duration: 30,
      intensity: 'High',
      pacing: 'Fast',
    });

    console.log('🎬 Generated EDL:');
    console.log(JSON.stringify(edl, null, 2));

    if (edl.clips.length > 0 && edl.clips[0].effects) {
      console.log(`✅ Semantic Triggers generated: ${edl.clips[0].effects.length} effects`);
    } else {
      console.log('⚠️ No semantic triggers found (might be random fallback).');
    }
  } catch (e) {
    console.error('❌ Reasoning Engine failed:', e);
  }
}

main()
  .catch((e) => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
