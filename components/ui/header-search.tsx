"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";

interface SearchResult {
  type: 'page' | 'blog' | 'deal' | 'help';
  title: string;
  href: string;
  description?: string;
}

// Static pages for instant search
const staticPages: SearchResult[] = [
  { type: 'page', title: 'Home', href: '/', description: 'tCredex homepage' },
  { type: 'page', title: 'Map', href: '/map', description: 'Interactive deal map with census tract data' },
  { type: 'page', title: 'Marketplace', href: '/deals', description: 'Browse tax credit opportunities' },
  { type: 'page', title: 'Pricing Coach', href: '/pricing', description: 'Get pricing guidance for deals' },
  { type: 'page', title: 'Submit Deal', href: '/intake', description: 'Submit a new deal to the marketplace' },
  { type: 'page', title: 'Features', href: '/features', description: 'Platform capabilities' },
  { type: 'page', title: 'How It Works', href: '/how-it-works', description: 'Step-by-step process' },
  { type: 'page', title: 'Who We Serve', href: '/who-we-serve', description: 'Sponsors, CDEs, and Investors' },
  { type: 'page', title: 'About', href: '/about', description: 'Our mission and team' },
  { type: 'page', title: 'Blog', href: '/blog', description: 'Tax credit insights and news' },
  { type: 'page', title: 'Help Center', href: '/help', description: 'Get help with tCredex platform' },
  { type: 'page', title: 'Sign In', href: '/signin', description: 'Log into your account' },
  { type: 'page', title: 'Register', href: '/signup', description: 'Create a new account' },
  { type: 'page', title: 'Dashboard', href: '/dashboard', description: 'Your dashboard' },
  { type: 'page', title: 'Settings', href: '/dashboard/settings', description: 'Account settings' },
  // Blog posts
  { type: 'blog', title: 'NMTC Overview', href: '/blog/tcredex-five-tax-credit-platform', description: 'The first platform for all five tax-credit programs' },
  { type: 'blog', title: 'Blended Capital Stacks', href: '/blog/blended-capital-stacks-how-to-combine-tax-credits', description: 'How to combine NMTC, LIHTC, HTC, and OZ' },
  { type: 'blog', title: 'QALICB Qualification', href: '/blog/qalicb-qualification-technical-rules-nmtc-practitioners', description: 'Technical rules every NMTC practitioner must master' },
  { type: 'blog', title: 'HTC/NMTC Master Lease', href: '/blog/htc-nmtc-master-lease-structures-how-they-work', description: 'How master lease structures work' },
  { type: 'blog', title: 'Opportunity Zones', href: '/blog/opportunity-zones-what-developers-investors-need-to-know', description: 'What developers and investors need to know' },
  { type: 'blog', title: 'State Tax Credits', href: '/blog/state-tax-credits-missing-layer-modern-capital-stacks', description: 'The missing layer in modern capital stacks' },
  { type: 'blog', title: 'Compliance Pitfalls', href: '/blog/compliance-pitfalls-in-tax-credit-deals', description: 'Common pitfalls and how to avoid them' },
];

export default function HeaderSearch() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Handle search
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const q = query.toLowerCase();
    const filtered = staticPages.filter(
      page => 
        page.title.toLowerCase().includes(q) || 
        page.description?.toLowerCase().includes(q)
    ).slice(0, 8);

    setResults(filtered);
  }, [query]);

  // Handle keyboard shortcut (Cmd/Ctrl + K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(true);
        setTimeout(() => inputRef.current?.focus(), 100);
      }
      if (e.key === 'Escape') {
        setIsOpen(false);
        setQuery('');
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (href: string) => {
    setIsOpen(false);
    setQuery('');
    router.push(href);
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'blog':
        return '📝';
      case 'deal':
        return '💼';
      case 'help':
        return '❓';
      default:
        return '📄';
    }
  };

  return (
    <div className="relative" ref={containerRef}>
      {/* Search trigger button */}
      <button
        onClick={() => {
          setIsOpen(true);
          setTimeout(() => inputRef.current?.focus(), 100);
        }}
        className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-400 bg-gray-800/50 hover:bg-gray-800 rounded-lg border border-gray-700 transition-colors"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <span className="hidden sm:inline">Search</span>
        <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-xs text-gray-500 bg-gray-900 rounded border border-gray-700">
          <span className="text-[10px]">⌘</span>K
        </kbd>
      </button>

      {/* Search modal */}
      {isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-start justify-center pt-[20vh] bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-lg mx-4 bg-gray-900 border border-gray-700 rounded-xl shadow-2xl overflow-hidden">
            {/* Search input */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-800">
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                ref={inputRef}
                type="text"
                placeholder="Search pages, blog posts, features..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="flex-1 bg-transparent text-gray-200 placeholder-gray-500 outline-none"
                autoComplete="off"
                autoFocus
              />
              <button
                onClick={() => {
                  setIsOpen(false);
                  setQuery('');
                }}
                className="text-xs text-gray-500 hover:text-gray-400 px-2 py-1 rounded border border-gray-700"
              >
                ESC
              </button>
            </div>

            {/* Results */}
            <div className="max-h-80 overflow-y-auto">
              {results.length > 0 ? (
                <ul className="py-2">
                  {results.map((result, index) => (
                    <li key={index}>
                      <button
                        onClick={() => handleSelect(result.href)}
                        className="w-full flex items-center gap-3 px-4 py-2 hover:bg-gray-800 transition-colors text-left"
                      >
                        <span className="text-lg">{getTypeIcon(result.type)}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-200 truncate">{result.title}</p>
                          {result.description && (
                            <p className="text-xs text-gray-500 truncate">{result.description}</p>
                          )}
                        </div>
                        <span className="text-xs text-gray-600 uppercase">{result.type}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              ) : query ? (
                <div className="px-4 py-8 text-center text-gray-500">
                  <p>No results found for "{query}"</p>
                </div>
              ) : (
                <div className="px-4 py-4">
                  <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Quick Links</p>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { name: 'Map', href: '/map' },
                      { name: 'Submit Deal', href: '/intake' },
                      { name: 'Blog', href: '/blog' },
                      { name: 'Help', href: '/help' },
                    ].map((link) => (
                      <button
                        key={link.href}
                        onClick={() => handleSelect(link.href)}
                        className="px-3 py-2 text-sm text-gray-300 bg-gray-800/50 hover:bg-gray-800 rounded-lg transition-colors"
                      >
                        {link.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
