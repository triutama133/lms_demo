import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { authErrorResponse, ensureRole, refreshAuthCookie, requireAuth } from '../../../../utils/auth';
import { dbService } from '../../../../../utils/database';
import ExcelJS from 'exceljs';

export async function POST(req: Request) {
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
    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return finalize({ success: false, error: 'File tidak ditemukan' }, { status: 400 });
    }

    // Validate file type
    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      return finalize({ success: false, error: 'File harus berformat Excel (.xlsx atau .xls)' }, { status: 400 });
    }

    // Parse Excel file
    const workbook = new ExcelJS.Workbook();
    const arrayBuffer = await file.arrayBuffer();
    await workbook.xlsx.load(arrayBuffer);
    const worksheet = workbook.getWorksheet(1); // First worksheet

    if (!worksheet) {
      return finalize({ success: false, error: 'File Excel tidak valid atau kosong' }, { status: 400 });
    }

    const jsonData: Record<string, unknown>[] = [];
    worksheet.eachRow((row: ExcelJS.Row, rowNumber: number) => {
      if (rowNumber === 1) return; // Skip header row

      const rowData: Record<string, unknown> = {};
      row.eachCell((cell: ExcelJS.Cell, colNumber: number) => {
        const headerCell = worksheet.getCell(1, colNumber);
        const header = headerCell.value ? String(headerCell.value).toLowerCase() : `col${colNumber}`;
        rowData[header] = cell.value;
      });
      jsonData.push(rowData);
    });

    if (jsonData.length === 0) {
      return finalize({ success: false, error: 'File Excel kosong' }, { status: 400 });
    }

    // Validate and transform data
    const users: Array<{
      name: string;
      email: string;
      role: string;
      provinsi?: string;
      password?: string;
    }> = [];

    for (const [index, row] of jsonData.entries()) {
      const rowData = row as Record<string, unknown>;
      const rowNum = index + 2; // +2 because Excel starts at 1 and we skip header

      const name = String(rowData.name || rowData.nama || '').trim();
      const email = String(rowData.email || '').trim();
      const role = String(rowData.role || '').trim().toLowerCase();
      const provinsi = String(rowData.provinsi || '').trim();

      // Validation
      if (!name) {
        return finalize({
          success: false,
          error: `Baris ${rowNum}: Kolom 'name' atau 'nama' wajib diisi`
        }, { status: 400 });
      }

      if (!email) {
        return finalize({
          success: false,
          error: `Baris ${rowNum}: Kolom 'email' wajib diisi`
        }, { status: 400 });
      }

      if (!role) {
        return finalize({
          success: false,
          error: `Baris ${rowNum}: Kolom 'role' wajib diisi`
        }, { status: 400 });
      }

      if (!['student', 'teacher', 'admin'].includes(role)) {
        return finalize({
          success: false,
          error: `Baris ${rowNum}: Role harus 'student', 'teacher', atau 'admin'`
        }, { status: 400 });
      }

      users.push({
        name,
        email,
        role,
        provinsi: provinsi || '',
        password: 'ilmi123' // Default password
      });
    }

    // Use existing bulk import logic
    const { users: newUsers } = { users };

    if (!Array.isArray(newUsers) || newUsers.length === 0) {
      return finalize({ success: false, error: 'Data user tidak valid' }, { status: 400 });
    }

    type CreatedUser = {
      id: string;
      name: string;
      email: string;
      role: string;
      provinsi: string;
    };

    type FailedUser = {
      idx: number;
      errors: string[];
      user: Record<string, unknown>;
    };

    const created: CreatedUser[] = [];
    const failed: FailedUser[] = [];

    for (const [idx, u] of newUsers.entries()) {
      const errors: string[] = [];
      if (!u.name) errors.push('Field "name" wajib');
      if (!u.email) errors.push('Field "email" wajib');
      if (!u.role) errors.push('Field "role" wajib');
      if (u.role && !['student','teacher','admin'].includes((u.role+'').toLowerCase())) errors.push('Role harus student/teacher/admin');

      if (errors.length > 0) {
        failed.push({ idx: idx+1, errors, user: u });
        continue;
      }

      // Set default password jika kosong
      const rawPassword = u.password && u.password.trim() ? u.password : 'ilmi123';

      // Cek email duplikat
      const existing = await dbService.user.findFirst({
        where: { email: u.email },
        select: { id: true }
      }) as { id: string } | null;

      if (existing) {
        failed.push({ idx: idx+1, errors: [`Email ${u.email} sudah terdaftar`], user: u });
        continue;
      }

      // Hash password
      const hashed = await bcrypt.hash(rawPassword, 10);
      const user = {
        id: uuidv4(),
        name: u.name,
        email: u.email,
        role: u.role,
        provinsi: u.provinsi || '',
        password: hashed,
        tenantId: process.env.TENANT_ID || 'lms_1'
      };

      try {
        await dbService.user.create({
          data: user
        });
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Database error';
        failed.push({ idx: idx+1, errors: [errorMsg], user: u });
        continue;
      }

      const { password: _pw, ...userWithoutPassword } = user;
      void _pw;
      created.push(userWithoutPassword);
    }

    const total = created.length + failed.length;

    if (failed.length > 0) {
      return finalize({
        success: false,
        error: `Berhasil import ${created.length} dari ${total} user. ${failed.length} user gagal.`,
        imported: created.length,
        total,
        failed
      }, { status: 400 });
    }

    return finalize({
      success: true,
      imported: created.length,
      total
    });
  } catch (error) {
    console.error('Import users error:', error);
    return finalize({ success: false, error: 'Gagal mengimport user' }, { status: 500 });
  }
}