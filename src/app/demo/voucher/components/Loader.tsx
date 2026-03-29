export default function Loader() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-red-50 to-orange-100 flex justify-center items-center">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mb-4"></div>
        <p className="text-slate-700">Loading demo voucher...</p>
      </div>
    </div>
  );
}
