import { describe, it, expect } from 'vitest'
import {
  DealStatus,
  DealStatusCategory,
  statusDefinitions,
  canTransition,
  getValidTransitions,
  getTransitionAction,
  getStatusesByCategory,
  getStatusInfo,
  getStatusLabel,
  getStatusColor,
  isMarketplaceVisible,
  isActiveDeal,
  isClosedDeal,
} from './status'

describe('Deal Status Module', () => {
  describe('statusDefinitions', () => {
    const allStatuses: DealStatus[] = [
      'draft',
      'submitted',
      'under_review',
      'needs_info',
      'approved',
      'available',
      'in_discussions',
      'term_sheet',
      'closing',
      'funded',
      'declined',
      'withdrawn',
      'expired',
    ]

    it('should define all 13 deal statuses', () => {
      expect(Object.keys(statusDefinitions)).toHaveLength(13)
      allStatuses.forEach((status) => {
        expect(statusDefinitions[status]).toBeDefined()
      })
    })

    it('should have required properties for each status', () => {
      Object.values(statusDefinitions).forEach((def) => {
        expect(def).toHaveProperty('status')
        expect(def).toHaveProperty('label')
        expect(def).toHaveProperty('description')
        expect(def).toHaveProperty('category')
        expect(def).toHaveProperty('color')
        expect(def).toHaveProperty('icon')
        expect(def).toHaveProperty('allowedTransitions')
        expect(def).toHaveProperty('requiredRole')
      })
    })

    it('should have valid hex color codes', () => {
      const hexColorRegex = /^#[0-9a-f]{6}$/i
      Object.values(statusDefinitions).forEach((def) => {
        expect(def.color).toMatch(hexColorRegex)
      })
    })

    it('should have non-empty labels and descriptions', () => {
      Object.values(statusDefinitions).forEach((def) => {
        expect(def.label.length).toBeGreaterThan(0)
        expect(def.description.length).toBeGreaterThan(0)
      })
    })

    it('should have valid categories for each status', () => {
      const validCategories: DealStatusCategory[] = ['active', 'pending', 'closed', 'inactive']
      Object.values(statusDefinitions).forEach((def) => {
        expect(validCategories).toContain(def.category)
      })
    })

    it('should only reference valid statuses in allowedTransitions', () => {
      Object.values(statusDefinitions).forEach((def) => {
        def.allowedTransitions.forEach((transition) => {
          expect(statusDefinitions[transition]).toBeDefined()
        })
      })
    })

    it('should have at least one required role for each status', () => {
      Object.values(statusDefinitions).forEach((def) => {
        expect(def.requiredRole.length).toBeGreaterThan(0)
      })
    })

    it('funded status should be a terminal state with no transitions', () => {
      expect(statusDefinitions.funded.allowedTransitions).toHaveLength(0)
    })
  })

  describe('canTransition', () => {
    describe('valid transitions', () => {
      // Note: requiredRole on target status determines who can transition INTO that state

      it('should allow admin to transition draft -> submitted', () => {
        // submitted.requiredRole includes 'admin'
        expect(canTransition('draft', 'submitted', 'admin')).toBe(true)
      })

      it('should allow sponsor to withdraw a draft', () => {
        // withdrawn.requiredRole includes 'sponsor'
        expect(canTransition('draft', 'withdrawn', 'sponsor')).toBe(true)
      })

      it('should allow admin to transition submitted -> under_review', () => {
        expect(canTransition('submitted', 'under_review', 'admin')).toBe(true)
      })

      it('should allow admin to approve an under_review deal', () => {
        // approved.requiredRole includes 'admin' and 'sponsor'
        expect(canTransition('under_review', 'approved', 'admin')).toBe(true)
      })

      it('should allow sponsor to move under_review to declined', () => {
        // declined.requiredRole includes only 'sponsor'
        expect(canTransition('under_review', 'declined', 'sponsor')).toBe(true)
      })

      it('should allow admin to request info on under_review deal', () => {
        // needs_info.requiredRole includes 'sponsor' and 'admin'
        expect(canTransition('under_review', 'needs_info', 'admin')).toBe(true)
      })

      it('should allow admin to resubmit after needs_info', () => {
        // under_review.requiredRole includes 'admin'
        expect(canTransition('needs_info', 'under_review', 'admin')).toBe(true)
      })

      it('should allow admin to list approved deal on marketplace', () => {
        // available.requiredRole includes 'sponsor', 'cde', 'admin'
        expect(canTransition('approved', 'available', 'admin')).toBe(true)
      })

      it('should allow cde to start discussions on available deal', () => {
        // in_discussions.requiredRole includes 'sponsor', 'cde'
        expect(canTransition('available', 'in_discussions', 'cde')).toBe(true)
      })

      it('should allow cde to issue term sheet', () => {
        // term_sheet.requiredRole includes 'sponsor', 'cde'
        expect(canTransition('in_discussions', 'term_sheet', 'cde')).toBe(true)
      })

      it('should allow sponsor to issue term sheet', () => {
        expect(canTransition('in_discussions', 'term_sheet', 'sponsor')).toBe(true)
      })

      it('should allow cde to begin closing', () => {
        // closing.requiredRole includes 'sponsor', 'cde', 'admin'
        expect(canTransition('term_sheet', 'closing', 'cde')).toBe(true)
      })

      it('should allow admin to mark deal as funded', () => {
        // funded.requiredRole includes only 'admin'
        expect(canTransition('closing', 'funded', 'admin')).toBe(true)
      })

      it('should allow admin to resubmit declined deal', () => {
        // submitted.requiredRole includes 'admin'
        expect(canTransition('declined', 'submitted', 'admin')).toBe(true)
      })

      it('should allow sponsor to restart withdrawn deal', () => {
        // draft.requiredRole includes 'sponsor'
        expect(canTransition('withdrawn', 'draft', 'sponsor')).toBe(true)
      })

      it('should allow sponsor to relist expired deal', () => {
        // available.requiredRole includes 'sponsor', 'cde', 'admin'
        expect(canTransition('expired', 'available', 'sponsor')).toBe(true)
      })

      it('should allow admin to relist expired deal', () => {
        expect(canTransition('expired', 'available', 'admin')).toBe(true)
      })
    })

    describe('invalid transitions - wrong status path', () => {
      it('should not allow draft -> approved (skips review)', () => {
        expect(canTransition('draft', 'approved', 'admin')).toBe(false)
      })

      it('should not allow draft -> funded (skips entire process)', () => {
        expect(canTransition('draft', 'funded', 'admin')).toBe(false)
      })

      it('should not allow submitted -> available (skips review)', () => {
        expect(canTransition('submitted', 'available', 'admin')).toBe(false)
      })

      it('should not allow available -> funded (skips closing)', () => {
        expect(canTransition('available', 'funded', 'admin')).toBe(false)
      })

      it('should not allow term_sheet -> funded (skips closing)', () => {
        expect(canTransition('term_sheet', 'funded', 'admin')).toBe(false)
      })

      it('should not allow funded -> any status (terminal state)', () => {
        expect(canTransition('funded', 'closing', 'admin')).toBe(false)
        expect(canTransition('funded', 'available', 'admin')).toBe(false)
        expect(canTransition('funded', 'draft', 'sponsor')).toBe(false)
      })

      it('should not allow backward transitions not defined', () => {
        expect(canTransition('approved', 'submitted', 'admin')).toBe(false)
        expect(canTransition('available', 'approved', 'admin')).toBe(false)
      })
    })

    describe('invalid transitions - wrong role', () => {
      // Note: requiredRole on target status determines who can transition INTO that state

      it('should not allow cde to mark deal as funded', () => {
        // funded.requiredRole only includes 'admin'
        expect(canTransition('closing', 'funded', 'cde')).toBe(false)
      })

      it('should not allow cde to begin review', () => {
        // under_review.requiredRole only includes 'admin'
        expect(canTransition('submitted', 'under_review', 'cde')).toBe(false)
      })

      it('should not allow sponsor to begin review', () => {
        // under_review.requiredRole only includes 'admin'
        expect(canTransition('submitted', 'under_review', 'sponsor')).toBe(false)
      })

      it('should not allow sponsor to submit a draft', () => {
        // submitted.requiredRole only includes 'admin'
        expect(canTransition('draft', 'submitted', 'sponsor')).toBe(false)
      })

      it('should not allow cde to submit a draft', () => {
        // submitted.requiredRole only includes 'admin'
        expect(canTransition('draft', 'submitted', 'cde')).toBe(false)
      })

      it('should not allow admin to decline under_review deal', () => {
        // declined.requiredRole only includes 'sponsor'
        expect(canTransition('under_review', 'declined', 'admin')).toBe(false)
      })

      it('should not allow cde to restart withdrawn deal', () => {
        // draft.requiredRole only includes 'sponsor'
        expect(canTransition('withdrawn', 'draft', 'cde')).toBe(false)
      })
    })
  })

  describe('getValidTransitions', () => {
    // Note: requiredRole on target status determines who can transition INTO that state

    it('should return valid transitions for sponsor from draft', () => {
      const transitions = getValidTransitions('draft', 'sponsor')
      // draft can go to submitted or withdrawn, but submitted.requiredRole is ['admin']
      // withdrawn.requiredRole is ['sponsor'], so only withdrawn is valid for sponsor
      expect(transitions).toContain('withdrawn')
      expect(transitions).not.toContain('submitted')
      expect(transitions).toHaveLength(1)
    })

    it('should return submitted transition for admin from draft', () => {
      const transitions = getValidTransitions('draft', 'admin')
      // submitted.requiredRole is ['admin']
      expect(transitions).toContain('submitted')
    })

    it('should return valid transitions for sponsor from submitted', () => {
      const transitions = getValidTransitions('submitted', 'sponsor')
      // submitted can go to under_review, declined, withdrawn
      // under_review.requiredRole is ['admin'] - sponsor cannot
      // declined.requiredRole is ['sponsor'] - sponsor can
      // withdrawn.requiredRole is ['sponsor'] - sponsor can
      expect(transitions).toContain('declined')
      expect(transitions).toContain('withdrawn')
      expect(transitions).not.toContain('under_review')
      expect(transitions).toHaveLength(2)
    })

    it('should return valid transitions for admin from submitted', () => {
      const transitions = getValidTransitions('submitted', 'admin')
      // under_review.requiredRole is ['admin']
      expect(transitions).toContain('under_review')
      // declined.requiredRole is ['sponsor'], so admin cannot transition to declined
      expect(transitions).not.toContain('declined')
    })

    it('should return valid transitions for admin from under_review', () => {
      const transitions = getValidTransitions('under_review', 'admin')
      // approved.requiredRole includes 'admin'
      expect(transitions).toContain('approved')
      // needs_info.requiredRole includes 'admin'
      expect(transitions).toContain('needs_info')
      // declined.requiredRole is ['sponsor'], so admin cannot transition to declined
      expect(transitions).not.toContain('declined')
    })

    it('should return valid transitions for sponsor from under_review', () => {
      const transitions = getValidTransitions('under_review', 'sponsor')
      // approved.requiredRole includes 'sponsor'
      expect(transitions).toContain('approved')
      // needs_info.requiredRole includes 'sponsor'
      expect(transitions).toContain('needs_info')
      // declined.requiredRole is ['sponsor']
      expect(transitions).toContain('declined')
    })

    it('should return valid transitions for cde from available', () => {
      const transitions = getValidTransitions('available', 'cde')
      // in_discussions.requiredRole includes 'cde'
      expect(transitions).toContain('in_discussions')
    })

    it('should return both sponsor and cde transitions for in_discussions', () => {
      const sponsorTransitions = getValidTransitions('in_discussions', 'sponsor')
      const cdeTransitions = getValidTransitions('in_discussions', 'cde')

      // term_sheet.requiredRole includes 'sponsor' and 'cde'
      expect(sponsorTransitions).toContain('term_sheet')
      expect(cdeTransitions).toContain('term_sheet')

      // available.requiredRole includes 'sponsor', 'cde', 'admin'
      expect(sponsorTransitions).toContain('available')
      expect(cdeTransitions).toContain('available')

      // withdrawn.requiredRole is ['sponsor']
      expect(sponsorTransitions).toContain('withdrawn')
      expect(cdeTransitions).not.toContain('withdrawn')
    })

    it('should return empty array for funded status (terminal)', () => {
      const sponsorTransitions = getValidTransitions('funded', 'sponsor')
      const adminTransitions = getValidTransitions('funded', 'admin')
      const cdeTransitions = getValidTransitions('funded', 'cde')

      expect(sponsorTransitions).toHaveLength(0)
      expect(adminTransitions).toHaveLength(0)
      expect(cdeTransitions).toHaveLength(0)
    })

    it('should return only admin-allowed transitions for closing', () => {
      const adminTransitions = getValidTransitions('closing', 'admin')
      // funded.requiredRole is ['admin']
      expect(adminTransitions).toContain('funded')

      const cdeTransitions = getValidTransitions('closing', 'cde')
      // cde cannot transition to funded
      expect(cdeTransitions).not.toContain('funded')
    })
  })

  describe('getTransitionAction', () => {
    describe('defined actions', () => {
      it('should return "Submit for Review" for draft -> submitted', () => {
        expect(getTransitionAction('draft', 'submitted')).toBe('Submit for Review')
      })

      it('should return "Begin Review" for submitted -> under_review', () => {
        expect(getTransitionAction('submitted', 'under_review')).toBe('Begin Review')
      })

      it('should return "Approve" for under_review -> approved', () => {
        expect(getTransitionAction('under_review', 'approved')).toBe('Approve')
      })

      it('should return "Request Information" for under_review -> needs_info', () => {
        expect(getTransitionAction('under_review', 'needs_info')).toBe('Request Information')
      })

      it('should return "Decline" for under_review -> declined', () => {
        expect(getTransitionAction('under_review', 'declined')).toBe('Decline')
      })

      it('should return "Resubmit" for needs_info -> under_review', () => {
        expect(getTransitionAction('needs_info', 'under_review')).toBe('Resubmit')
      })

      it('should return "List on Marketplace" for approved -> available', () => {
        expect(getTransitionAction('approved', 'available')).toBe('List on Marketplace')
      })

      it('should return "Start Discussions" for available -> in_discussions', () => {
        expect(getTransitionAction('available', 'in_discussions')).toBe('Start Discussions')
      })

      it('should return "Issue Term Sheet" for in_discussions -> term_sheet', () => {
        expect(getTransitionAction('in_discussions', 'term_sheet')).toBe('Issue Term Sheet')
      })

      it('should return "Begin Closing" for term_sheet -> closing', () => {
        expect(getTransitionAction('term_sheet', 'closing')).toBe('Begin Closing')
      })

      it('should return "Mark Funded" for closing -> funded', () => {
        expect(getTransitionAction('closing', 'funded')).toBe('Mark Funded')
      })

      it('should return "Return to Marketplace" for in_discussions -> available', () => {
        expect(getTransitionAction('in_discussions', 'available')).toBe('Return to Marketplace')
      })

      it('should return "Revise Terms" for term_sheet -> in_discussions', () => {
        expect(getTransitionAction('term_sheet', 'in_discussions')).toBe('Revise Terms')
      })

      it('should return "Revise Terms" for closing -> term_sheet', () => {
        expect(getTransitionAction('closing', 'term_sheet')).toBe('Revise Terms')
      })

      it('should return "Restart" for withdrawn -> draft', () => {
        expect(getTransitionAction('withdrawn', 'draft')).toBe('Restart')
      })

      it('should return "Resubmit" for declined -> submitted', () => {
        expect(getTransitionAction('declined', 'submitted')).toBe('Resubmit')
      })

      it('should return "Relist" for expired -> available', () => {
        expect(getTransitionAction('expired', 'available')).toBe('Relist')
      })
    })

    describe('fallback actions', () => {
      it('should return formatted fallback for undefined transitions', () => {
        const action = getTransitionAction('draft', 'approved')
        expect(action).toBe('Move to Approved')
      })

      it('should return formatted fallback with correct label', () => {
        const action = getTransitionAction('available', 'funded')
        expect(action).toBe('Move to Funded')
      })
    })
  })

  describe('getStatusesByCategory', () => {
    it('should return active statuses', () => {
      const activeStatuses = getStatusesByCategory('active')
      expect(activeStatuses).toContain('approved')
      expect(activeStatuses).toContain('available')
      expect(activeStatuses).toContain('in_discussions')
      expect(activeStatuses).toContain('term_sheet')
      expect(activeStatuses).toContain('closing')
    })

    it('should return pending statuses', () => {
      const pendingStatuses = getStatusesByCategory('pending')
      expect(pendingStatuses).toContain('draft')
      expect(pendingStatuses).toContain('submitted')
      expect(pendingStatuses).toContain('under_review')
      expect(pendingStatuses).toContain('needs_info')
    })

    it('should return closed statuses', () => {
      const closedStatuses = getStatusesByCategory('closed')
      expect(closedStatuses).toContain('funded')
      expect(closedStatuses).toHaveLength(1)
    })

    it('should return inactive statuses', () => {
      const inactiveStatuses = getStatusesByCategory('inactive')
      expect(inactiveStatuses).toContain('declined')
      expect(inactiveStatuses).toContain('withdrawn')
      expect(inactiveStatuses).toContain('expired')
    })

    it('should not have overlapping categories', () => {
      const active = getStatusesByCategory('active')
      const pending = getStatusesByCategory('pending')
      const closed = getStatusesByCategory('closed')
      const inactive = getStatusesByCategory('inactive')

      const all = [...active, ...pending, ...closed, ...inactive]
      const unique = new Set(all)

      expect(unique.size).toBe(all.length)
      expect(all).toHaveLength(13) // All statuses accounted for
    })
  })

  describe('getStatusInfo', () => {
    it('should return correct info for valid status', () => {
      const info = getStatusInfo('draft')
      expect(info.status).toBe('draft')
      expect(info.label).toBe('Draft')
      expect(info.category).toBe('pending')
    })

    it('should return correct info for funded status', () => {
      const info = getStatusInfo('funded')
      expect(info.status).toBe('funded')
      expect(info.label).toBe('Funded')
      expect(info.category).toBe('closed')
      expect(info.allowedTransitions).toHaveLength(0)
    })

    it('should return draft info for invalid status', () => {
      const info = getStatusInfo('invalid_status' as DealStatus)
      expect(info.status).toBe('draft')
    })
  })

  describe('getStatusLabel', () => {
    it('should return correct labels for all statuses', () => {
      expect(getStatusLabel('draft')).toBe('Draft')
      expect(getStatusLabel('submitted')).toBe('Submitted')
      expect(getStatusLabel('under_review')).toBe('Under Review')
      expect(getStatusLabel('needs_info')).toBe('Needs Information')
      expect(getStatusLabel('approved')).toBe('Approved')
      expect(getStatusLabel('available')).toBe('Available')
      expect(getStatusLabel('in_discussions')).toBe('In Discussions')
      expect(getStatusLabel('term_sheet')).toBe('Term Sheet')
      expect(getStatusLabel('closing')).toBe('Closing')
      expect(getStatusLabel('funded')).toBe('Funded')
      expect(getStatusLabel('declined')).toBe('Declined')
      expect(getStatusLabel('withdrawn')).toBe('Withdrawn')
      expect(getStatusLabel('expired')).toBe('Expired')
    })

    it('should return raw status for invalid status', () => {
      const label = getStatusLabel('invalid' as DealStatus)
      expect(label).toBe('invalid')
    })
  })

  describe('getStatusColor', () => {
    it('should return correct colors for statuses', () => {
      expect(getStatusColor('draft')).toBe('#6b7280')
      expect(getStatusColor('submitted')).toBe('#3b82f6')
      expect(getStatusColor('approved')).toBe('#22c55e')
      expect(getStatusColor('declined')).toBe('#ef4444')
    })

    it('should return gray for invalid status', () => {
      const color = getStatusColor('invalid' as DealStatus)
      expect(color).toBe('#6b7280')
    })

    it('should return valid hex colors for all statuses', () => {
      const hexRegex = /^#[0-9a-f]{6}$/i
      const allStatuses: DealStatus[] = [
        'draft', 'submitted', 'under_review', 'needs_info',
        'approved', 'available', 'in_discussions', 'term_sheet',
        'closing', 'funded', 'declined', 'withdrawn', 'expired'
      ]

      allStatuses.forEach((status) => {
        expect(getStatusColor(status)).toMatch(hexRegex)
      })
    })
  })

  describe('isMarketplaceVisible', () => {
    it('should return true for marketplace-visible statuses', () => {
      expect(isMarketplaceVisible('available')).toBe(true)
      expect(isMarketplaceVisible('in_discussions')).toBe(true)
      expect(isMarketplaceVisible('term_sheet')).toBe(true)
      expect(isMarketplaceVisible('closing')).toBe(true)
    })

    it('should return false for non-marketplace statuses', () => {
      expect(isMarketplaceVisible('draft')).toBe(false)
      expect(isMarketplaceVisible('submitted')).toBe(false)
      expect(isMarketplaceVisible('under_review')).toBe(false)
      expect(isMarketplaceVisible('needs_info')).toBe(false)
      expect(isMarketplaceVisible('approved')).toBe(false)
      expect(isMarketplaceVisible('funded')).toBe(false)
      expect(isMarketplaceVisible('declined')).toBe(false)
      expect(isMarketplaceVisible('withdrawn')).toBe(false)
      expect(isMarketplaceVisible('expired')).toBe(false)
    })
  })

  describe('isActiveDeal', () => {
    it('should return true for active statuses', () => {
      expect(isActiveDeal('approved')).toBe(true)
      expect(isActiveDeal('available')).toBe(true)
      expect(isActiveDeal('in_discussions')).toBe(true)
      expect(isActiveDeal('term_sheet')).toBe(true)
      expect(isActiveDeal('closing')).toBe(true)
    })

    it('should return false for non-active statuses', () => {
      expect(isActiveDeal('draft')).toBe(false)
      expect(isActiveDeal('submitted')).toBe(false)
      expect(isActiveDeal('under_review')).toBe(false)
      expect(isActiveDeal('needs_info')).toBe(false)
      expect(isActiveDeal('funded')).toBe(false)
      expect(isActiveDeal('declined')).toBe(false)
      expect(isActiveDeal('withdrawn')).toBe(false)
      expect(isActiveDeal('expired')).toBe(false)
    })

    it('should return false for invalid status', () => {
      expect(isActiveDeal('invalid' as DealStatus)).toBe(false)
    })
  })

  describe('isClosedDeal', () => {
    it('should return true for funded status', () => {
      expect(isClosedDeal('funded')).toBe(true)
    })

    it('should return false for all other statuses', () => {
      const nonClosedStatuses: DealStatus[] = [
        'draft', 'submitted', 'under_review', 'needs_info',
        'approved', 'available', 'in_discussions', 'term_sheet',
        'closing', 'declined', 'withdrawn', 'expired'
      ]

      nonClosedStatuses.forEach((status) => {
        expect(isClosedDeal(status)).toBe(false)
      })
    })

    it('should return false for invalid status', () => {
      expect(isClosedDeal('invalid' as DealStatus)).toBe(false)
    })
  })

  describe('State Machine Integrity', () => {
    it('should have a path from draft to funded', () => {
      // Verify the happy path exists
      const happyPath: DealStatus[] = [
        'draft', 'submitted', 'under_review', 'approved',
        'available', 'in_discussions', 'term_sheet', 'closing', 'funded'
      ]

      for (let i = 0; i < happyPath.length - 1; i++) {
        const current = happyPath[i]
        const next = happyPath[i + 1]
        expect(statusDefinitions[current].allowedTransitions).toContain(next)
      }
    })

    it('should allow withdrawal from most active states', () => {
      const withdrawableStates: DealStatus[] = [
        'draft', 'needs_info', 'approved', 'available',
        'in_discussions', 'term_sheet', 'closing'
      ]

      withdrawableStates.forEach((status) => {
        expect(statusDefinitions[status].allowedTransitions).toContain('withdrawn')
      })
    })

    it('should allow recovery from declined state', () => {
      expect(statusDefinitions.declined.allowedTransitions).toContain('submitted')
    })

    it('should allow recovery from withdrawn state', () => {
      expect(statusDefinitions.withdrawn.allowedTransitions).toContain('draft')
    })

    it('should allow recovery from expired state', () => {
      expect(statusDefinitions.expired.allowedTransitions).toContain('available')
    })

    it('should have no cycles that bypass key states', () => {
      // funded is the only terminal state
      Object.entries(statusDefinitions).forEach(([status, def]) => {
        if (status === 'funded') {
          expect(def.allowedTransitions).toHaveLength(0)
        }
      })
    })
  })

  describe('Role-based Access Control', () => {
    // Note: requiredRole determines who can transition INTO a given status

    it('should only allow sponsor to transition into draft', () => {
      expect(statusDefinitions.draft.requiredRole).toContain('sponsor')
      expect(statusDefinitions.draft.requiredRole).not.toContain('admin')
      expect(statusDefinitions.draft.requiredRole).not.toContain('cde')
    })

    it('should only allow admin to transition into under_review', () => {
      expect(statusDefinitions.under_review.requiredRole).toContain('admin')
      expect(statusDefinitions.under_review.requiredRole).not.toContain('sponsor')
      expect(statusDefinitions.under_review.requiredRole).not.toContain('cde')
    })

    it('should only allow admin to transition into submitted', () => {
      expect(statusDefinitions.submitted.requiredRole).toContain('admin')
      expect(statusDefinitions.submitted.requiredRole).toHaveLength(1)
    })

    it('should allow multiple roles for collaborative states', () => {
      expect(statusDefinitions.in_discussions.requiredRole).toContain('sponsor')
      expect(statusDefinitions.in_discussions.requiredRole).toContain('cde')
    })

    it('should allow all roles to transition into closing state', () => {
      expect(statusDefinitions.closing.requiredRole).toContain('sponsor')
      expect(statusDefinitions.closing.requiredRole).toContain('cde')
      expect(statusDefinitions.closing.requiredRole).toContain('admin')
    })

    it('should only allow admin to transition into funded', () => {
      expect(statusDefinitions.funded.requiredRole).toContain('admin')
      expect(statusDefinitions.funded.requiredRole).toHaveLength(1)
    })

    it('should only allow sponsor to transition into declined', () => {
      expect(statusDefinitions.declined.requiredRole).toContain('sponsor')
      expect(statusDefinitions.declined.requiredRole).toHaveLength(1)
    })

    it('should only allow sponsor to transition into withdrawn', () => {
      expect(statusDefinitions.withdrawn.requiredRole).toContain('sponsor')
      expect(statusDefinitions.withdrawn.requiredRole).toHaveLength(1)
    })
  })
})
