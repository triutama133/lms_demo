import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
import { authErrorResponse, ensureRole, refreshAuthCookie, requireAuth } from '../../../../utils/auth';
import ExcelJS from 'exceljs';

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
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, name: true, email: true, role: true, provinsi: true }
    });

    let exportData = users;

    // Include categories if requested
    if (includeCategories) {
      // Get all categories
      const categories = await prisma.category.findMany({
        select: { id: true, name: true }
      });

      // Get user-category assignments
      const assignments = await prisma.userCategory.findMany({
        where: { userId: { in: userIds } },
        select: { userId: true, categoryId: true }
      });

      const categoryMap = new Map(categories.map((cat: { id: string; name: string }) => [cat.id, cat.name]));

      // Group assignments by user
      const userCategoryMap = new Map<string, string[]>();
      assignments.forEach((assignment: { userId: string; categoryId: string }) => {
        if (!userCategoryMap.has(assignment.userId)) {
          userCategoryMap.set(assignment.userId, []);
        }
        const categoryName = categoryMap.get(assignment.categoryId);
        if (categoryName) {
          userCategoryMap.get(assignment.userId)!.push(categoryName);
        }
      });

      // Add categories to export data
      exportData = exportData.map((user: { id: string; name: string; email: string; role: string; provinsi: string | null }) => ({
        ...user,
        kategori: userCategoryMap.get(user.id)?.join(', ') || ''
      }));
    }

    // Create Excel workbook
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Users');

    // Add header row
    if (exportData.length > 0) {
      worksheet.addRow(Object.keys(exportData[0]));
    }

    // Add data rows
    exportData.forEach(row => {
      worksheet.addRow(Object.values(row));
    });

    // Generate buffer
    const buffer = await workbook.xlsx.writeBuffer();

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