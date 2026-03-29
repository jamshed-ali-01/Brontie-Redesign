export default function Loading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-red-50 to-orange-100 flex justify-center items-center">
      <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
      <span className="ml-2 text-slate-700">Loading gift item...</span>
    </div>
  );
}
