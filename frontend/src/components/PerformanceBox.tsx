interface Props {
  metrics: {
    response_time_sec: number;
    provider_used: string;
    model_used: string;
  } | null;
}

export default function PerformanceBox({ metrics }: Props) {
  if (!metrics) {
    return (
      <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
        <h2 className="text-lg font-semibold mb-4">Performans Metrikleri</h2>
        <p className="text-gray-500 text-sm">
          Henüz bir sorgu gönderilmedi.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
      <h2 className="text-lg font-semibold mb-4">Performans Metrikleri</h2>
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-gray-800 rounded-lg p-4">
          <p className="text-gray-400 text-xs uppercase tracking-wide">
            Yanıt Süresi
          </p>
          <p className="text-2xl font-bold text-green-400">
            {metrics.response_time_sec}s
          </p>
        </div>
        <div className="bg-gray-800 rounded-lg p-4">
          <p className="text-gray-400 text-xs uppercase tracking-wide">
            Sağlayıcı
          </p>
          <p className="text-2xl font-bold text-blue-400">
            {metrics.provider_used}
          </p>
        </div>
        <div className="bg-gray-800 rounded-lg p-4 col-span-2">
          <p className="text-gray-400 text-xs uppercase tracking-wide">
            Model
          </p>
          <p className="text-lg font-semibold">{metrics.model_used}</p>
        </div>
      </div>
    </div>
  );
}
