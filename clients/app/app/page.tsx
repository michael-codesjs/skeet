import Link from 'next/link';

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-black text-white p-8">
      <main className="flex flex-col items-center gap-8">
        <h1 className="text-5xl font-bold tracking-tight text-gradient">skeet app</h1>

        <div className="flex gap-4">
          <Link
            href="/projects"
            className="rounded-full bg-white text-black px-8 py-4 font-bold hover:scale-105 transition-all text-lg"
          >
            Enter App
          </Link>
        </div>
      </main>
    </div>
  );
}
