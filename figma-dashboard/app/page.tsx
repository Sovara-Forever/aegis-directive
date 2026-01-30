import OverviewDashboard from '../components/OverviewDashboard'

export default function Home() {
  return (
    <main className="min-h-screen p-8">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            Aegis Intelligence
          </h1>
          <p className="text-text-secondary">
            Automotive Dealership Analytics Dashboard
          </p>
        </header>

        <OverviewDashboard />
      </div>
    </main>
  )
}
