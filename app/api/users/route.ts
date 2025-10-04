import { NextResponse } from 'next/server';
import { supabase } from '../../utils/supabaseClient';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { authErrorResponse, ensureRole, refreshAuthCookie, requireAuth } from '../../utils/auth';

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
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    let query = supabase
      .from('users')
      .select('id, name, email, role, provinsi, categories', { count: 'exact' })
      .range(from, to)
      .order('name', { ascending: true });

    if (search) {
      // Filter by name or email (case-insensitive)
      query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%`);
    }

    if (nameParam) {
      query = query.ilike('name', `%${nameParam}%`);
    }

    if (emailParam) {
      query = query.ilike('email', `%${emailParam}%`);
    }

    if (roleFilters.length > 0) {
      query = query.in('role', roleFilters);
    }

  if (provinceFilters.length > 0) {
    query = query.in('provinsi', provinceFilters);
  }    const { data, error, count } = await query;
    if (error) {
      console.error('Supabase query error:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    // Get all unique category IDs from all users
    const allCategoryIds = [...new Set((data || []).flatMap((user) => user.categories || []).filter(Boolean))];
    let categoryMap: Record<string, string> = {};
    if (allCategoryIds.length > 0) {
      const { data: categoryData, error: categoryError } = await supabase
        .from('categories')
        .select('id, name')
        .in('id', allCategoryIds);
      if (categoryError) {
        console.error('Error fetching categories:', categoryError);
        return NextResponse.json({ success: false, error: categoryError.message }, { status: 500 });
      }
      categoryMap = Object.fromEntries((categoryData || []).map((row) => [row.id, row.name]));
    }

    // Convert category IDs to names in the response
    const processedData = (data || []).map(user => ({
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
        let countQuery = supabase
          .from('users')
          .select('id', { head: true, count: 'exact' })
          .eq('role', role);
        if (search) {
          countQuery = countQuery.or(`name.ilike.%${search}%,email.ilike.%${search}%`);
        }
        if (nameParam) {
          countQuery = countQuery.ilike('name', `%${nameParam}%`);
        }
        if (emailParam) {
          countQuery = countQuery.ilike('email', `%${emailParam}%`);
        }
        if (provinceFilters.length > 0) {
          countQuery = countQuery.in('provinsi', provinceFilters);
        }
        const { count: roleCount, error: roleError } = await countQuery;
        if (roleError) {
          throw roleError;
        }
        return roleCount ?? 0;
      })).catch((roleErr: Error) => {
        console.error('Gagal menghitung ringkasan role', roleErr);
        return null;
      });

      if (Array.isArray(summaryResults)) {
        roleSummary = {
          admin: summaryResults[0] ?? 0,
          teacher: summaryResults[1] ?? 0,
          student: summaryResults[2] ?? 0,
        };
      }
    }

    const body: Record<string, unknown> = {
      success: true,
      users: processedData,
      total: count ?? 0,
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
  const { error } = await supabase
    .from('users')
    .update(updateData)
    .eq('id', id);
  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
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

  // Check if email already exists
  const { data: existing } = await supabase
    .from('users')
    .select('id')
    .eq('email', email)
    .single();

  if (existing) {
    return NextResponse.json({ success: false, error: 'Email sudah terdaftar.' }, { status: 400 });
  }

  const hashed = await bcrypt.hash(password || 'ilmi123', 10);
  const user = {
    id: uuidv4(),
    name,
    email,
    role,
    provinsi: provinsi || '',
    password: hashed,
  };

  const { error } = await supabase
    .from('users')
    .insert([user]);

  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
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

  // Check if user exists
  const { data: existing, error: checkError } = await supabase
    .from('users')
    .select('id, name, email, role')
    .eq('id', id)
    .single();

  if (checkError || !existing) {
    return NextResponse.json({ success: false, error: 'User tidak ditemukan.' }, { status: 404 });
  }

  // If user is a teacher, reassign their courses to an admin
  if (existing.role === 'teacher') {
    // Find an admin to reassign courses to
    const { data: adminUser, error: adminError } = await supabase
      .from('users')
      .select('id, name')
      .eq('role', 'admin')
      .limit(1)
      .single();

    if (adminError || !adminUser) {
      return NextResponse.json({ 
        success: false, 
        error: 'Tidak dapat menghapus teacher karena tidak ada admin untuk mengambil alih course. Harap buat admin terlebih dahulu.' 
      }, { status: 400 });
    }

    // Reassign all courses from this teacher to the admin
    const { error: reassignError } = await supabase
      .from('courses')
      .update({ teacher_id: adminUser.id })
      .eq('teacher_id', id);

    if (reassignError) {
      console.error('Error reassigning courses:', reassignError);
      return NextResponse.json({ success: false, error: 'Gagal mengalihkan course ke admin.' }, { status: 500 });
    }
  }

  // Delete user
  const { error } = await supabase
    .from('users')
    .delete()
    .eq('id', id);

  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }

  const response = NextResponse.json({ 
    success: true, 
    message: `User ${existing.name} (${existing.email}) berhasil dihapus.` 
  });
  if (shouldRefresh) {
    await refreshAuthCookie(response, payload);
  }
  return response;
}
