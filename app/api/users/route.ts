import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { authErrorResponse, ensureRole, refreshAuthCookie, requireAuth } from '../../utils/auth';
import { dbService } from '../../../utils/database';

interface UserWithCategories {
  id: string;
  name: string;
  email: string;
  role: string;
  provinsi: string | null;
  categories: string[];
}

interface CategoryRow {
  id: string;
  name: string;
}

export async function GET(request: Request) {
  try {
    let auth;
    try {
      auth = await requireAuth();
      ensureRole(auth.payload, 'admin');
    } catch (error) {
      console.error('Auth error:', error);
      return authErrorResponse(error);
    }
    const { payload, shouldRefresh } = auth;

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, Number(searchParams.get('page') ?? '1'));
    const limit = Math.max(1, Math.min(1000, Number(searchParams.get('limit') ?? '15')));
    const search = (searchParams.get('search') ?? '').trim();
    const nameParam = (searchParams.get('name') ?? '').trim();
    const emailParam = (searchParams.get('email') ?? '').trim();
    const includeSummary = (searchParams.get('include_summary') ?? 'true').toLowerCase() !== 'false';
    const parseList = (value: string | null) => (value ? value.split(',').map((item) => item.trim()).filter(Boolean) : []);
    const roleFilters = parseList(searchParams.get('roles') ?? searchParams.get('role'));
    const provinceFilters = parseList(searchParams.get('provinces'));
    const skip = (page - 1) * limit;

    try {
      // Build where conditions
      const where: Record<string, unknown> = {};

      if (search) {
        where.OR = [
          { name: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } }
        ];
      }

      if (nameParam) {
        where.name = { contains: nameParam, mode: 'insensitive' };
      }

      if (emailParam) {
        where.email = { contains: emailParam, mode: 'insensitive' };
      }

      if (roleFilters.length > 0) {
        where.role = { in: roleFilters };
      }

      if (provinceFilters.length > 0) {
        where.provinsi = { in: provinceFilters };
      }

      // Get users with count
      const [usersResult, totalCount] = await Promise.all([
        dbService.user.findMany({
          where,
          select: { id: true, name: true, email: true, role: true, provinsi: true, categories: true },
          orderBy: { name: 'asc' },
          skip,
          take: limit
        }),
        dbService.user.count({ where })
      ]);
      const users = usersResult as UserWithCategories[];

      // Get all unique category IDs from all users
      const allCategoryIds = [...new Set(users.flatMap((user: UserWithCategories) => user.categories || []).filter(Boolean))];
      let categoryMap: Record<string, string> = {};
      if (allCategoryIds.length > 0) {
        const categories = await dbService.category.findMany({
          where: { id: { in: allCategoryIds } },
          select: { id: true, name: true }
        }) as CategoryRow[];
        categoryMap = Object.fromEntries(categories.map((row: CategoryRow) => [row.id, row.name]));
      }

      // Convert category IDs to names in the response
      const processedData = users.map((user: UserWithCategories) => ({
        ...user,
        categories: (user.categories || []).map((catId: string) => categoryMap[catId]).filter(Boolean),
      }));

      let roleSummary: { admin: number; teacher: number; student: number } | undefined;
      if (includeSummary) {
        const roles: Array<'admin' | 'teacher' | 'student'> = ['admin', 'teacher', 'student'];
        const summaryResults = await Promise.all(roles.map(async (role) => {
          if (roleFilters.length > 0 && !roleFilters.includes(role)) {
            return 0;
          }
          const roleWhere = { ...where, role };
          const count = await dbService.user.count({ where: roleWhere });
          return count;
        }));

        roleSummary = {
          admin: summaryResults[0] ?? 0,
          teacher: summaryResults[1] ?? 0,
          student: summaryResults[2] ?? 0,
        };
      }

      const body: Record<string, unknown> = {
        success: true,
        users: processedData,
        total: totalCount,
        page,
        limit,
      };

      if (includeSummary && roleSummary) {
        body.roleSummary = roleSummary;
      }

      const response = NextResponse.json(body);
      if (shouldRefresh) {
        await refreshAuthCookie(response, payload);
      }
      return response;
    } catch (error) {
      console.error('Database query error:', error);
      const errorMsg = error instanceof Error ? error.message : 'Database error';
      return NextResponse.json({ success: false, error: errorMsg }, { status: 500 });
    }
  } catch (err) {
    console.error('Unexpected error in GET /api/users:', err);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  let auth;
  try {
    auth = await requireAuth();
    ensureRole(auth.payload, 'admin');
  } catch (error) {
    return authErrorResponse(error);
  }
  const { payload, shouldRefresh } = auth;
  const body = await request.json();
  const { id, name, email, role, password, provinsi } = body;
  if (!id || !name || !email || !role) {
    return NextResponse.json({ success: false, error: 'Semua field wajib diisi.' }, { status: 400 });
  }
  const updateData: Record<string, unknown> = { name, email, role };
  if (provinsi !== undefined) {
    updateData.provinsi = provinsi;
  }
  if (password) {
    const hashed = await bcrypt.hash(password, 10);
    updateData.password = hashed;
  }
  
  try {
    await dbService.user.update({
      where: { id },
      data: updateData
    });
  } catch (error) {
    console.error('Database update error:', error);
    const errorMsg = error instanceof Error ? error.message : 'Database error';
    return NextResponse.json({ success: false, error: errorMsg }, { status: 500 });
  }

  const response = NextResponse.json({ success: true });
  if (shouldRefresh) {
    await refreshAuthCookie(response, payload);
  }
  return response;
}

