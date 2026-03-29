import Link from 'next/link';

type NoData = {
  error: string | null;
};

export default function NoData({ error }: NoData) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-red-50 to-orange-100 flex flex-col justify-center items-center text-center py-12">
      <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-orange-300">
        <span className="text-orange-500 text-2xl">☕</span>
      </div>
      <h1
        className="text-2xl font-bold text-slate-700 mb-4"
        style={{ fontFamily: 'Alegreya SC, serif' }}
      >
        Gift Item Not Found
      </h1>
      <p className="text-slate-600 mb-6">
        {error || 'The requested gift item could not be found.'}
      </p>
      <Link
        href="/"
        className="bg-orange-600 text-white font-bold px-6 py-3 rounded-full hover:bg-orange-700 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl border-2 border-orange-500"
      >
        Return to Home
      </Link>
    </div>
  );
}
