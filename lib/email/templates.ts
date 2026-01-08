/**
 * tCredex Email Templates
 * Professional transactional emails
 */

// Brand colors
const COLORS = {
  primary: '#6366f1',    // Indigo
  success: '#22c55e',    // Green
  warning: '#f59e0b',    // Amber
  dark: '#111827',       // Gray-900
  gray: '#6b7280',       // Gray-500
  light: '#f3f4f6',      // Gray-100
  white: '#ffffff',
};

// Use a text-based logo as fallback for better email compatibility
const LOGO_HTML = `
  <div style="text-align: center; padding: 16px 0;">
    <h1 style="margin: 0; font-family: Arial, sans-serif; font-size: 32px; font-weight: bold; color: #6538D4;">
      t<span style="color: #3C91F5;">Credex</span><span style="color: #3C91F5; font-size: 24px;">.com</span>
    </h1>
    <p style="margin: 8px 0 0; color: #6B7280; font-size: 14px; font-family: Arial, sans-serif;">AI-Powered Tax Credit Marketplace</p>
  </div>
`;

/**
 * Base email layout wrapper
 */
export function baseTemplate(content: string, preheader?: string): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>tCredex</title>
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
  <style>
    body { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; }
    table { border-collapse: collapse; }
    img { border: 0; display: block; }
    .button { background-color: ${COLORS.primary}; color: #ffffff !important; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; display: inline-block; }
    .button:hover { background-color: #4f46e5; }
    .button-success { background-color: ${COLORS.success}; }
    .button-warning { background-color: ${COLORS.warning}; }
    @media only screen and (max-width: 600px) {
      .container { width: 100% !important; }
      .content { padding: 24px !important; }
      .logo-img { width: 180px !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: ${COLORS.light};">
  ${preheader ? `<div style="display: none; max-height: 0; overflow: hidden;">${preheader}</div>` : ''}

  <!-- Wrapper -->
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: ${COLORS.light};">
    <tr>
      <td align="center" style="padding: 40px 20px;">

        <!-- Container -->
        <table role="presentation" class="container" width="600" cellpadding="0" cellspacing="0" style="background-color: ${COLORS.white}; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);">

          <!-- Header with Logo -->
          <tr>
            <td align="center" style="padding: 32px 40px 24px; border-bottom: 1px solid ${COLORS.light};">
              <a href="https://tcredex.com" style="text-decoration: none;">
                ${LOGO_HTML}
              </a>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td class="content" style="padding: 40px;">
              ${content}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 24px 40px; background-color: ${COLORS.dark}; border-radius: 0 0 12px 12px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <!-- Social Links -->
                    <table role="presentation" cellpadding="0" cellspacing="0" style="margin-bottom: 16px;">
                      <tr>
                        <td style="padding: 0 8px;">
                          <a href="https://linkedin.com/company/tcredex" style="color: ${COLORS.gray}; text-decoration: none; font-size: 13px;">LinkedIn</a>
                        </td>
                        <td style="padding: 0 8px;">
                          <a href="https://twitter.com/tcredex" style="color: ${COLORS.gray}; text-decoration: none; font-size: 13px;">X (Twitter)</a>
                        </td>
                      </tr>
                    </table>

                    <p style="margin: 0 0 8px; color: ${COLORS.gray}; font-size: 12px;">
                      tCredex | AI-Powered Tax Credit Marketplace
                    </p>
                    <p style="margin: 0 0 8px; color: ${COLORS.gray}; font-size: 12px;">
                      Connecting sponsors, CDEs, and investors for NMTC, HTC, LIHTC, and Opportunity Zone deals.
                    </p>
                    <p style="margin: 0 0 12px; color: ${COLORS.gray}; font-size: 11px;">
                      <a href="https://tcredex.com/unsubscribe" style="color: ${COLORS.gray};">Unsubscribe</a> ·
                      <a href="https://tcredex.com/privacy" style="color: ${COLORS.gray};">Privacy Policy</a>
                    </p>

                    <!-- Legal Disclaimer -->
                    <p style="margin: 12px 0 0; padding-top: 12px; border-top: 1px solid #374151; color: #4b5563; font-size: 10px; line-height: 1.5;">
                      This email and any attachments are confidential and intended solely for the addressee.
                      tCredex is a product of American Impact Ventures LLC.
                      Tax credit investments involve risk. Past performance is not indicative of future results.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

        </table>

      </td>
    </tr>
  </table>
</body>
</html>
`;
}

/**
 * Email: Confirm Your Account
 */
export function confirmEmailTemplate(params: {
  userName: string;
  confirmUrl: string;
}): { subject: string; html: string; text: string } {
  const { userName, confirmUrl } = params;
  
  const content = `
    <h1 style="margin: 0 0 16px; color: ${COLORS.dark}; font-size: 24px; font-weight: 700;">
      Please confirm your tCredex account
    </h1>
    
    <p style="margin: 0 0 24px; color: ${COLORS.gray}; font-size: 16px; line-height: 1.6;">
      Dear ${userName},
    </p>
    
    <p style="margin: 0 0 24px; color: ${COLORS.gray}; font-size: 16px; line-height: 1.6;">
      Thank you for your interest in tCredex – the AI-powered tax credit marketplace connecting sponsors, CDEs, and investors.
    </p>
    
    <p style="margin: 0 0 24px; color: ${COLORS.gray}; font-size: 16px; line-height: 1.6;">
      For exclusive access to deal matching, eligibility tools, and marketplace features, please confirm your email below to finish setting up your account.
    </p>
    
    <p style="margin: 0 0 8px; color: ${COLORS.dark}; font-size: 15px; font-weight: 600;">
      Just one more step and you'll be set
    </p>
    
    <table role="presentation" cellpadding="0" cellspacing="0" style="margin: 24px 0;">
      <tr>
        <td>
          <a href="${confirmUrl}" class="button" style="background-color: ${COLORS.primary}; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; display: inline-block;">
            Confirm Your Email
          </a>
        </td>
      </tr>
    </table>
    
    <p style="margin: 24px 0 0; color: ${COLORS.gray}; font-size: 14px; line-height: 1.6;">
      To log in, please use the email address and password entered during sign-up. If you have any questions, please don't hesitate to <a href="mailto:support@tcredex.com" style="color: ${COLORS.primary};">get in touch</a>.
    </p>
    
    <p style="margin: 24px 0 0; color: ${COLORS.dark}; font-size: 16px;">
      Many Thanks,<br>
      <strong>The tCredex Team</strong>
    </p>
  `;

  return {
    subject: 'Please confirm your tCredex account',
    html: baseTemplate(content, 'Confirm your email to access tCredex'),
    text: `Dear ${userName},\n\nPlease confirm your tCredex account by visiting: ${confirmUrl}\n\nMany Thanks,\nThe tCredex Team`,
  };
}

/**
 * Email: Welcome to tCredex
 */
export function welcomeTemplate(params: {
  userName: string;
  role: 'sponsor' | 'cde' | 'investor';
}): { subject: string; html: string; text: string } {
  const { userName, role } = params;
  
  const roleMessages = {
    sponsor: 'Start by submitting your first deal through our streamlined intake form.',
    cde: 'Browse the marketplace to find qualified projects that match your allocation criteria.',
    investor: 'Explore tax credit opportunities and connect with CDEs managing deals.',
  };
  
  const content = `
    <h1 style="margin: 0 0 16px; color: ${COLORS.dark}; font-size: 24px; font-weight: 700;">
      🎉 Welcome to tCredex!
    </h1>
    
    <p style="margin: 0 0 24px; color: ${COLORS.gray}; font-size: 16px; line-height: 1.6;">
      Dear ${userName},
    </p>
    
    <p style="margin: 0 0 24px; color: ${COLORS.gray}; font-size: 16px; line-height: 1.6;">
      Your account is now active. You're officially part of the AI-powered tax credit marketplace.
    </p>
    
    <p style="margin: 0 0 24px; color: ${COLORS.gray}; font-size: 16px; line-height: 1.6;">
      ${roleMessages[role]}
    </p>
    
    <div style="background-color: ${COLORS.light}; border-radius: 8px; padding: 20px; margin: 24px 0;">
      <p style="margin: 0 0 12px; color: ${COLORS.dark}; font-size: 15px; font-weight: 600;">
        Quick Start:
      </p>
      <ul style="margin: 0; padding-left: 20px; color: ${COLORS.gray}; font-size: 14px; line-height: 1.8;">
        <li>Check any address for tax credit eligibility</li>
        <li>Browse available deals in the marketplace</li>
        <li>Complete your profile for better matches</li>
        <li>Download our mobile app to monitor deals on the go</li>
      </ul>
    </div>
    
    <table role="presentation" cellpadding="0" cellspacing="0" style="margin: 24px 0;">
      <tr>
        <td>
          <a href="https://tcredex.com/dashboard" class="button" style="background-color: ${COLORS.success}; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; display: inline-block;">
            Go to Dashboard
          </a>
        </td>
      </tr>
    </table>
    
    <p style="margin: 24px 0 0; color: ${COLORS.dark}; font-size: 16px;">
      Welcome aboard,<br>
      <strong>The tCredex Team</strong>
    </p>
  `;

  return {
    subject: '🎉 Welcome to tCredex!',
    html: baseTemplate(content, 'Your tCredex account is ready'),
    text: `Dear ${userName},\n\nWelcome to tCredex! Your account is now active.\n\n${roleMessages[role]}\n\nVisit your dashboard: https://tcredex.com/dashboard\n\nThe tCredex Team`,
  };
}

/**
 * Email: Deal Submitted
 */
export function dealSubmittedTemplate(params: {
  userName: string;
  projectName: string;
  dealId: string;
}): { subject: string; html: string; text: string } {
  const { userName, projectName, dealId } = params;
  
  const content = `
    <h1 style="margin: 0 0 16px; color: ${COLORS.dark}; font-size: 24px; font-weight: 700;">
      ✅ Deal Submitted Successfully
    </h1>
    
    <p style="margin: 0 0 24px; color: ${COLORS.gray}; font-size: 16px; line-height: 1.6;">
      Dear ${userName},
    </p>
    
    <p style="margin: 0 0 24px; color: ${COLORS.gray}; font-size: 16px; line-height: 1.6;">
      Your deal <strong style="color: ${COLORS.dark};">${projectName}</strong> has been submitted to the tCredex marketplace.
    </p>
    
    <div style="background-color: ${COLORS.light}; border-radius: 8px; padding: 20px; margin: 24px 0;">
      <p style="margin: 0 0 12px; color: ${COLORS.dark}; font-size: 15px; font-weight: 600;">
        What happens next:
      </p>
      <ol style="margin: 0; padding-left: 20px; color: ${COLORS.gray}; font-size: 14px; line-height: 1.8;">
        <li>Our team will review your submission (24-48 hours)</li>
        <li>AutoMatch AI will identify potential CDE partners</li>
        <li>You'll receive notifications when matches are found</li>
        <li>CDEs can message you directly through the platform</li>
      </ol>
    </div>
    
    <table role="presentation" cellpadding="0" cellspacing="0" style="margin: 24px 0;">
      <tr>
        <td>
          <a href="https://tcredex.com/deals/${dealId}" class="button" style="background-color: ${COLORS.primary}; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; display: inline-block;">
            View Your Deal
          </a>
        </td>
      </tr>
    </table>
    
    <p style="margin: 24px 0 0; color: ${COLORS.gray}; font-size: 14px; line-height: 1.6;">
      <strong>Tip:</strong> Complete your deal profile to increase match quality. Upload site photos, financial projections, and Phase I documents when available.
    </p>
    
    <p style="margin: 24px 0 0; color: ${COLORS.dark}; font-size: 16px;">
      Thank you for using tCredex,<br>
      <strong>The tCredex Team</strong>
    </p>
  `;

  return {
    subject: `✅ Deal Submitted: ${projectName}`,
    html: baseTemplate(content, `Your deal ${projectName} has been submitted`),
    text: `Dear ${userName},\n\nYour deal "${projectName}" has been submitted to tCredex.\n\nView your deal: https://tcredex.com/deals/${dealId}\n\nThe tCredex Team`,
  };
}

/**
 * Email: CDE Match Found
 */
export function cdeMatchTemplate(params: {
  userName: string;
  projectName: string;
  cdeName: string;
  dealId: string;
}): { subject: string; html: string; text: string } {
  const { userName, projectName, cdeName, dealId } = params;
  
  const content = `
    <h1 style="margin: 0 0 16px; color: ${COLORS.dark}; font-size: 24px; font-weight: 700;">
      🎯 New CDE Match Found!
    </h1>
    
    <p style="margin: 0 0 24px; color: ${COLORS.gray}; font-size: 16px; line-height: 1.6;">
      Dear ${userName},
    </p>
    
    <p style="margin: 0 0 24px; color: ${COLORS.gray}; font-size: 16px; line-height: 1.6;">
      Great news! Our AutoMatch AI has identified a potential partner for your project.
    </p>
    
    <div style="background-color: ${COLORS.light}; border-radius: 8px; padding: 20px; margin: 24px 0; border-left: 4px solid ${COLORS.primary};">
      <p style="margin: 0 0 8px; color: ${COLORS.dark}; font-size: 18px; font-weight: 600;">
        ${cdeName}
      </p>
      <p style="margin: 0; color: ${COLORS.gray}; font-size: 14px;">
        is interested in <strong>${projectName}</strong>
      </p>
    </div>
    
    <p style="margin: 0 0 24px; color: ${COLORS.gray}; font-size: 16px; line-height: 1.6;">
      Log in to view their profile, allocation availability, and send them a message.
    </p>
    
    <table role="presentation" cellpadding="0" cellspacing="0" style="margin: 24px 0;">
      <tr>
        <td>
          <a href="https://tcredex.com/deals/${dealId}" class="button" style="background-color: ${COLORS.primary}; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; display: inline-block;">
            View Match Details
          </a>
        </td>
      </tr>
    </table>
    
    <p style="margin: 24px 0 0; color: ${COLORS.dark}; font-size: 16px;">
      Good luck,<br>
      <strong>The tCredex Team</strong>
    </p>
  `;

  return {
    subject: `🎯 New CDE Match: ${cdeName} for ${projectName}`,
    html: baseTemplate(content, `${cdeName} is interested in your project`),
    text: `Dear ${userName},\n\n${cdeName} is a match for your project "${projectName}".\n\nView match: https://tcredex.com/deals/${dealId}\n\nThe tCredex Team`,
  };
}

/**
 * Email: New Message
 */
export function newMessageTemplate(params: {
  userName: string;
  senderName: string;
  senderOrg: string;
  projectName: string;
  messagePreview: string;
  dealId: string;
}): { subject: string; html: string; text: string } {
  const { userName, senderName, senderOrg, projectName, messagePreview, dealId } = params;
  
  const content = `
    <h1 style="margin: 0 0 16px; color: ${COLORS.dark}; font-size: 24px; font-weight: 700;">
      💬 New Message
    </h1>
    
    <p style="margin: 0 0 24px; color: ${COLORS.gray}; font-size: 16px; line-height: 1.6;">
      Dear ${userName},
    </p>
    
    <p style="margin: 0 0 24px; color: ${COLORS.gray}; font-size: 16px; line-height: 1.6;">
      You have a new message regarding <strong style="color: ${COLORS.dark};">${projectName}</strong>.
    </p>
    
    <div style="background-color: ${COLORS.light}; border-radius: 8px; padding: 20px; margin: 24px 0;">
      <p style="margin: 0 0 8px; color: ${COLORS.dark}; font-size: 14px; font-weight: 600;">
        ${senderName} · ${senderOrg}
      </p>
      <p style="margin: 0; color: ${COLORS.gray}; font-size: 15px; font-style: italic;">
        "${messagePreview.length > 150 ? messagePreview.substring(0, 150) + '...' : messagePreview}"
      </p>
    </div>
    
    <table role="presentation" cellpadding="0" cellspacing="0" style="margin: 24px 0;">
      <tr>
        <td>
          <a href="https://tcredex.com/deals/${dealId}/messages" class="button" style="background-color: ${COLORS.primary}; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; display: inline-block;">
            Reply Now
          </a>
        </td>
      </tr>
    </table>
    
    <p style="margin: 24px 0 0; color: ${COLORS.dark}; font-size: 16px;">
      Best,<br>
      <strong>The tCredex Team</strong>
    </p>
  `;

  return {
    subject: `💬 ${senderName} sent you a message on ${projectName}`,
    html: baseTemplate(content, `New message from ${senderName}`),
    text: `Dear ${userName},\n\n${senderName} from ${senderOrg} sent you a message on "${projectName}":\n\n"${messagePreview}"\n\nReply: https://tcredex.com/deals/${dealId}/messages\n\nThe tCredex Team`,
  };
}

/**
 * Email: Document Requested
 */
export function documentRequestedTemplate(params: {
  userName: string;
  requesterName: string;
  documentType: string;
  projectName: string;
  dealId: string;
}): { subject: string; html: string; text: string } {
  const { userName, requesterName, documentType, projectName, dealId } = params;
  
  const content = `
    <h1 style="margin: 0 0 16px; color: ${COLORS.dark}; font-size: 24px; font-weight: 700;">
      📄 Document Requested
    </h1>
    
    <p style="margin: 0 0 24px; color: ${COLORS.gray}; font-size: 16px; line-height: 1.6;">
      Dear ${userName},
    </p>
    
    <p style="margin: 0 0 24px; color: ${COLORS.gray}; font-size: 16px; line-height: 1.6;">
      <strong style="color: ${COLORS.dark};">${requesterName}</strong> has requested a document for <strong style="color: ${COLORS.dark};">${projectName}</strong>.
    </p>
    
    <div style="background-color: ${COLORS.light}; border-radius: 8px; padding: 20px; margin: 24px 0; border-left: 4px solid ${COLORS.warning};">
      <p style="margin: 0 0 4px; color: ${COLORS.gray}; font-size: 12px; text-transform: uppercase;">
        Requested Document
      </p>
      <p style="margin: 0; color: ${COLORS.dark}; font-size: 18px; font-weight: 600;">
        ${documentType}
      </p>
    </div>
    
    <p style="margin: 0 0 24px; color: ${COLORS.gray}; font-size: 16px; line-height: 1.6;">
      Please upload this document to keep your deal moving forward.
    </p>
    
    <table role="presentation" cellpadding="0" cellspacing="0" style="margin: 24px 0;">
      <tr>
        <td>
          <a href="https://tcredex.com/deals/${dealId}/documents" class="button" style="background-color: ${COLORS.warning}; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; display: inline-block;">
            Upload Document
          </a>
        </td>
      </tr>
    </table>
    
    <p style="margin: 24px 0 0; color: ${COLORS.dark}; font-size: 16px;">
      Thank you,<br>
      <strong>The tCredex Team</strong>
    </p>
  `;

  return {
    subject: `📄 ${documentType} requested for ${projectName}`,
    html: baseTemplate(content, `Please upload ${documentType}`),
    text: `Dear ${userName},\n\n${requesterName} has requested "${documentType}" for ${projectName}.\n\nUpload: https://tcredex.com/deals/${dealId}/documents\n\nThe tCredex Team`,
  };
}

/**
 * Email: Deal Approved
 */
export function dealApprovedTemplate(params: {
  userName: string;
  projectName: string;
  dealId: string;
}): { subject: string; html: string; text: string } {
  const { userName, projectName, dealId } = params;
  
  const content = `
    <h1 style="margin: 0 0 16px; color: ${COLORS.dark}; font-size: 24px; font-weight: 700;">
      🎉 Deal Approved!
    </h1>
    
    <p style="margin: 0 0 24px; color: ${COLORS.gray}; font-size: 16px; line-height: 1.6;">
      Dear ${userName},
    </p>
    
    <p style="margin: 0 0 24px; color: ${COLORS.gray}; font-size: 16px; line-height: 1.6;">
      Congratulations! <strong style="color: ${COLORS.dark};">${projectName}</strong> has been approved and is now live in the tCredex marketplace.
    </p>
    
    <div style="background-color: #dcfce7; border-radius: 8px; padding: 20px; margin: 24px 0; text-align: center;">
      <p style="margin: 0; color: ${COLORS.success}; font-size: 18px; font-weight: 600;">
        ✅ Your deal is now visible to CDEs and investors
      </p>
    </div>
    
    <p style="margin: 0 0 24px; color: ${COLORS.gray}; font-size: 16px; line-height: 1.6;">
      Our AutoMatch AI is already searching for the best CDE partners. You'll be notified as matches are found.
    </p>
    
    <table role="presentation" cellpadding="0" cellspacing="0" style="margin: 24px 0;">
      <tr>
        <td>
          <a href="https://tcredex.com/deals/${dealId}" class="button" style="background-color: ${COLORS.success}; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; display: inline-block;">
            View Your Live Deal
          </a>
        </td>
      </tr>
    </table>
    
    <p style="margin: 24px 0 0; color: ${COLORS.dark}; font-size: 16px;">
      Congratulations again,<br>
      <strong>The tCredex Team</strong>
    </p>
  `;

  return {
    subject: `🎉 Approved: ${projectName} is now live!`,
    html: baseTemplate(content, 'Your deal has been approved'),
    text: `Dear ${userName},\n\nCongratulations! "${projectName}" has been approved and is now live.\n\nView: https://tcredex.com/deals/${dealId}\n\nThe tCredex Team`,
  };
}

/**
 * Email: Offer Expiring
 */
export function offerExpiringTemplate(params: {
  userName: string;
  projectName: string;
  cdeName: string;
  hoursLeft: number;
  dealId: string;
}): { subject: string; html: string; text: string } {
  const { userName, projectName, cdeName, hoursLeft, dealId } = params;
  
  const content = `
    <h1 style="margin: 0 0 16px; color: ${COLORS.dark}; font-size: 24px; font-weight: 700;">
      ⏳ Offer Expiring Soon
    </h1>
    
    <p style="margin: 0 0 24px; color: ${COLORS.gray}; font-size: 16px; line-height: 1.6;">
      Dear ${userName},
    </p>
    
    <p style="margin: 0 0 24px; color: ${COLORS.gray}; font-size: 16px; line-height: 1.6;">
      The offer from <strong style="color: ${COLORS.dark};">${cdeName}</strong> for <strong style="color: ${COLORS.dark};">${projectName}</strong> is expiring soon.
    </p>
    
    <div style="background-color: #fef3c7; border-radius: 8px; padding: 20px; margin: 24px 0; text-align: center; border: 2px solid ${COLORS.warning};">
      <p style="margin: 0 0 8px; color: ${COLORS.warning}; font-size: 14px; font-weight: 600; text-transform: uppercase;">
        Time Remaining
      </p>
      <p style="margin: 0; color: ${COLORS.dark}; font-size: 36px; font-weight: 700;">
        ${hoursLeft} hours
      </p>
    </div>
    
    <p style="margin: 0 0 24px; color: ${COLORS.gray}; font-size: 16px; line-height: 1.6;">
      Don't miss this opportunity. Take action now to keep your deal moving forward.
    </p>
    
    <table role="presentation" cellpadding="0" cellspacing="0" style="margin: 24px 0;">
      <tr>
        <td>
          <a href="https://tcredex.com/deals/${dealId}" class="button" style="background-color: ${COLORS.warning}; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; display: inline-block;">
            Respond to Offer
          </a>
        </td>
      </tr>
    </table>
    
    <p style="margin: 24px 0 0; color: ${COLORS.dark}; font-size: 16px;">
      Act fast,<br>
      <strong>The tCredex Team</strong>
    </p>
  `;

  return {
    subject: `⚠️ Offer expiring in ${hoursLeft} hours: ${projectName}`,
    html: baseTemplate(content, `Urgent: Offer expires in ${hoursLeft} hours`),
    text: `Dear ${userName},\n\nThe offer from ${cdeName} for "${projectName}" expires in ${hoursLeft} hours.\n\nRespond: https://tcredex.com/deals/${dealId}\n\nThe tCredex Team`,
  };
}

/**
 * Email: Password Reset
 */
export function passwordResetTemplate(params: {
  userName: string;
  resetUrl: string;
}): { subject: string; html: string; text: string } {
  const { userName, resetUrl } = params;
  
  const content = `
    <h1 style="margin: 0 0 16px; color: ${COLORS.dark}; font-size: 24px; font-weight: 700;">
      Reset your password
    </h1>
    
    <p style="margin: 0 0 24px; color: ${COLORS.gray}; font-size: 16px; line-height: 1.6;">
      Dear ${userName},
    </p>
    
    <p style="margin: 0 0 24px; color: ${COLORS.gray}; font-size: 16px; line-height: 1.6;">
      We received a request to reset your tCredex password. Click the button below to choose a new password.
    </p>
    
    <table role="presentation" cellpadding="0" cellspacing="0" style="margin: 24px 0;">
      <tr>
        <td>
          <a href="${resetUrl}" class="button" style="background-color: ${COLORS.primary}; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; display: inline-block;">
            Reset Password
          </a>
        </td>
      </tr>
    </table>
    
    <p style="margin: 24px 0 0; color: ${COLORS.gray}; font-size: 14px; line-height: 1.6;">
      This link will expire in 1 hour. If you didn't request this reset, you can safely ignore this email.
    </p>
    
    <p style="margin: 24px 0 0; color: ${COLORS.dark}; font-size: 16px;">
      Stay secure,<br>
      <strong>The tCredex Team</strong>
    </p>
  `;

  return {
    subject: 'Reset your tCredex password',
    html: baseTemplate(content, 'Password reset request'),
    text: `Dear ${userName},\n\nReset your password: ${resetUrl}\n\nThis link expires in 1 hour.\n\nThe tCredex Team`,
  };
}

/**
 * Email: Profile Added to Database (Preqin-style)
 * Used when we import CDE data or organization is referenced
 */
export function profileAddedTemplate(params: {
  contactName?: string;
  organizationName: string;
  organizationType: 'CDE' | 'Investor' | 'Sponsor' | 'Lender';
  claimUrl: string;
}): { subject: string; html: string; text: string } {
  const { contactName, organizationName, organizationType, claimUrl } = params;
  const greeting = contactName ? `Dear ${contactName},` : 'Dear Sir/Madam,';
  
  const content = `
    <p style="margin: 0 0 24px; color: ${COLORS.gray}; font-size: 16px; line-height: 1.6;">
      ${greeting}
    </p>
    
    <p style="margin: 0 0 24px; color: ${COLORS.gray}; font-size: 16px; line-height: 1.6;">
      Your organization, <strong style="color: ${COLORS.dark};">${organizationName}</strong>, has been added to tCredex — the AI-powered marketplace connecting sponsors, CDEs, and investors for tax credit transactions.
    </p>
    
    <p style="margin: 0 0 24px; color: ${COLORS.gray}; font-size: 16px; line-height: 1.6;">
      We are building the industry's most comprehensive platform for NMTC, HTC, LIHTC, and Opportunity Zone financing. Our mission is to increase transparency and connect qualified projects with capital.
    </p>
    
    <div style="background-color: ${COLORS.light}; border-radius: 8px; padding: 20px; margin: 24px 0;">
      <p style="margin: 0 0 12px; color: ${COLORS.dark}; font-size: 15px; font-weight: 600;">
        Your Profile on tCredex:
      </p>
      <p style="margin: 0; color: ${COLORS.gray}; font-size: 14px; line-height: 1.6;">
        As the tax credit industry's emerging marketplace, we wanted to make you aware that we may hold your business contact details, such as organization name, allocation history, geographic focus, and sector preferences in our database.
      </p>
    </div>
    
    <div style="background-color: ${COLORS.light}; border-radius: 8px; padding: 20px; margin: 24px 0;">
      <p style="margin: 0 0 12px; color: ${COLORS.dark}; font-size: 15px; font-weight: 600;">
        How have we collected your information?
      </p>
      <p style="margin: 0; color: ${COLORS.gray}; font-size: 14px; line-height: 1.6;">
        Your information was gathered from publicly available sources including CDFI Fund allocation announcements, press releases, corporate websites, and industry publications.
      </p>
      <p style="margin: 12px 0 0; color: ${COLORS.gray}; font-size: 14px;">
        To learn more about us or your data rights, visit our <a href="https://tcredex.com/privacy" style="color: ${COLORS.primary};">Privacy Notice</a>.
      </p>
    </div>
    
    <p style="margin: 0 0 16px; color: ${COLORS.dark}; font-size: 15px; font-weight: 600;">
      Want to control what your tCredex profile shows?
    </p>
    
    <p style="margin: 0 0 24px; color: ${COLORS.gray}; font-size: 16px; line-height: 1.6;">
      ${organizationType === 'CDE' 
        ? 'Claim your profile to showcase your allocation availability, sector focus, and deal preferences to qualified sponsors actively seeking NMTC partners.'
        : 'Claim your profile to ensure your organization\'s information is accurate and discover relevant opportunities in the marketplace.'
      }
    </p>
    
    <table role="presentation" cellpadding="0" cellspacing="0" style="margin: 24px 0;">
      <tr>
        <td>
          <a href="${claimUrl}" class="button" style="background-color: ${COLORS.primary}; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; display: inline-block;">
            Claim Your Profile
          </a>
        </td>
      </tr>
    </table>
    
    <p style="margin: 24px 0 0; color: ${COLORS.gray}; font-size: 14px; line-height: 1.6;">
      Questions? Reach out to our team at <a href="mailto:info@tcredex.com" style="color: ${COLORS.primary};">info@tcredex.com</a>
    </p>
    
    <p style="margin: 24px 0 0; color: ${COLORS.dark}; font-size: 16px;">
      Kind Regards,<br>
      <strong>The tCredex Team</strong>
    </p>
  `;

  return {
    subject: `${organizationName} has been added to tCredex`,
    html: baseTemplate(content, 'Your organization is now on tCredex'),
    text: `${greeting}\n\nYour organization, ${organizationName}, has been added to tCredex.\n\nClaim your profile: ${claimUrl}\n\nKind Regards,\nThe tCredex Team`,
  };
}

/**
 * Email: Deal Inquiry / Expression of Interest
 */
export function dealInquiryTemplate(params: {
  userName: string;
  projectName: string;
  inquirerName: string;
  inquirerOrg: string;
  inquirerRole: string;
  message?: string;
  dealId: string;
}): { subject: string; html: string; text: string } {
  const { userName, projectName, inquirerName, inquirerOrg, inquirerRole, message, dealId } = params;
  
  const content = `
    <h1 style="margin: 0 0 16px; color: ${COLORS.dark}; font-size: 24px; font-weight: 700;">
      📬 New Interest in Your Deal
    </h1>
    
    <p style="margin: 0 0 24px; color: ${COLORS.gray}; font-size: 16px; line-height: 1.6;">
      Dear ${userName},
    </p>
    
    <p style="margin: 0 0 24px; color: ${COLORS.gray}; font-size: 16px; line-height: 1.6;">
      Someone has expressed interest in <strong style="color: ${COLORS.dark};">${projectName}</strong>.
    </p>
    
    <div style="background-color: ${COLORS.light}; border-radius: 8px; padding: 20px; margin: 24px 0; border-left: 4px solid ${COLORS.primary};">
      <p style="margin: 0 0 4px; color: ${COLORS.dark}; font-size: 18px; font-weight: 600;">
        ${inquirerName}
      </p>
      <p style="margin: 0 0 4px; color: ${COLORS.gray}; font-size: 14px;">
        ${inquirerOrg} · ${inquirerRole}
      </p>
      ${message ? `
      <div style="margin-top: 12px; padding-top: 12px; border-top: 1px solid #e5e7eb;">
        <p style="margin: 0; color: ${COLORS.gray}; font-size: 14px; font-style: italic;">
          "${message.length > 200 ? message.substring(0, 200) + '...' : message}"
        </p>
      </div>
      ` : ''}
    </div>
    
    <p style="margin: 0 0 24px; color: ${COLORS.gray}; font-size: 16px; line-height: 1.6;">
      Log in to view their full profile and start a conversation.
    </p>
    
    <table role="presentation" cellpadding="0" cellspacing="0" style="margin: 24px 0;">
      <tr>
        <td>
          <a href="https://tcredex.com/deals/${dealId}" class="button" style="background-color: ${COLORS.primary}; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; display: inline-block;">
            View & Respond
          </a>
        </td>
      </tr>
    </table>
    
    <p style="margin: 24px 0 0; color: ${COLORS.dark}; font-size: 16px;">
      Good luck,<br>
      <strong>The tCredex Team</strong>
    </p>
  `;

  return {
    subject: `📬 ${inquirerOrg} is interested in ${projectName}`,
    html: baseTemplate(content, `${inquirerName} from ${inquirerOrg} is interested in your deal`),
    text: `Dear ${userName},\n\n${inquirerName} from ${inquirerOrg} has expressed interest in ${projectName}.\n\nView: https://tcredex.com/deals/${dealId}\n\nThe tCredex Team`,
  };
}

/**
 * Email: Weekly Digest
 */
export function weeklyDigestTemplate(params: {
  userName: string;
  stats: {
    newDeals: number;
    newMatches: number;
    unreadMessages: number;
  };
  featuredDeals?: Array<{
    projectName: string;
    city: string;
    state: string;
    programType: string;
    allocation: number;
  }>;
}): { subject: string; html: string; text: string } {
  const { userName, stats, featuredDeals } = params;
  
  const dealsList = featuredDeals?.map(deal => `
    <tr>
      <td style="padding: 12px 0; border-bottom: 1px solid ${COLORS.light};">
        <p style="margin: 0 0 4px; color: ${COLORS.dark}; font-size: 15px; font-weight: 600;">
          ${deal.projectName}
        </p>
        <p style="margin: 0; color: ${COLORS.gray}; font-size: 13px;">
          ${deal.city}, ${deal.state} · ${deal.programType} · ${(deal.allocation / 1000000).toFixed(1)}M
        </p>
      </td>
    </tr>
  `).join('') || '';
  
  const content = `
    <h1 style="margin: 0 0 16px; color: ${COLORS.dark}; font-size: 24px; font-weight: 700;">
      Your Weekly tCredex Update
    </h1>
    
    <p style="margin: 0 0 24px; color: ${COLORS.gray}; font-size: 16px; line-height: 1.6;">
      Hi ${userName}, here's what's happening in the marketplace this week.
    </p>
    
    <!-- Stats Row -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin: 24px 0;">
      <tr>
        <td width="33%" style="text-align: center; padding: 16px; background-color: ${COLORS.light}; border-radius: 8px 0 0 8px;">
          <p style="margin: 0; color: ${COLORS.primary}; font-size: 28px; font-weight: 700;">${stats.newDeals}</p>
          <p style="margin: 4px 0 0; color: ${COLORS.gray}; font-size: 12px;">New Deals</p>
        </td>
        <td width="33%" style="text-align: center; padding: 16px; background-color: ${COLORS.light};">
          <p style="margin: 0; color: ${COLORS.success}; font-size: 28px; font-weight: 700;">${stats.newMatches}</p>
          <p style="margin: 4px 0 0; color: ${COLORS.gray}; font-size: 12px;">New Matches</p>
        </td>
        <td width="33%" style="text-align: center; padding: 16px; background-color: ${COLORS.light}; border-radius: 0 8px 8px 0;">
          <p style="margin: 0; color: ${COLORS.warning}; font-size: 28px; font-weight: 700;">${stats.unreadMessages}</p>
          <p style="margin: 4px 0 0; color: ${COLORS.gray}; font-size: 12px;">Messages</p>
        </td>
      </tr>
    </table>
    
    ${featuredDeals?.length ? `
    <p style="margin: 24px 0 12px; color: ${COLORS.dark}; font-size: 15px; font-weight: 600;">
      Featured Deals This Week:
    </p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      ${dealsList}
    </table>
    ` : ''}
    
    <table role="presentation" cellpadding="0" cellspacing="0" style="margin: 24px 0;">
      <tr>
        <td>
          <a href="https://tcredex.com/deals" class="button" style="background-color: ${COLORS.primary}; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; display: inline-block;">
            Browse Marketplace
          </a>
        </td>
      </tr>
    </table>
    
    <p style="margin: 24px 0 0; color: ${COLORS.dark}; font-size: 16px;">
      See you next week,<br>
      <strong>The tCredex Team</strong>
    </p>
  `;

  return {
    subject: `📊 Your Weekly tCredex Update: ${stats.newDeals} new deals`,
    html: baseTemplate(content, `${stats.newDeals} new deals this week`),
    text: `Hi ${userName},\n\nThis week: ${stats.newDeals} new deals, ${stats.newMatches} matches, ${stats.unreadMessages} messages.\n\nBrowse: https://tcredex.com/deals\n\nThe tCredex Team`,
  };
}

/**
 * Email: Allocation Announcement (for CDEs)
 */
export function allocationAnnouncementTemplate(params: {
  cdeName: string;
  contactName?: string;
  allocationAmount: number;
  allocationYear: number;
}): { subject: string; html: string; text: string } {
  const { cdeName, contactName, allocationAmount, allocationYear } = params;
  const greeting = contactName ? `Dear ${contactName},` : `Dear ${cdeName} Team,`;
  const formattedAmount = `${(allocationAmount / 1000000).toFixed(0)}M`;
  
  const content = `
    <h1 style="margin: 0 0 16px; color: ${COLORS.dark}; font-size: 24px; font-weight: 700;">
      🎉 Congratulations on Your ${allocationYear} NMTC Allocation!
    </h1>
    
    <p style="margin: 0 0 24px; color: ${COLORS.gray}; font-size: 16px; line-height: 1.6;">
      ${greeting}
    </p>
    
    <p style="margin: 0 0 24px; color: ${COLORS.gray}; font-size: 16px; line-height: 1.6;">
      We noticed that <strong style="color: ${COLORS.dark};">${cdeName}</strong> received a <strong style="color: ${COLORS.success};">${formattedAmount}</strong> NMTC allocation for ${allocationYear}. Congratulations!
    </p>
    
    <div style="background-color: #dcfce7; border-radius: 8px; padding: 20px; margin: 24px 0; text-align: center;">
      <p style="margin: 0 0 8px; color: ${COLORS.success}; font-size: 14px; font-weight: 600; text-transform: uppercase;">
        ${allocationYear} Allocation
      </p>
      <p style="margin: 0; color: ${COLORS.dark}; font-size: 36px; font-weight: 700;">
        ${formattedAmount}
      </p>
    </div>
    
    <p style="margin: 0 0 24px; color: ${COLORS.gray}; font-size: 16px; line-height: 1.6;">
      tCredex has qualified sponsors actively seeking CDE partners. Our marketplace can help you deploy your allocation efficiently by connecting you with pre-vetted projects that match your investment criteria.
    </p>
    
    <table role="presentation" cellpadding="0" cellspacing="0" style="margin: 24px 0;">
      <tr>
        <td>
          <a href="https://tcredex.com/cde/register" class="button" style="background-color: ${COLORS.success}; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; display: inline-block;">
            Find Qualified Projects
          </a>
        </td>
      </tr>
    </table>
    
    <p style="margin: 24px 0 0; color: ${COLORS.gray}; font-size: 14px; line-height: 1.6;">
      Questions about how tCredex works? Reply to this email or visit <a href="https://tcredex.com/how-it-works" style="color: ${COLORS.primary};">tcredex.com/how-it-works</a>
    </p>
    
    <p style="margin: 24px 0 0; color: ${COLORS.dark}; font-size: 16px;">
      Best regards,<br>
      <strong>The tCredex Team</strong>
    </p>
  `;

  return {
    subject: `🎉 Congrats on your ${formattedAmount} NMTC allocation, ${cdeName}!`,
    html: baseTemplate(content, `${cdeName} received ${formattedAmount} in ${allocationYear}`),
    text: `${greeting}\n\nCongratulations on your ${formattedAmount} NMTC allocation for ${allocationYear}!\n\ntCredex can help you find qualified projects.\n\nLearn more: https://tcredex.com/cde/register\n\nThe tCredex Team`,
  };
}
