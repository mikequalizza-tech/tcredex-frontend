/**
 * tCredex Notification Rules Engine v1
 * Generated from ChatGPT spec - implemented by Claude
 * 
 * TEAM Q ASSEMBLY LINE:
 * ChatGPT (Business Rules) → Claude (Implementation) → Copilot (Review)
 */

export type NotificationEvent =
  | 'cde_match_found'
  | 'new_message_received'
  | 'document_uploaded'
  | 'document_requested'
  | 'status_changed'
  | 'deal_approved'
  | 'closing_milestone'
  | 'offer_expiring';

export type NotificationPriority = 'urgent' | 'normal' | 'low';

export type RecipientRole = 'sponsor' | 'cde' | 'investor' | 'admin';

export interface NotificationRule {
  event: NotificationEvent;
  trigger: string;
  recipients: RecipientRole[];
  push: {
    title: string;
    body: string;
  };
  email: {
    subject: string;
    preview: string;
  };
  in_app: string;
  priority: NotificationPriority;
  auto_expire: number; // seconds
}

export const notificationRules: NotificationRule[] = [
  {
    event: 'cde_match_found',
    trigger: 'AutoMatch engine finds new CDE match for a project',
    recipients: ['sponsor', 'admin'],
    push: {
      title: 'New CDE Match!',
      body: '{{cde_name}} is a match for {{project_name}}',
    },
    email: {
      subject: '🎯 New CDE Match for {{project_name}}',
      preview: 'tCredex found a match: {{cde_name}} may be interested in your project.',
    },
    in_app: 'New CDE match found: {{cde_name}} for {{project_name}}',
    priority: 'normal',
    auto_expire: 259200, // 3 days
  },
  {
    event: 'new_message_received',
    trigger: 'Message sent in project chat or system inbox',
    recipients: ['sponsor', 'cde', 'investor'],
    push: {
      title: 'New Message',
      body: '{{sender_name}} sent you a message on {{project_name}}',
    },
    email: {
      subject: '📩 New message from {{sender_name}}',
      preview: '{{sender_name}} sent a message on {{project_name}}',
    },
    in_app: 'Message from {{sender_name}} on {{project_name}}',
    priority: 'normal',
    auto_expire: 604800, // 7 days
  },
  {
    event: 'document_uploaded',
    trigger: 'New document uploaded to project or Closing Room',
    recipients: ['sponsor', 'cde', 'admin'],
    push: {
      title: 'Document Uploaded',
      body: '{{uploader_name}} added a new file to {{project_name}}',
    },
    email: {
      subject: '📎 New Document in {{project_name}}',
      preview: '{{filename}} uploaded by {{uploader_name}}',
    },
    in_app: 'New document {{filename}} added to {{project_name}}',
    priority: 'normal',
    auto_expire: 604800, // 7 days
  },
  {
    event: 'document_requested',
    trigger: 'Document request posted via Closing Room or Checklist',
    recipients: ['sponsor'],
    push: {
      title: 'Document Requested',
      body: '{{requester_name}} requested {{document_type}} for {{project_name}}',
    },
    email: {
      subject: '📄 {{document_type}} Requested for {{project_name}}',
      preview: 'Please upload {{document_type}} to proceed with {{project_name}}',
    },
    in_app: '{{document_type}} requested for {{project_name}} by {{requester_name}}',
    priority: 'normal',
    auto_expire: 259200, // 3 days
  },
  {
    event: 'status_changed',
    trigger: 'Deal status changes (e.g., In Review → Approved)',
    recipients: ['sponsor', 'cde', 'admin'],
    push: {
      title: 'Deal Status Updated',
      body: '{{project_name}} is now {{new_status}}',
    },
    email: {
      subject: '📊 Status Change: {{project_name}} → {{new_status}}',
      preview: '{{project_name}} moved to {{new_status}} status',
    },
    in_app: 'Status changed to {{new_status}} for {{project_name}}',
    priority: 'normal',
    auto_expire: 172800, // 2 days
  },
  {
    event: 'deal_approved',
    trigger: 'Admin or CDE marks deal as approved',
    recipients: ['sponsor', 'investor', 'admin'],
    push: {
      title: '🎉 Deal Approved',
      body: '{{project_name}} has been approved',
    },
    email: {
      subject: '✅ {{project_name}} Approved',
      preview: 'Your deal is now approved and moving forward.',
    },
    in_app: '{{project_name}} approved and marked ready',
    priority: 'urgent',
    auto_expire: 604800, // 7 days
  },
  {
    event: 'closing_milestone',
    trigger: 'A milestone is completed or due in the Closing Room',
    recipients: ['sponsor', 'cde', 'admin'],
    push: {
      title: 'Closing Milestone Update',
      body: '{{milestone_name}} is now {{milestone_status}} for {{project_name}}',
    },
    email: {
      subject: '📌 {{milestone_name}} → {{milestone_status}}',
      preview: 'Next step in Closing Room for {{project_name}}',
    },
    in_app: '{{milestone_name}} marked {{milestone_status}} on {{project_name}}',
    priority: 'normal',
    auto_expire: 604800, // 7 days
  },
  {
    event: 'offer_expiring',
    trigger: 'LOI, Term Sheet, or Funding offer is <72 hours from expiration',
    recipients: ['sponsor', 'cde', 'admin'],
    push: {
      title: '⏳ Offer Expiring',
      body: 'Offer for {{project_name}} expires in {{hours_left}} hours',
    },
    email: {
      subject: '⚠️ Offer Expiring: {{project_name}}',
      preview: 'Offer will expire in {{hours_left}} hours. Take action now.',
    },
    in_app: 'Offer for {{project_name}} expiring in {{hours_left}} hours',
    priority: 'urgent',
    auto_expire: 86400, // 1 day
  },
];

/**
 * Get notification rule by event type
 */
export function getNotificationRule(event: NotificationEvent): NotificationRule | undefined {
  return notificationRules.find((rule) => rule.event === event);
}

/**
 * Get all rules for a specific recipient role
 */
export function getRulesForRole(role: RecipientRole): NotificationRule[] {
  return notificationRules.filter((rule) => rule.recipients.includes(role));
}

/**
 * Get notification type category for UI display
 */
export function getNotificationType(event: NotificationEvent): string {
  const typeMap: Record<NotificationEvent, string> = {
    cde_match_found: 'match',
    new_message_received: 'message',
    document_uploaded: 'document',
    document_requested: 'document',
    status_changed: 'status',
    deal_approved: 'status',
    closing_milestone: 'status',
    offer_expiring: 'reminder',
  };
  return typeMap[event] || 'status';
}