export async function POST(request: Request) {
  let auth;
  try {
    auth = await requireAuth();
    ensureRole(auth.payload, 'admin');
  } catch (error) {
    return authErrorResponse(error);
  }
  const { payload, shouldRefresh } = auth;
  const body = await request.json();
  const { name, email, role, password, provinsi } = body;
  if (!name || !email || !role) {
    return NextResponse.json({ success: false, error: 'Nama, email, dan role wajib diisi.' }, { status: 400 });
  }
  if (!['student', 'teacher', 'admin'].includes(role)) {
    return NextResponse.json({ success: false, error: 'Role harus student, teacher, atau admin.' }, { status: 400 });
  }

  try {
    // Check if email already exists
    let existing;
    try {
      existing = await dbService.user.findUnique({
        where: { email }
      }) as { id: string } | null;
    } catch (checkError) {
      console.error('Error checking existing user:', checkError);
      return NextResponse.json({ success: false, error: 'Error checking user existence.' }, { status: 500 });
    }

    if (existing) {
      return NextResponse.json({ success: false, error: 'Email sudah terdaftar.' }, { status: 400 });
    }

    const hashed = await bcrypt.hash(password || 'ilmi123', 10);
    const user = {
      ...(process.env.DATABASE_TYPE === 'prisma' ? { id: uuidv4() } : {}),
      name,
      email,
      role,
      provinsi: provinsi || '',
      password: hashed,
      tenantId: process.env.TENANT_ID || 'lms_1'
      // categories: [], // Remove to use default
    };

    await dbService.user.create({
      data: user
    });
  } catch (error) {
    console.error('Database create error:', error);
    const errorMsg = error instanceof Error ? error.message : 'Database error';
    return NextResponse.json({ success: false, error: errorMsg }, { status: 500 });
  }

  const response = NextResponse.json({ success: true });
  if (shouldRefresh) {
    await refreshAuthCookie(response, payload);
  }
  return response;
}

export async function DELETE(request: Request) {
  let auth;
  try {
    auth = await requireAuth();
    ensureRole(auth.payload, 'admin');
  } catch (error) {
    return authErrorResponse(error);
  }
  const { payload, shouldRefresh } = auth;
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ success: false, error: 'ID user wajib disertakan.' }, { status: 400 });
  }

  try {
    // Check if user exists
    const existing = await dbService.user.findUnique({
      where: { id },
      select: { id: true, name: true, email: true, role: true }
    }) as { id: string; name: string; email: string; role: string } | null;

    if (!existing) {
      return NextResponse.json({ success: false, error: 'User tidak ditemukan.' }, { status: 404 });
    }

    // If user is a teacher, reassign their courses to an admin
    if (existing.role === 'teacher') {
      // Find an admin to reassign courses to
      const adminUser = await dbService.user.findFirst({
        where: { role: 'admin' },
        select: { id: true, name: true }
      }) as { id: string; name: string } | null;

      if (!adminUser) {
        return NextResponse.json({ 
          success: false, 
          error: 'Tidak dapat menghapus teacher karena tidak ada admin untuk mengambil alih course. Harap buat admin terlebih dahulu.' 
        }, { status: 400 });
      }

      // Reassign all courses from this teacher to the admin
      await dbService.course.updateMany({
        where: { teacherId: id },
        data: { teacherId: adminUser.id }
      });
    }

    // Delete user
    await dbService.user.delete({
      where: { id }
    });

    const response = NextResponse.json({ 
      success: true, 
      message: `User ${existing.name} (${existing.email}) berhasil dihapus.` 
    });
    if (shouldRefresh) {
      await refreshAuthCookie(response, payload);
    }
    return response;
  } catch (error) {
    console.error('Database delete error:', error);
    const errorMsg = error instanceof Error ? error.message : 'Database error';
    return NextResponse.json({ success: false, error: errorMsg }, { status: 500 });
  }
}
