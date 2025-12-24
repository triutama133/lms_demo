import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { authErrorResponse, ensureRole, refreshAuthCookie, requireAuth } from '../../../utils/auth';
import { dbService } from '../../../../utils/database';

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
    const { users: newUsers } = await req.json();
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
      const existing = await dbService.user.findUnique({
        where: { email: u.email },
        select: { id: true }
      });
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
      };
      try {
        await dbService.user.create({
          data: user
        });
      } catch (errInsert: unknown) {
        const error = errInsert as Error;
        failed.push({ idx: idx+1, errors: [error.message], user: u });
        continue;
      }
      const { password: _pw, ...userWithoutPassword } = user;
      void _pw;
      created.push(userWithoutPassword);
    }
    if (failed.length > 0) {
      return finalize({ success: false, error: 'Beberapa user gagal diimport', detail: failed, created }, { status: 400 });
    }
    return finalize({ success: true, created });
  } catch (error) {
    if (error instanceof Error && (error.message === 'Unauthorized' || error.message === 'Forbidden')) {
      return authErrorResponse(error);
    }
    return finalize({ success: false, error: 'Gagal tambah user' }, { status: 500 });
  }
}
