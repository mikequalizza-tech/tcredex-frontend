/**
 * tCredex Email Service
 * 
 * Send transactional emails using Resend (or fallback to console in dev)
 * 
 * Setup:
 * 1. Create account at resend.com
 * 2. Add RESEND_API_KEY to .env.local
 * 3. Verify your domain
 */

import * as templates from './templates';

// Email provider configuration
const RESEND_API_KEY = process.env.RESEND_API_KEY;
const FROM_EMAIL = process.env.EMAIL_FROM || 'tCredex <noreply@tcredex.com>';
const IS_DEV = process.env.NODE_ENV === 'development';

interface SendEmailParams {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
}

/**
 * Send an email via Resend API
 */
async function sendEmail(params: SendEmailParams): Promise<{ success: boolean; id?: string; error?: string }> {
  const { to, subject, html, text, replyTo } = params;
  
  // In development, just log the email
  if (IS_DEV && !RESEND_API_KEY) {
    console.log('\n📧 [EMAIL - DEV MODE]');
    console.log('To:', to);
    console.log('Subject:', subject);
    console.log('---');
    console.log(text || 'HTML email - check templates');
    console.log('---\n');
    return { success: true, id: 'dev-' + Date.now() };
  }

  if (!RESEND_API_KEY) {
    console.error('RESEND_API_KEY not configured');
    return { success: false, error: 'Email service not configured' };
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: Array.isArray(to) ? to : [to],
        subject,
        html,
        text,
        reply_to: replyTo,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Email send error:', data);
      return { success: false, error: data.message || 'Failed to send email' };
    }

    return { success: true, id: data.id };
  } catch (error) {
    console.error('Email send error:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

/**
 * Email sending functions for each template
 */
export const email = {
  /**
   * Send account confirmation email
   */
  confirmEmail: async (to: string, userName: string, confirmUrl: string) => {
    const { subject, html, text } = templates.confirmEmailTemplate({ userName, confirmUrl });
    return sendEmail({ to, subject, html, text });
  },

  /**
   * Send welcome email after confirmation
   */
  welcome: async (to: string, userName: string, role: 'sponsor' | 'cde' | 'investor') => {
    const { subject, html, text } = templates.welcomeTemplate({ userName, role });
    return sendEmail({ to, subject, html, text });
  },

  /**
   * Send deal submitted confirmation
   */
  dealSubmitted: async (to: string, userName: string, projectName: string, dealId: string) => {
    const { subject, html, text } = templates.dealSubmittedTemplate({ userName, projectName, dealId });
    return sendEmail({ to, subject, html, text });
  },

  /**
   * Send CDE match notification
   */
  cdeMatch: async (to: string, userName: string, projectName: string, cdeName: string, dealId: string) => {
    const { subject, html, text } = templates.cdeMatchTemplate({ userName, projectName, cdeName, dealId });
    return sendEmail({ to, subject, html, text });
  },

  /**
   * Send new message notification
   */
  newMessage: async (
    to: string,
    userName: string,
    senderName: string,
    senderOrg: string,
    projectName: string,
    messagePreview: string,
    dealId: string
  ) => {
    const { subject, html, text } = templates.newMessageTemplate({
      userName,
      senderName,
      senderOrg,
      projectName,
      messagePreview,
      dealId,
    });
    return sendEmail({ to, subject, html, text });
  },

  /**
   * Send document request notification
   */
  documentRequested: async (
    to: string,
    userName: string,
    requesterName: string,
    documentType: string,
    projectName: string,
    dealId: string
  ) => {
    const { subject, html, text } = templates.documentRequestedTemplate({
      userName,
      requesterName,
      documentType,
      projectName,
      dealId,
    });
    return sendEmail({ to, subject, html, text });
  },

  /**
   * Send deal approved notification
   */
  dealApproved: async (to: string, userName: string, projectName: string, dealId: string) => {
    const { subject, html, text } = templates.dealApprovedTemplate({ userName, projectName, dealId });
    return sendEmail({ to, subject, html, text });
  },

  /**
   * Send offer expiring warning
   */
  offerExpiring: async (
    to: string,
    userName: string,
    projectName: string,
    cdeName: string,
    hoursLeft: number,
    dealId: string
  ) => {
    const { subject, html, text } = templates.offerExpiringTemplate({
      userName,
      projectName,
      cdeName,
      hoursLeft,
      dealId,
    });
    return sendEmail({ to, subject, html, text });
  },

  /**
   * Send password reset email
   */
  passwordReset: async (to: string, userName: string, resetUrl: string) => {
    const { subject, html, text } = templates.passwordResetTemplate({ userName, resetUrl });
    return sendEmail({ to, subject, html, text });
  },

  /**
   * Send profile added notification (Preqin-style)
   */
  profileAdded: async (
    to: string,
    organizationName: string,
    organizationType: 'CDE' | 'Investor' | 'Sponsor' | 'Lender',
    claimUrl: string,
    contactName?: string
  ) => {
    const { subject, html, text } = templates.profileAddedTemplate({
      contactName,
      organizationName,
      organizationType,
      claimUrl,
    });
    return sendEmail({ to, subject, html, text });
  },

  /**
   * Send deal inquiry / expression of interest
   */
  dealInquiry: async (
    to: string,
    userName: string,
    projectName: string,
    inquirerName: string,
    inquirerOrg: string,
    inquirerRole: string,
    dealId: string,
    message?: string
  ) => {
    const { subject, html, text } = templates.dealInquiryTemplate({
      userName,
      projectName,
      inquirerName,
      inquirerOrg,
      inquirerRole,
      message,
      dealId,
    });
    return sendEmail({ to, subject, html, text });
  },

  /**
   * Send weekly digest
   */
  weeklyDigest: async (
    to: string,
    userName: string,
    stats: { newDeals: number; newMatches: number; unreadMessages: number },
    featuredDeals?: Array<{
      projectName: string;
      city: string;
      state: string;
      programType: string;
      allocation: number;
    }>
  ) => {
    const { subject, html, text } = templates.weeklyDigestTemplate({
      userName,
      stats,
      featuredDeals,
    });
    return sendEmail({ to, subject, html, text });
  },

  /**
   * Send allocation announcement to CDEs
   */
  allocationAnnouncement: async (
    to: string,
    cdeName: string,
    allocationAmount: number,
    allocationYear: number,
    contactName?: string
  ) => {
    const { subject, html, text } = templates.allocationAnnouncementTemplate({
      cdeName,
      contactName,
      allocationAmount,
      allocationYear,
    });
    return sendEmail({ to, subject, html, text });
  },
};

export default email;
