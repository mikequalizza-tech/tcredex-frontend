/**
 * tCredex Database Client
 * Centralized database access with typed methods
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import {
  DBOrganization,
  DBUser,
  DBCDE,
  DBCDEAllocation,
  DBSponsor,
  DBInvestor,
  DBDeal,
  DBDocument,
  DBLOI,
  DBCommitment,
  DBClosingRoom,
  DealStatus,
} from './types';

// =============================================================================
// CLIENT INITIALIZATION
// =============================================================================

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Client-side (uses anon key with RLS)
export const db = createClient(supabaseUrl, supabaseAnonKey);

// Server-side (bypasses RLS)
export const dbAdmin = createClient(
  supabaseUrl,
  supabaseServiceKey || supabaseAnonKey
);

// =============================================================================
// ORGANIZATIONS
// =============================================================================

export const organizations = {
  async getById(id: string): Promise<DBOrganization | null> {
    const { data, error } = await dbAdmin
      .from('organizations')
      .select('*')
      .eq('id', id)
      .single();
    if (error) throw error;
    return data;
  },

  async getBySlug(slug: string): Promise<DBOrganization | null> {
    const { data, error } = await dbAdmin
      .from('organizations')
      .select('*')
      .eq('slug', slug)
      .single();
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },

  async create(org: Partial<DBOrganization>): Promise<DBOrganization> {
    const { data, error } = await dbAdmin
      .from('organizations')
      .insert(org)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async update(id: string, updates: Partial<DBOrganization>): Promise<DBOrganization> {
    const { data, error } = await dbAdmin
      .from('organizations')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },
};

// =============================================================================
// USERS
// =============================================================================

export const users = {
  async getById(id: string): Promise<DBUser | null> {
    const { data, error } = await dbAdmin
      .from('users')
      .select('*, organization:organizations(*)')
      .eq('id', id)
      .single();
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },

  async getByEmail(email: string): Promise<DBUser | null> {
    const { data, error } = await dbAdmin
      .from('users')
      .select('*, organization:organizations(*)')
      .eq('email', email)
      .single();
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },

  async create(user: Partial<DBUser>): Promise<DBUser> {
    const { data, error } = await dbAdmin
      .from('users')
      .insert(user)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async update(id: string, updates: Partial<DBUser>): Promise<DBUser> {
    const { data, error } = await dbAdmin
      .from('users')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async getByOrganization(orgId: string): Promise<DBUser[]> {
    const { data, error } = await dbAdmin
      .from('users')
      .select('*')
      .eq('organization_id', orgId);
    if (error) throw error;
    return data || [];
  },
};

// =============================================================================
// CDEs
// =============================================================================

export const cdes = {
  async getById(id: string): Promise<DBCDE | null> {
    const { data, error } = await dbAdmin
      .from('cdes')
      .select(`
        *,
        organization:organizations(*),
        allocations:cde_allocations(*)
      `)
      .eq('id', id)
      .single();
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },

  async getByOrganization(orgId: string): Promise<DBCDE | null> {
    const { data, error } = await dbAdmin
      .from('cdes')
      .select(`
        *,
        organization:organizations(*),
        allocations:cde_allocations(*)
      `)
      .eq('organization_id', orgId)
      .single();
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },

  async list(status?: string): Promise<DBCDE[]> {
    let query = dbAdmin
      .from('cdes')
      .select(`
        *,
        organization:organizations(id, name, slug),
        allocations:cde_allocations(*)
      `);
    
    if (status) {
      query = query.eq('status', status);
    }
    
    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  },

  async create(cde: Partial<DBCDE>): Promise<DBCDE> {
    const { data, error } = await dbAdmin
      .from('cdes')
      .insert(cde)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async update(id: string, updates: Partial<DBCDE>): Promise<DBCDE> {
    const { data, error } = await dbAdmin
      .from('cdes')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },
};

// =============================================================================
// CDE ALLOCATIONS
// =============================================================================

export const cdeAllocations = {
  async getByCDE(cdeId: string): Promise<DBCDEAllocation[]> {
    const { data, error } = await dbAdmin
      .from('cde_allocations')
      .select('*')
      .eq('cde_id', cdeId)
      .order('year', { ascending: false });
    if (error) throw error;
    return data || [];
  },

  async create(allocation: Partial<DBCDEAllocation>): Promise<DBCDEAllocation> {
    const { data, error } = await dbAdmin
      .from('cde_allocations')
      .insert(allocation)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async update(id: string, updates: Partial<DBCDEAllocation>): Promise<DBCDEAllocation> {
    const { data, error } = await dbAdmin
      .from('cde_allocations')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async delete(id: string): Promise<void> {
    const { error } = await dbAdmin
      .from('cde_allocations')
      .delete()
      .eq('id', id);
    if (error) throw error;
  },
};

