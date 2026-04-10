import React from 'react';

export default function ResultCard({ result }) {
  if (!result) return null;

  const { risk, score, details } = result;

  const getRiskColor = (riskLevel) => {
    switch (riskLevel) {
      case 'safe':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200 ring-emerald-500';
      case 'suspicious':
        return 'bg-amber-50 text-amber-700 border-amber-200 ring-amber-500';
      case 'dangerous':
        return 'bg-rose-50 text-rose-700 border-rose-200 ring-rose-500';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200 ring-gray-500';
    }
  };

  const riskColor = getRiskColor(risk);

  const formatScore = (num) => Math.round(num * 100);

  return (
    <div className="flex w-full flex-col gap-6">
      {/* Top Banner */}
      <div className={`flex flex-col items-center justify-center rounded-3xl border-2 p-8 text-center shadow-sm ${riskColor}`}>
        <div className="text-xl font-semibold uppercase tracking-widest opacity-80">Risk Assessment</div>
        <div className="mt-2 text-6xl font-extrabold capitalize tracking-tight">{risk}</div>
        <div className="mt-4 text-2xl opacity-90">Confidence Score: {formatScore(score)}/100</div>
      </div>

      {details && (
        <div className="flex flex-col gap-4 mt-4">
          <h4 className="text-xl font-bold text-gray-800">Threat Details</h4>
          
          {details.threat_types && details.threat_types.length > 0 ? (
            <div className="flex flex-col gap-2">
              <span className="text-lg font-medium text-gray-600">Detected Issues:</span>
              <div className="flex flex-wrap gap-2">
                {details.threat_types.map((threat, index) => (
                  <span key={index} className="rounded-full bg-rose-100 px-4 py-2 text-lg font-semibold text-rose-800 border border-rose-200">
                    {threat}
                  </span>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-lg text-gray-500">No specific threat categories matched.</p>
          )}

          {details.matched_feeds && details.matched_feeds.length > 0 && (
            <div className="flex flex-col gap-2 mt-4">
              <span className="text-lg font-medium text-gray-600">Flagged By:</span>
              <div className="flex flex-wrap gap-2">
                {details.matched_feeds.map((feed, index) => (
                  <span key={index} className="rounded-full bg-gray-100 px-4 py-2 text-lg font-medium text-gray-700 border border-gray-200">
                    {feed}
                  </span>
                ))}
              </div>
            </div>
          )}

          {details.redirects_to && (
             <div className="mt-4 rounded-xl bg-gray-50 p-4 border border-gray-200">
               <span className="text-gray-600 block text-sm mb-1 uppercase font-semibold">Redirects To</span>
               <span className="text-lg text-blue-600 break-all font-mono">{details.redirects_to}</span>
             </div>
          )}
        </div>
      )}
    </div>
  );
}
