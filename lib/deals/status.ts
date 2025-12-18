/**
 * tCredex Deal Status Workflow
 * 
 * State machine for deal lifecycle management
 * Defines all statuses, valid transitions, and required actions
 */

export type DealStatus =
  | 'draft'              // Sponsor started intake but not submitted
  | 'submitted'          // Intake complete, awaiting review
  | 'under_review'       // Admin reviewing submission
  | 'needs_info'         // Admin requested more info from sponsor
  | 'approved'           // Approved for marketplace listing
  | 'available'          // Live on marketplace, accepting interest
  | 'in_discussions'     // Active conversations with CDEs
  | 'term_sheet'         // Term sheet issued
  | 'closing'            // In closing process
  | 'funded'             // Deal closed and funded
  | 'declined'           // Admin declined the deal
  | 'withdrawn'          // Sponsor withdrew the deal
  | 'expired';           // Deal expired without closing

export type DealStatusCategory = 'active' | 'pending' | 'closed' | 'inactive';

export interface StatusInfo {
  status: DealStatus;
  label: string;
  description: string;
  category: DealStatusCategory;
  color: string;
  icon: string;
  allowedTransitions: DealStatus[];
  requiredRole: ('sponsor' | 'cde' | 'admin')[];
}

/**
 * Complete status definitions with metadata
 */
export const statusDefinitions: Record<DealStatus, StatusInfo> = {
  draft: {
    status: 'draft',
    label: 'Draft',
    description: 'Intake form started but not submitted',
    category: 'pending',
    color: '#6b7280', // gray
    icon: 'FileEdit',
    allowedTransitions: ['submitted', 'withdrawn'],
    requiredRole: ['sponsor'],
  },
  submitted: {
    status: 'submitted',
    label: 'Submitted',
    description: 'Awaiting admin review',
    category: 'pending',
    color: '#3b82f6', // blue
    icon: 'Send',
    allowedTransitions: ['under_review', 'declined', 'withdrawn'],
    requiredRole: ['admin'],
  },
  under_review: {
    status: 'under_review',
    label: 'Under Review',
    description: 'Admin is reviewing the submission',
    category: 'pending',
    color: '#8b5cf6', // purple
    icon: 'Eye',
    allowedTransitions: ['approved', 'needs_info', 'declined'],
    requiredRole: ['admin'],
  },
  needs_info: {
    status: 'needs_info',
    label: 'Needs Information',
    description: 'Additional information requested',
    category: 'pending',
    color: '#f59e0b', // amber
    icon: 'HelpCircle',
    allowedTransitions: ['under_review', 'withdrawn'],
    requiredRole: ['sponsor', 'admin'],
  },
  approved: {
    status: 'approved',
    label: 'Approved',
    description: 'Approved, preparing for marketplace',
    category: 'active',
    color: '#22c55e', // green
    icon: 'CheckCircle',
    allowedTransitions: ['available', 'withdrawn'],
    requiredRole: ['admin', 'sponsor'],
  },
  available: {
    status: 'available',
    label: 'Available',
    description: 'Live on marketplace',
    category: 'active',
    color: '#22c55e', // green
    icon: 'Globe',
    allowedTransitions: ['in_discussions', 'withdrawn', 'expired'],
    requiredRole: ['sponsor', 'cde', 'admin'],
  },
  in_discussions: {
    status: 'in_discussions',
    label: 'In Discussions',
    description: 'Active conversations with CDEs',
    category: 'active',
    color: '#6366f1', // indigo
    icon: 'MessageSquare',
    allowedTransitions: ['term_sheet', 'available', 'withdrawn'],
    requiredRole: ['sponsor', 'cde'],
  },
  term_sheet: {
    status: 'term_sheet',
    label: 'Term Sheet',
    description: 'Term sheet issued',
    category: 'active',
    color: '#0ea5e9', // sky
    icon: 'FileText',
    allowedTransitions: ['closing', 'in_discussions', 'withdrawn'],
    requiredRole: ['sponsor', 'cde'],
  },
  closing: {
    status: 'closing',
    label: 'Closing',
    description: 'In closing process',
    category: 'active',
    color: '#14b8a6', // teal
    icon: 'Clock',
    allowedTransitions: ['funded', 'term_sheet', 'withdrawn'],
    requiredRole: ['sponsor', 'cde', 'admin'],
  },
  funded: {
    status: 'funded',
    label: 'Funded',
    description: 'Deal closed and funded',
    category: 'closed',
    color: '#22c55e', // green
    icon: 'DollarSign',
    allowedTransitions: [], // Terminal state
    requiredRole: ['admin'],
  },
  declined: {
    status: 'declined',
    label: 'Declined',
    description: 'Admin declined this deal',
    category: 'inactive',
    color: '#ef4444', // red
    icon: 'XCircle',
    allowedTransitions: ['submitted'], // Can resubmit
    requiredRole: ['sponsor'],
  },
  withdrawn: {
    status: 'withdrawn',
    label: 'Withdrawn',
    description: 'Sponsor withdrew from marketplace',
    category: 'inactive',
    color: '#6b7280', // gray
    icon: 'MinusCircle',
    allowedTransitions: ['draft'], // Can restart
    requiredRole: ['sponsor'],
  },
  expired: {
    status: 'expired',
    label: 'Expired',
    description: 'Deal expired without closing',
    category: 'inactive',
    color: '#6b7280', // gray
    icon: 'Clock',
    allowedTransitions: ['available'], // Can relist
    requiredRole: ['sponsor', 'admin'],
  },
};

