import 'dotenv/config';
import { PrismaClient } from '../generated/prisma_client';

const prisma = new PrismaClient();

async function main() {
  const mediaId = 'cmkvm5gxk0001ddaxiuz70g4t';
  console.log(`Fetching media: ${mediaId}`);

  const media = await prisma.media.findUnique({
    where: { id: mediaId },
    select: {
      id: true,
      shotBreakdown: true,
      summary: true,
      tags: true,
    },
  });

  if (!media) {
    console.log('Media not found');
  } else {
    console.log('--- Summary ---');
    console.log(media.summary);
    console.log('--- Shot Breakdown ---');
    console.log(JSON.stringify(media.shotBreakdown, null, 2));
    console.log('--- Tags ---');
    console.log(media.tags);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
