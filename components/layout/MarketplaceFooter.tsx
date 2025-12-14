'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';

interface MarketplaceFooterProps {
  onChatSubmit?: (message: string) => void;
}

export default function MarketplaceFooter({ onChatSubmit }: MarketplaceFooterProps) {
  const [chatMessage, setChatMessage] = useState('');
  const [chatHistory, setChatHistory] = useState<{ role: 'user' | 'assistant'; content: string }[]>([
    {
      role: 'assistant',
      content: "I'm ChatTC, your tax credit marketplace assistant. I can help you find projects, filter by program type, analyze pricing, or answer questions about NMTC, HTC, LIHTC, and OZ credits. What are you looking for?",
    },
  ]);
  const [isExpanded, setIsExpanded] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatMessage.trim()) return;

    // Add user message
    setChatHistory((prev) => [...prev, { role: 'user', content: chatMessage }]);

    // Simulate AI response (in production, this calls the API)
    setTimeout(() => {
      setChatHistory((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: `I found several projects matching "${chatMessage}". Let me filter the marketplace for you. You can also use the column filters above to narrow down by program type, state, or allocation amount.`,
        },
      ]);
    }, 1000);

    if (onChatSubmit) {
      onChatSubmit(chatMessage);
    }

    setChatMessage('');
  };

  return (
    <footer className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-40">
      {/* Expanded Chat Panel */}
      {isExpanded && (
        <div className="border-b border-gray-200 bg-gray-50">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-between px-4 py-2 border-b border-gray-200">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-green-600 flex items-center justify-center">
                  <span className="text-white text-xs font-bold">TC</span>
                </div>
                <span className="font-medium text-gray-900">ChatTC</span>
                <span className="text-xs text-gray-500">AI Assistant</span>
              </div>
              <button
                onClick={() => setIsExpanded(false)}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            </div>
            <div className="h-64 overflow-y-auto p-4 space-y-4">
              {chatHistory.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] px-4 py-2 rounded-lg ${
                      msg.role === 'user'
                        ? 'bg-green-600 text-white'
                        : 'bg-white border border-gray-200 text-gray-700'
                    }`}
                  >
                    <p className="text-sm">{msg.content}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Footer Bar */}
      <div className="flex items-center justify-between px-4 py-3">
        {/* Left - Logo & Links */}
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-green-600 flex items-center justify-center">
              <span className="text-white font-bold text-sm">tC</span>
            </div>
            <span className="font-semibold text-gray-900 hidden sm:inline">tCredex</span>
          </Link>
          <nav className="hidden md:flex items-center gap-4 text-sm">
            <Link href="/about" className="text-gray-600 hover:text-gray-900">
              About
            </Link>
            <Link href="/features" className="text-gray-600 hover:text-gray-900">
              Features
            </Link>
            <Link href="/contact" className="text-gray-600 hover:text-gray-900">
              Contact
            </Link>
            <Link href="/support" className="text-gray-600 hover:text-gray-900">
              Support
            </Link>
          </nav>
        </div>

        {/* Center - Chat Input */}
        <form onSubmit={handleSubmit} className="flex-1 max-w-xl mx-4">
          <div className="relative flex items-center">
            <button
              type="button"
              onClick={() => setIsExpanded(!isExpanded)}
              className="absolute left-3 text-gray-400 hover:text-green-600"
            >
              <div className="w-6 h-6 rounded-full bg-green-600 flex items-center justify-center">
                <span className="text-white text-xs font-bold">TC</span>
              </div>
            </button>
            <input
              type="text"
              value={chatMessage}
              onChange={(e) => setChatMessage(e.target.value)}
              onFocus={() => setIsExpanded(true)}
              placeholder="Ask ChatTC anything..."
              className="w-full pl-12 pr-24 py-2 border border-gray-300 rounded-full focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm"
            />
            <button
              type="submit"
              className="absolute right-2 px-3 py-1 bg-green-600 text-white rounded-full text-sm font-medium hover:bg-green-700 transition-colors"
            >
              Send
            </button>
          </div>
        </form>

        {/* Right - Copyright */}
        <div className="hidden lg:flex items-center gap-4 text-sm text-gray-500">
          <span>© 2025 tCredex</span>
        </div>
      </div>
    </footer>
  );
}
