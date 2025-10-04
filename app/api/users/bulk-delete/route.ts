import { NextResponse } from 'next/server';
import { supabase } from '../../../utils/supabaseClient';
import { authErrorResponse, ensureRole, refreshAuthCookie, requireAuth } from '../../../utils/auth';

export async function DELETE(request: Request) {
  let auth;
  try {
    auth = await requireAuth();
    ensureRole(auth.payload, 'admin');
  } catch (error) {
    return authErrorResponse(error);
  }
  const { payload, shouldRefresh } = auth;

  try {
    const body = await request.json();
    const { user_ids } = body;

    if (!Array.isArray(user_ids) || user_ids.length === 0) {
      return NextResponse.json({ success: false, error: 'user_ids harus berupa array dan tidak boleh kosong.' }, { status: 400 });
    }

    // Validate that all IDs are strings and not empty
    const validUserIds = user_ids.filter((id): id is string => typeof id === 'string' && id.trim().length > 0);

    if (validUserIds.length === 0) {
      return NextResponse.json({ success: false, error: 'Tidak ada user ID yang valid.' }, { status: 400 });
    }

    // Check if users exist
    const { data: existingUsers, error: checkError } = await supabase
      .from('users')
      .select('id, name, email, role')
      .in('id', validUserIds);

    if (checkError) {
      return NextResponse.json({ success: false, error: checkError.message }, { status: 500 });
    }

    const foundIds = new Set((existingUsers || []).map(user => user.id));
    const notFoundIds = validUserIds.filter(id => !foundIds.has(id));

    if (notFoundIds.length > 0) {
      return NextResponse.json({
        success: false,
        error: `User dengan ID berikut tidak ditemukan: ${notFoundIds.join(', ')}`
      }, { status: 404 });
    }

    // Prevent deleting admin users for safety (optional - can be removed if needed)
    const adminUsers = (existingUsers || []).filter(user => user.role === 'admin');
    if (adminUsers.length > 0) {
      return NextResponse.json({
        success: false,
        error: `Tidak dapat menghapus user dengan role admin: ${adminUsers.map(u => u.name).join(', ')}`
      }, { status: 400 });
    }

    // Handle teacher reassignment - find an admin to reassign courses to
    const teacherUsers = (existingUsers || []).filter(user => user.role === 'teacher');
    if (teacherUsers.length > 0) {
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

      // Reassign all courses from these teachers to the admin
      const teacherIds = teacherUsers.map(user => user.id);
      const { error: reassignError } = await supabase
        .from('courses')
        .update({ teacher_id: adminUser.id })
        .in('teacher_id', teacherIds);

      if (reassignError) {
        console.error('Error reassigning courses:', reassignError);
        return NextResponse.json({ success: false, error: 'Gagal mengalihkan course ke admin.' }, { status: 500 });
      }
    }

    // Delete users - CASCADE DELETE will handle related records
    const { error: deleteError } = await supabase
      .from('users')
      .delete()
      .in('id', validUserIds);

    if (deleteError) {
      return NextResponse.json({ success: false, error: deleteError.message }, { status: 500 });
    }

    const deletedUsers = existingUsers || [];
    const response = NextResponse.json({
      success: true,
      message: `Berhasil menghapus ${deletedUsers.length} user.`,
      deleted_users: deletedUsers.map(u => ({ id: u.id, name: u.name, email: u.email, role: u.role }))
    });

    if (shouldRefresh) {
      await refreshAuthCookie(response, payload);
    }
    return response;

  } catch (err) {
    console.error('Unexpected error in bulk delete users:', err);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}