import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET /api/closing-room/checklist?dealId=xxx
// GET /api/closing-room/checklist?programType=NMTC (templates only)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const dealId = searchParams.get('dealId');
    const programType = searchParams.get('programType');

    // If dealId provided, get deal-specific checklist with status
    if (dealId) {
      // First get the deal to know the program type
      const { data: deal, error: dealError } = await supabase
        .from('deals')
        .select('id, project_name, program_type')
        .eq('id', dealId)
        .single();

      if (dealError || !deal) {
        return NextResponse.json({ error: 'Deal not found' }, { status: 404 });
      }

      // Get checklist templates for this program
      const { data: templates, error: templateError } = await supabase
        .from('closing_checklist_templates')
        .select('*')
        .eq('program_type', deal.program_type)
        .order('sort_order', { ascending: true });

      if (templateError) {
        console.error('Template fetch error:', templateError);
        return NextResponse.json({ error: 'Failed to fetch templates' }, { status: 500 });
      }

      // Get deal-specific checklist status
      const { data: dealChecklist, error: checklistError } = await supabase
        .from('deal_checklists')
        .select('*')
        .eq('deal_id', dealId);

      if (checklistError) {
        console.error('Checklist fetch error:', checklistError);
      }

      // Merge templates with deal status
      const checklistMap = new Map(
        dealChecklist?.map(item => [item.template_id, item]) || []
      );

      const checklistWithStatus = templates?.map(template => ({
        ...template,
        status: checklistMap.get(template.id)?.status || 'pending',
        document_id: checklistMap.get(template.id)?.document_id || null,
        notes: checklistMap.get(template.id)?.notes || null,
        due_date: checklistMap.get(template.id)?.due_date || null,
        completed_at: checklistMap.get(template.id)?.completed_at || null,
      }));

      // Group by category
      const grouped = checklistWithStatus?.reduce((acc, item) => {
        if (!acc[item.category]) {
          acc[item.category] = [];
        }
        acc[item.category].push(item);
        return acc;
      }, {} as Record<string, typeof checklistWithStatus>);

      // Calculate progress
      const total = templates?.length || 0;
      const completed = checklistWithStatus?.filter(
        item => ['uploaded', 'approved'].includes(item.status)
      ).length || 0;

      return NextResponse.json({
        deal,
        checklist: grouped,
        progress: {
          total,
          completed,
          percentage: total > 0 ? Math.round((completed / total) * 100) : 0
        }
      });
    }

    // If programType provided, get template checklist (no deal context)
    if (programType) {
      const { data: templates, error } = await supabase
        .from('closing_checklist_templates')
        .select('*')
        .eq('program_type', programType.toUpperCase())
        .order('sort_order', { ascending: true });

      if (error) {
        return NextResponse.json({ error: 'Failed to fetch templates' }, { status: 500 });
      }

      // Group by category
      const grouped = templates?.reduce((acc, item) => {
        if (!acc[item.category]) {
          acc[item.category] = [];
        }
        acc[item.category].push(item);
        return acc;
      }, {} as Record<string, typeof templates>);

      return NextResponse.json({
        programType,
        checklist: grouped,
        totalItems: templates?.length || 0
      });
    }

    // No params - return all program types summary
    const { data: summary, error } = await supabase
      .from('closing_checklist_templates')
      .select('program_type');

    if (error) {
      return NextResponse.json({ error: 'Failed to fetch summary' }, { status: 500 });
    }

    const programCounts = summary?.reduce((acc, item) => {
      acc[item.program_type] = (acc[item.program_type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return NextResponse.json({
      programs: Object.entries(programCounts || {}).map(([type, count]) => ({
        programType: type,
        itemCount: count
      }))
    });

  } catch (error) {
    console.error('Checklist API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/closing-room/checklist - Initialize checklist for a deal
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { dealId } = body;

    if (!dealId) {
      return NextResponse.json({ error: 'dealId required' }, { status: 400 });
    }

    // Get deal info
    const { data: deal, error: dealError } = await supabase
      .from('deals')
      .select('id, program_type')
      .eq('id', dealId)
      .single();

    if (dealError || !deal) {
      return NextResponse.json({ error: 'Deal not found' }, { status: 404 });
    }

    // Get all template items for this program
    const { data: templates, error: templateError } = await supabase
      .from('closing_checklist_templates')
      .select('id')
      .eq('program_type', deal.program_type);

    if (templateError) {
      return NextResponse.json({ error: 'Failed to fetch templates' }, { status: 500 });
    }

    // Create deal_checklist entries for each template item
    const checklistItems = templates?.map(template => ({
      deal_id: dealId,
      template_id: template.id,
      status: 'pending'
    }));

    if (checklistItems && checklistItems.length > 0) {
      const { error: insertError } = await supabase
        .from('deal_checklists')
        .upsert(checklistItems, { 
          onConflict: 'deal_id,template_id',
          ignoreDuplicates: true 
        });

      if (insertError) {
        console.error('Checklist init error:', insertError);
        return NextResponse.json({ error: 'Failed to initialize checklist' }, { status: 500 });
      }
    }

    return NextResponse.json({
      success: true,
      dealId,
      itemsCreated: checklistItems?.length || 0
    });

  } catch (error) {
    console.error('Checklist POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH /api/closing-room/checklist - Update checklist item status
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { dealId, templateId, status, documentId, notes, dueDate } = body;

    if (!dealId || !templateId) {
      return NextResponse.json({ error: 'dealId and templateId required' }, { status: 400 });
    }

    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString()
    };

    if (status) updateData.status = status;
    if (documentId !== undefined) updateData.document_id = documentId;
    if (notes !== undefined) updateData.notes = notes;
    if (dueDate !== undefined) updateData.due_date = dueDate;

    // Set completed_at if status is uploaded or approved
    if (status === 'uploaded' || status === 'approved') {
      updateData.completed_at = new Date().toISOString();
    }

    // Upsert - create if doesn't exist, update if does
    const { data, error } = await supabase
      .from('deal_checklists')
      .upsert({
        deal_id: dealId,
        template_id: templateId,
        ...updateData
      }, {
        onConflict: 'deal_id,template_id'
      })
      .select()
      .single();

    if (error) {
      console.error('Checklist update error:', error);
      return NextResponse.json({ error: 'Failed to update checklist item' }, { status: 500 });
    }

    return NextResponse.json({ success: true, item: data });

  } catch (error) {
    console.error('Checklist PATCH error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
