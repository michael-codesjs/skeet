export function Footer() {
  return (
    <footer className="py-6 px-8 bg-[#050505] mt-auto">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-neutral-500">
        <div className="flex items-center gap-6">
          <span className="font-mono text-neutral-600">v0.1.0-beta</span>
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
            </span>
            <span>Systems Normal</span>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <a href="#" className="hover:text-white transition-colors">
            Documentation
          </a>
          <a href="#" className="hover:text-white transition-colors">
            Support
          </a>
          <a href="#" className="hover:text-white transition-colors">
            Terms
          </a>
          <a href="#" className="hover:text-white transition-colors">
            Privacy
          </a>
        </div>

        <p>&copy; {new Date().getFullYear()} Skeet Studios.</p>
      </div>
    </footer>
  );
}
