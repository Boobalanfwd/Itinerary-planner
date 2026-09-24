export default function NotFound() {
  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-6">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-white mb-4">404</h1>
        <h2 className="text-2xl font-semibold text-gray-300 mb-4">
          Itinerary Not Found
        </h2>
        <p className="text-gray-400 mb-8">
          The itinerary you're looking for doesn't exist or has been deleted.
        </p>
        <a
          href="/dashboard"
          className="px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-white rounded-xl font-semibold transition-colors"
        >
          Go to Dashboard
        </a>
      </div>
    </div>
  );
}