/**
 * Check if a status transition is valid
 */
export function canTransition(
  currentStatus: DealStatus,
  newStatus: DealStatus,
  userRole: 'sponsor' | 'cde' | 'admin'
): boolean {
  const currentDef = statusDefinitions[currentStatus];
  const newDef = statusDefinitions[newStatus];
  
  // Check if transition is allowed
  if (!currentDef.allowedTransitions.includes(newStatus)) {
    return false;
  }
  
  // Check if user has permission
  if (!newDef.requiredRole.includes(userRole)) {
    return false;
  }
  
  return true;
}

/**
 * Get all valid next statuses for current state and user
 */
export function getValidTransitions(
  currentStatus: DealStatus,
  userRole: 'sponsor' | 'cde' | 'admin'
): DealStatus[] {
  const currentDef = statusDefinitions[currentStatus];
  
  return currentDef.allowedTransitions.filter((status) => {
    const targetDef = statusDefinitions[status];
    return targetDef.requiredRole.includes(userRole);
  });
}

/**
 * Get human-readable transition action name
 */
export function getTransitionAction(from: DealStatus, to: DealStatus): string {
  const actionMap: Record<string, string> = {
    'draft->submitted': 'Submit for Review',
    'submitted->under_review': 'Begin Review',
    'under_review->approved': 'Approve',
    'under_review->needs_info': 'Request Information',
    'under_review->declined': 'Decline',
    'needs_info->under_review': 'Resubmit',
    'approved->available': 'List on Marketplace',
    'available->in_discussions': 'Start Discussions',
    'in_discussions->term_sheet': 'Issue Term Sheet',
    'term_sheet->closing': 'Begin Closing',
    'closing->funded': 'Mark Funded',
    // Backwards/alternative
    'in_discussions->available': 'Return to Marketplace',
    'term_sheet->in_discussions': 'Revise Terms',
    'closing->term_sheet': 'Revise Terms',
    // Exits
    'withdrawn->draft': 'Restart',
    'declined->submitted': 'Resubmit',
    'expired->available': 'Relist',
  };
  
  return actionMap[`${from}->${to}`] || `Move to ${statusDefinitions[to].label}`;
}

/**
 * Get deals by status category
 */
export function getStatusesByCategory(category: DealStatusCategory): DealStatus[] {
  return Object.values(statusDefinitions)
    .filter((def) => def.category === category)
    .map((def) => def.status);
}

/**
 * Status display helpers
 */
export function getStatusInfo(status: DealStatus): StatusInfo {
  return statusDefinitions[status] || statusDefinitions.draft;
}

export function getStatusLabel(status: DealStatus): string {
  return statusDefinitions[status]?.label || status;
}

export function getStatusColor(status: DealStatus): string {
  return statusDefinitions[status]?.color || '#6b7280';
}

/**
 * Marketplace visibility check
 */
export function isMarketplaceVisible(status: DealStatus): boolean {
  const visibleStatuses: DealStatus[] = [
    'available',
    'in_discussions',
    'term_sheet',
    'closing',
  ];
  return visibleStatuses.includes(status);
}

/**
 * Check if deal is in active/working state
 */
export function isActiveDeal(status: DealStatus): boolean {
  return statusDefinitions[status]?.category === 'active';
}

/**
 * Check if deal is closed/complete
 */
export function isClosedDeal(status: DealStatus): boolean {
  return statusDefinitions[status]?.category === 'closed';
}
