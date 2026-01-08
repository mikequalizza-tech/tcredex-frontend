'use client';

import { useState, useEffect } from 'react';
import { useCurrentUser } from '@/lib/auth';
import { usePathname } from 'next/navigation';
import MessagingPopup from './MessagingPopup';

interface MessagingButtonProps {
  dealId?: string;
  className?: string;
}

export default function MessagingButton({ dealId, className = '' }: MessagingButtonProps) {
  const { organizationId } = useCurrentUser();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // Don't load messaging on intake page - it's not needed there
  const shouldLoadMessaging = pathname !== '/intake' && organizationId;

  // Load unread count
  useEffect(() => {
    if (shouldLoadMessaging) {
      loadUnreadCount();
      // Poll for updates every 30 seconds
      const interval = setInterval(loadUnreadCount, 30000);
      return () => clearInterval(interval);
    } else {
      // Reset count if not loading messaging
      setUnreadCount(0);
    }
  }, [shouldLoadMessaging]);

  const loadUnreadCount = async () => {
    // Don't load if we shouldn't be loading messaging
    if (!shouldLoadMessaging) {
      setUnreadCount(0);
      return;
    }

    try {
      // Get deals for organization
      const dealsResponse = await fetch(`/api/deals?organizationId=${organizationId}`);
      
      if (!dealsResponse.ok) {
        // Silently handle API errors - messaging is not critical
        setUnreadCount(0);
        return;
      }
      
      const deals = await dealsResponse.json();
      
      // Ensure deals is an array
      if (!Array.isArray(deals)) {
        setUnreadCount(0);
        return;
      }
      
      let totalUnread = 0;
      
      // Check messages for each deal
      for (const deal of deals) {
        try {
          const messagesResponse = await fetch(`/api/messages?dealId=${deal.id}`);
          
          if (!messagesResponse.ok) {
            continue; // Skip this deal if messages fail to load
          }
          
          const messages = await messagesResponse.json();
          
          // Ensure messages is an array
          if (!Array.isArray(messages)) {
            continue;
          }
          
          // Count unread messages (simple logic - messages from last hour that aren't from current user)
          const oneHourAgo = Date.now() - (60 * 60 * 1000);
          const unreadInDeal = messages.filter((m: any) => 
            !m.isOwn && new Date(m.createdAt).getTime() > oneHourAgo
          ).length;
          
          totalUnread += unreadInDeal;
        } catch (dealError) {
          // Skip individual deal errors
          continue;
        }
      }
      
      setUnreadCount(totalUnread);
    } catch (error) {
      // Silently handle errors - messaging is not critical for most pages
      setUnreadCount(0);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className={`relative inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors ${className}`}
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
        <span>Messages</span>
        {unreadCount > 0 && (
          <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      <MessagingPopup 
        isOpen={isOpen} 
        onClose={() => setIsOpen(false)} 
      />
    </>
  );
}