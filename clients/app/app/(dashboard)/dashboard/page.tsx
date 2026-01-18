export default function DashboardPage() {
  return (
    <div>
      <h2 className="text-3xl font-bold tracking-tight text-white mb-4">Overview</h2>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="glass-card rounded-xl p-6">
          <h3 className="text-sm font-medium text-[#AAAAAA]">Total Projects</h3>
          <p className="text-2xl font-bold mt-2">12</p>
        </div>
        <div className="glass-card rounded-xl p-6">
          <h3 className="text-sm font-medium text-[#AAAAAA]">Active Renders</h3>
          <p className="text-2xl font-bold mt-2">2</p>
        </div>
        <div className="glass-card rounded-xl p-6">
          <h3 className="text-sm font-medium text-[#AAAAAA]">Storage Used</h3>
          <p className="text-2xl font-bold mt-2">45%</p>
        </div>
        <div className="glass-card rounded-xl p-6">
          <h3 className="text-sm font-medium text-[#AAAAAA]">Credits</h3>
          <p className="text-2xl font-bold mt-2">850</p>
        </div>
      </div>
    </div>
  );
}
