import { useState } from 'react';
import { api } from '../services/api';
import ResultCard from '../components/ui/ResultCard';

export default function Home() {
  const [activeTab, setActiveTab] = useState('Link');

  // Link Analysis State
  const [urlInput, setUrlInput] = useState('');
  const [linkStatus, setLinkStatus] = useState('idle'); // idle, loading, success, error
  const [linkResult, setLinkResult] = useState(null);
  const [linkError, setLinkError] = useState(null);

  const tabs = ['Link', 'Message', 'File', 'Phone'];

  const handleLinkSubmit = async () => {
    if (!urlInput.trim()) return;
    setLinkStatus('loading');
    setLinkError(null);
    setLinkResult(null);
    try {
      const data = await api.post('/scan/link', { url: urlInput });
      setLinkResult(data);
      setLinkStatus('success');
    } catch (err) {
      console.error(err);
      setLinkError(err.message || 'An error occurred while scanning the link.');
      setLinkStatus('error');
    }
  };

  const renderInputArea = () => {
    switch (activeTab) {
      case 'Link':
        return (
          <div className="flex flex-col gap-8 h-full">
            <div>
              <h2 className="text-4xl font-bold text-white">Check a Link</h2>
              <p className="mt-4 text-2xl text-[#94a3b8]">Paste a URL to see if it's a known scam.</p>
            </div>
            <div className="flex-1 mt-8">
              <label htmlFor="url-input" className="sr-only">URL</label>
              <input
                id="url-input"
                type="url"
                placeholder="https://example.com/login"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleLinkSubmit()}
                className="w-full rounded-2xl border-2 border-[#1a3353] bg-[#060b15] p-8 text-2xl text-white shadow-sm focus:border-[#00c9a7] focus:outline-none focus:ring-4 focus:ring-[#00c9a7]/20 transition-all placeholder:text-[#2d4a6a]"
              />
            </div>
            <button
              onClick={handleLinkSubmit}
              disabled={linkStatus === 'loading' || !urlInput.trim()}
              className="mt-auto w-full rounded-2xl bg-[#00c9a7] px-10 py-8 text-3xl font-bold text-[#060b15] shadow-lg hover:bg-[#00b396] transition-colors focus:outline-none focus:ring-4 focus:ring-[#00c9a7]/40 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-4"
            >
              {linkStatus === 'loading' ? (
                <>
                  <svg className="animate-spin h-8 w-8 text-[#060b15]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Analyzing...
                </>
              ) : (
                'Analyze Link'
              )}
            </button>
          </div>
        );

      case 'Message':
        return (
          <div className="flex flex-col gap-8 h-full">
            <div>
              <h2 className="text-4xl font-bold text-white">Check a Message</h2>
              <p className="mt-4 text-2xl text-[#94a3b8]">Paste an SMS or email body to scan for phishing.</p>
            </div>
            <div className="flex-1 mt-8 flex flex-col">
              <label htmlFor="message-input" className="sr-only">Message content</label>
              <textarea
                id="message-input"
                placeholder="Paste the suspicious text here..."
                className="w-full flex-1 rounded-2xl border-2 border-[#1a3353] bg-[#060b15] p-8 text-2xl text-white shadow-sm focus:border-[#00c9a7] focus:outline-none focus:ring-4 focus:ring-[#00c9a7]/20 transition-all placeholder:text-[#2d4a6a] resize-none min-h-75"
              />
            </div>
            <button className="mt-auto w-full rounded-2xl bg-[#00c9a7] px-10 py-8 text-3xl font-bold text-[#060b15] shadow-lg hover:bg-[#00b396] transition-colors focus:outline-none focus:ring-4 focus:ring-[#00c9a7]/40">
              Analyze Message
            </button>
          </div>
        );

      case 'File':
        return (
          <div className="flex flex-col gap-8 h-full">
            <div>
              <h2 className="text-4xl font-bold text-white">Check a File</h2>
              <p className="mt-4 text-2xl text-[#94a3b8]">Upload a suspicious file for malware analysis.</p>
            </div>
            <div className="flex-1 mt-8 flex flex-col justify-center">
              <label
                htmlFor="file-upload"
                className="flex flex-1 w-full cursor-pointer flex-col items-center justify-center rounded-3xl border-2 border-dashed border-[#1a3353] bg-[#060b15] hover:bg-[#0a1525] hover:border-[#00c9a7]/50 transition-all min-h-75"
              >
                <div className="flex flex-col items-center justify-center p-10 text-center">
                  <svg className="mb-6 h-20 w-20 text-[#00c9a7]/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  <p className="mb-3 text-3xl text-[#94a3b8]"><span className="font-bold text-white">Click to upload</span> or drag and drop</p>
                  <p className="text-2xl text-[#2d4a6a]">PDF, DOCX, ZIP (MAX. 50MB)</p>
                </div>
                <input id="file-upload" type="file" className="hidden" />
              </label>
            </div>
            <button className="mt-auto w-full rounded-2xl bg-[#00c9a7] px-10 py-8 text-3xl font-bold text-[#060b15] shadow-lg hover:bg-[#00b396] transition-colors focus:outline-none focus:ring-4 focus:ring-[#00c9a7]/40">
              Analyze File
            </button>
          </div>
        );

      case 'Phone':
        return (
          <div className="flex flex-col gap-8 h-full">
            <div>
              <h2 className="text-4xl font-bold text-white">Check a Phone Number</h2>
              <p className="mt-4 text-2xl text-[#94a3b8]">Enter a number to check its reputation history.</p>
            </div>
            <div className="flex-1 mt-8">
              <label htmlFor="phone-input" className="sr-only">Phone Number</label>
              <input
                id="phone-input"
                type="tel"
                placeholder="+1 (555) 000-0000"
                className="w-full rounded-2xl border-2 border-[#1a3353] bg-[#060b15] p-8 text-2xl text-white shadow-sm focus:border-[#00c9a7] focus:outline-none focus:ring-4 focus:ring-[#00c9a7]/20 transition-all placeholder:text-[#2d4a6a]"
              />
            </div>
            <button className="mt-auto w-full rounded-2xl bg-[#00c9a7] px-10 py-8 text-3xl font-bold text-[#060b15] shadow-lg hover:bg-[#00b396] transition-colors focus:outline-none focus:ring-4 focus:ring-[#00c9a7]/40">
              Lookup Number
            </button>
          </div>
        );

      default:
        return null;
    }
  };

  const renderResultsArea = () => {
    if (activeTab === 'Link') {
      if (linkStatus === 'idle') {
        return (
          <div className="flex flex-col items-center text-center max-w-lg">
            <div className="mb-10 flex h-40 w-40 items-center justify-center rounded-full bg-[#060b15] border-2 border-dashed border-[#1a3353]">
              <svg className="h-20 w-20 text-[#1a3353]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
            </div>
            <h3 className="text-4xl font-bold text-white">Results Area</h3>
            <p className="mt-6 text-2xl text-[#2d4a6a]">Enter a URL to get started</p>
          </div>
        );
      }

      if (linkStatus === 'loading') {
        return (
          <div className="flex flex-col items-center text-center max-w-lg">
            <div className="mb-10 flex h-40 w-40 items-center justify-center rounded-full border-4 border-[#00c9a7] border-t-transparent animate-spin" />
            <h3 className="text-4xl font-bold text-white">Analyzing...</h3>
            <p className="mt-6 text-2xl text-[#94a3b8]">Checking threat intelligence feeds.</p>
          </div>
        );
      }

      if (linkStatus === 'error') {
        return (
          <div className="flex flex-col items-center text-center max-w-lg">
            <div className="mb-10 flex h-40 w-40 items-center justify-center rounded-full bg-rose-950/40 border-2 border-dashed border-rose-800/50">
              <svg className="h-20 w-20 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h3 className="text-4xl font-bold text-white">Scan Failed</h3>
            <p className="mt-6 text-2xl text-rose-400">{linkError}</p>
          </div>
        );
      }

      if (linkStatus === 'success' && linkResult) {
        return (
          <div className="w-full flex-1 flex flex-col overflow-y-auto pr-4">
            <ResultCard result={linkResult} />
          </div>
        );
      }
    }

    return (
      <div className="flex flex-col items-center text-center max-w-lg">
        <div className="mb-10 flex h-40 w-40 items-center justify-center rounded-full bg-[#060b15] border-2 border-dashed border-[#1a3353]">
          <svg className="h-20 w-20 text-[#1a3353]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
        </div>
        <h3 className="text-4xl font-bold text-white">Results Area</h3>
        <p className="mt-6 text-2xl text-[#2d4a6a]">Enter input to get started</p>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#070e1a] p-12 lg:p-16 xl:p-24 font-sans text-white">
      {/* Subtle grid overlay */}
      <div
        className="pointer-events-none fixed inset-0 opacity-[0.03]"
        style={{
          backgroundImage: 'linear-gradient(#00c9a7 1px, transparent 1px), linear-gradient(90deg, #00c9a7 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />

      <div className="relative mx-auto max-w-400">
        {/* Header */}
        <header className="mb-16 flex flex-col items-start gap-10 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex items-center gap-6">
            <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-[#00c9a7]/10 border border-[#00c9a7]/30 shadow-lg shadow-[#00c9a7]/10">
              <svg className="h-12 w-12 text-[#00c9a7]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <h1 className="text-6xl font-extrabold tracking-tight text-white">
              Scam<span className="text-[#00c9a7]">Aware</span>
            </h1>
          </div>

          <nav className="flex w-full xl:w-auto space-x-2 rounded-full bg-[#0d1a2d] p-3 border border-[#1a3353]">
            {tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 xl:flex-none rounded-full px-12 py-6 text-2xl font-bold transition-all whitespace-nowrap ${
                  activeTab === tab
                    ? 'bg-[#00c9a7] text-[#060b15] shadow-md shadow-[#00c9a7]/30'
                    : 'text-[#94a3b8] hover:bg-[#1a3353]/60 hover:text-white'
                }`}
              >
                {tab}
              </button>
            ))}
          </nav>
        </header>

        {/* Main Content */}
        <main className="flex min-h-[800px] flex-col gap-12 lg:flex-row">
          {/* Left Column — Input (40%) */}
          <div className="flex w-full lg:w-[40%] flex-col rounded-[2.5rem] bg-[#0d1a2d] p-16 border border-[#1a3353] shadow-2xl shadow-black/40">
            {renderInputArea()}
          </div>

          {/* Right Column — Results (60%) */}
          <div className="flex w-full lg:w-[60%] flex-col items-center justify-center rounded-[2.5rem] bg-[#0d1a2d] p-16 border border-[#1a3353] shadow-2xl shadow-black/40">
            {renderResultsArea()}
          </div>
        </main>
      </div>
    </div>
  );
}
