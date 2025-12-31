/**
 * tCredex Backend API Client
 *
 * This module provides typed access to the backend API services.
 * All business logic now runs on the backend - frontend just calls these APIs.
 */

// Backend API base URL
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

// =============================================================================
// TYPES
// =============================================================================

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

interface MatchScore {
  cdeId: string;
  cdeName: string;
  totalScore: number;
  breakdown: {
    geographic: number;
    sector: number;
    allocation: number;
    distress: number;
    historical: number;
  };
  matchStrength: 'excellent' | 'good' | 'fair' | 'weak';
  reasons: string[];
}

interface MatchResult {
  dealId: string;
  projectName: string;
  matches: MatchScore[];
  timestamp: string;
}

interface FeeBreakdown {
  tier1Amount: number;
  tier1Fee: number;
  tier2Amount: number;
  tier2Fee: number;
  totalFee: number;
  effectiveRate: number;
}

interface FeeResult {
  amount: number;
  fee: number;
  feeFormatted: string;
  effectiveRate: number;
  breakdown: FeeBreakdown;
}

interface DebarmentResult {
  name: string;
  isDebarred: boolean;
  checkedAt: string;
  details?: string;
  cacheHit?: boolean;
}

interface ExpiringTermSheet {
  id: string;
  dealId: string;
  dealName?: string;
  cdeName?: string;
  expiresAt: string;
  daysRemaining: number;
  expiryStatus: 'expired' | 'critical' | 'warning' | 'ok';
}

// =============================================================================
// API CLIENT
// =============================================================================

class BackendApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      // Check content type before parsing JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        if (!response.ok) {
          return {
            success: false,
            error: text || `HTTP ${response.status}`,
          };
        }
        // Non-JSON success response (unusual but handle it)
        return { success: true, data: text as unknown as T };
      }

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.error || data.message || `HTTP ${response.status}`,
        };
      }

      return data;
    } catch (error) {
      console.error(`API request failed: ${endpoint}`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error',
      };
    }
  }

  // ===========================================================================
  // HEALTH CHECK
  // ===========================================================================

  async health() {
    return this.request<{
      status: string;
      service: string;
      version: string;
      timestamp: string;
    }>('/api/health');
  }

  // ===========================================================================
  // AUTOMATCH
  // ===========================================================================

  async findMatches(
    dealId: string,
    options?: {
      minScore?: number;
      maxResults?: number;
      notifyMatches?: boolean;
    }
  ): Promise<ApiResponse<MatchResult>> {
    return this.request<MatchResult>('/api/automatch', {
      method: 'POST',
      body: JSON.stringify({ dealId, options }),
    });
  }

  async runAutoMatchBatch(): Promise<
    ApiResponse<{ processed: number; matches: number }>
  > {
    return this.request('/api/automatch', {
      method: 'POST',
      body: JSON.stringify({ action: 'batch' }),
    });
  }

  // ===========================================================================
  // SCORING
  // ===========================================================================

  async calculateScore(input: unknown, cdeCriteria?: unknown) {
    return this.request('/api/scoring', {
      method: 'POST',
      body: JSON.stringify({ input, cdeCriteria }),
    });
  }

  async calculateBatchScores(inputs: unknown[], cdeCriteria?: unknown) {
    return this.request('/api/scoring', {
      method: 'POST',
      body: JSON.stringify({ action: 'batch', inputs, cdeCriteria }),
    });
  }

  // ===========================================================================
  // DEAL STATUS
  // ===========================================================================

  async getStatusDefinitions() {
    return this.request('/api/deals/status');
  }

  async getStatusInfo(status: string, role?: string) {
    const params = new URLSearchParams({ status });
    if (role) params.append('role', role);
    return this.request(`/api/deals/status?${params}`);
  }

  async validateTransition(
    currentStatus: string,
    newStatus: string,
    userRole: string
  ) {
    return this.request('/api/deals/status', {
      method: 'POST',
      body: JSON.stringify({ currentStatus, newStatus, userRole }),
    });
  }

  async executeTransition(
    dealId: string,
    currentStatus: string,
    newStatus: string,
    userRole: string,
    userId: string
  ) {
    return this.request('/api/deals/status', {
      method: 'POST',
      body: JSON.stringify({
        dealId,
        currentStatus,
        newStatus,
        userRole,
        userId,
        execute: true,
      }),
    });
  }

  // ===========================================================================
  // CLOSING FEES
  // ===========================================================================

  async calculateClosingFee(amount: number): Promise<ApiResponse<FeeResult>> {
    return this.request<FeeResult>('/api/closing', {
      method: 'POST',
      body: JSON.stringify({ amount }),
    });
  }

  async calculateClosingFees(amounts: number[]): Promise<ApiResponse<FeeResult[]>> {
    return this.request<FeeResult[]>('/api/closing', {
      method: 'POST',
      body: JSON.stringify({ amounts }),
    });
  }

  async getFeeSchedule() {
    return this.request('/api/closing');
  }

  // ===========================================================================
  // COMPLIANCE - DEBARMENT
  // ===========================================================================

  async checkDebarment(
    name: string,
    options?: {
      entityId?: string;
      entityType?: string;
      forceRefresh?: boolean;
    }
  ): Promise<ApiResponse<DebarmentResult>> {
    return this.request<DebarmentResult>('/api/compliance/debarment', {
      method: 'POST',
      body: JSON.stringify({ name, ...options }),
    });
  }

  async checkDebarmentMultiple(
    names: string[],
    options?: {
      entityId?: string;
      entityType?: string;
      forceRefresh?: boolean;
    }
  ): Promise<
    ApiResponse<{
      results: DebarmentResult[];
      summary: {
        total: number;
        clear: number;
        flagged: number;
        hasDebarred: boolean;
      };
    }>
  > {
    return this.request('/api/compliance/debarment', {
      method: 'POST',
      body: JSON.stringify({ names, ...options }),
    });
  }

  // ===========================================================================
  // COMPLIANCE - TERM SHEETS
  // ===========================================================================

  async getExpiringTermSheets(
    thresholdDays: number = 7
  ): Promise<
    ApiResponse<{
      thresholdDays: number;
      summary: {
        total: number;
        expired: number;
        critical: number;
        warning: number;
      };
      expiring: ExpiringTermSheet[];
    }>
  > {
    return this.request(`/api/compliance/term-sheets?days=${thresholdDays}`);
  }

  async autoExpireTermSheets(): Promise<
    ApiResponse<{
      action: string;
      expiredCount: number;
      affectedDeals: string[];
    }>
  > {
    return this.request('/api/compliance/term-sheets', {
      method: 'POST',
      body: JSON.stringify({ action: 'auto-expire' }),
    });
  }

  // ===========================================================================
  // GEO
  // ===========================================================================

  async resolveTract(address: string) {
    return this.request(
      `/api/geo/resolve-tract?address=${encodeURIComponent(address)}`
    );
  }
}

// =============================================================================
// EXPORTS
// =============================================================================

// Singleton instance
export const api = new BackendApiClient();

// Class export for custom instances
export { BackendApiClient };

// Type exports
export type {
  ApiResponse,
  MatchScore,
  MatchResult,
  FeeBreakdown,
  FeeResult,
  DebarmentResult,
  ExpiringTermSheet,
};
