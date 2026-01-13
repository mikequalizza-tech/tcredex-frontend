/**
 * Role Configuration Module
 * =========================
 * Centralized role-based access control for tCredex.
 *
 * Usage:
 * ```tsx
 * import { useRoleConfig } from '@/lib/roles';
 *
 * function MyComponent() {
 *   const { orgType, marketplace, canAccess } = useRoleConfig();
 *
 *   if (!canAccess('allocations')) {
 *     return <AccessDenied />;
 *   }
 *
 *   return <div>Welcome, {orgType}!</div>;
 * }
 * ```
 */

// Core types and validation
export type { OrgType, SystemOrgType, AllOrgTypes } from './config';
export { 
  isValidOrgType,
  isValidAllOrgType,
  validateOrgType 
} from './config';

// Configuration exports
export {
  PIPELINE_STAGES,
  MARKETPLACE_CONFIG,
  MAP_CONFIG,
  NAV_ITEMS,
  DEAL_VISIBILITY,
  REQUEST_LIMITS,
  getMarketplaceConfig,
  getPipelineStages,
  getMapConfig,
  getNavItemsForRole,
  getDealVisibility,
  canAccessPage,
} from './config';

export type {
  PipelineStage,
  MarketplaceConfig,
  MapConfig,
  NavItem,
  VisibilityTier,
  DealCardVisibility,
} from './config';

// Query exports
export {
  fetchMarketplaceForRole,
  fetchPipelineForRole,
} from './queries';

export type {
  InvestorCard,
  MarketplaceResult,
} from './queries';

// Hook exports
export {
  useRoleConfig,
  useMarketplaceConfig,
  usePipelineStages,
  useMapConfig,
  usePageAccess,
} from './hooks';

export type { RoleConfig } from './hooks';
