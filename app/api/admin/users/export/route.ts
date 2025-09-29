import { NextResponse } from 'next/server';
import { supabase } from '../../../../utils/supabaseClient';
import { authErrorResponse, ensureRole, refreshAuthCookie, requireAuth } from '../../../../utils/auth';
import * as XLSX from 'xlsx';

export async function GET(request: Request) {
  let auth;
  try {
    auth = await requireAuth();
    ensureRole(auth.payload, 'admin');
  } catch (error) {
    return authErrorResponse(error);
  }

  const { payload, shouldRefresh } = auth;
  const finalize = async (body: unknown, init: ResponseInit = {}) => {
    const response = NextResponse.json(body, init);
    if (shouldRefresh) {
      await refreshAuthCookie(response, payload);
    }
    return response;
  };

  try {
    const { searchParams } = new URL(request.url);
    const userIdsParam = searchParams.get('user_ids');
    const includeCategories = searchParams.get('include_categories') === 'true';

    if (!userIdsParam) {
      return finalize({ success: false, error: 'user_ids parameter wajib diisi' }, { status: 400 });
    }

    const userIds = userIdsParam.split(',').map(id => id.trim()).filter(Boolean);

    if (userIds.length === 0) {
      return finalize({ success: false, error: 'Tidak ada user ID yang valid' }, { status: 400 });
    }

    // Get user data
    const query = supabase
      .from('users')
      .select('id, name, email, role, provinsi')
      .in('id', userIds);

    const { data: users, error: usersError } = await query;
    if (usersError) {
      return finalize({ success: false, error: usersError.message }, { status: 500 });
    }

    let exportData = users || [];

    // Include categories if requested
    if (includeCategories) {
      // Get all categories
      const { data: categories, error: catError } = await supabase
        .from('categories')
        .select('id, name');

      if (catError) {
        console.error('Error fetching categories:', catError);
      } else {
        // Get user-category assignments
        const { data: assignments, error: assignError } = await supabase
          .from('user_categories')
          .select('user_id, category_id')
          .in('user_id', userIds);

        if (!assignError && assignments) {
          const categoryMap = new Map(categories?.map(cat => [cat.id, cat.name]) || []);

          // Group assignments by user
          const userCategoryMap = new Map<string, string[]>();
          assignments.forEach(assignment => {
            if (!userCategoryMap.has(assignment.user_id)) {
              userCategoryMap.set(assignment.user_id, []);
            }
            const categoryName = categoryMap.get(assignment.category_id);
            if (categoryName) {
              userCategoryMap.get(assignment.user_id)!.push(categoryName);
            }
          });

          // Add categories to export data
          exportData = exportData.map(user => ({
            ...user,
            kategori: userCategoryMap.get(user.id)?.join(', ') || ''
          }));
        }
      }
    }

    // Create Excel workbook
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(exportData);
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Users');

    // Generate buffer
    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    // Return Excel file
    const response = new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="users_export_${new Date().toISOString().split('T')[0]}.xlsx"`,
      },
    });

    if (shouldRefresh) {
      await refreshAuthCookie(response, payload);
    }

    return response;
  } catch (error) {
    console.error('Export users error:', error);
    return finalize({ success: false, error: 'Gagal mengekspor data user' }, { status: 500 });
  }
}