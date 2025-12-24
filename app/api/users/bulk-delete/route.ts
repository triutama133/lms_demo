import { NextResponse } from 'next/server';
import { authErrorResponse, ensureRole, refreshAuthCookie, requireAuth } from '../../../utils/auth';
import { dbService } from '../../../../utils/database';

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

    // Short-lived debug: log raw incoming shape when an error occurs
    // (helps capture shapes like [{ id: { value: '...' } }])
    const rawPayload = user_ids;

    // UUID validator
    const uuidRe = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

    // Recursively try to extract a string-looking id from a value
    const extractId = (val: unknown, depth = 0): string | null => {
      if (!val || depth > 4) return null;
      if (typeof val === 'string') {
        const s = val.trim();
        return s.length ? s : null;
      }
      if (Array.isArray(val)) {
        for (const v of val) {
          const r = extractId(v, depth + 1);
          if (r) return r;
        }
        return null;
      }
      if (typeof val === 'object') {
        const o = val as Record<string, unknown>;
        // Common id fields
        for (const key of ['id', 'user_id', 'uuid', 'value']) {
          if (key in o) {
            const maybe = extractId(o[key], depth + 1);
            if (maybe) return maybe;
          }
        }
        // Fallback: search all values
        for (const k of Object.keys(o)) {
          const maybe = extractId(o[k], depth + 1);
          if (maybe) return maybe;
        }
      }
      return null;
    };

    const candidateIds: string[] = (user_ids || []).map((entry: unknown) => extractId(entry)).filter((v): v is string => !!v);
    const validUserIds = Array.from(new Set(candidateIds.filter(id => uuidRe.test(id))));

    // Build list of invalid incoming entries for debugging (empty, object, or non-UUID)
    const safePreview = (v: unknown) => {
      try {
        const s = JSON.stringify(v);
        return s.length > 200 ? s.slice(0, 200) + '...' : s;
      } catch (e) {
        try { return String(v); } catch { return '<unserializable>' }
      }
    };

    const invalidEntries: Array<{ index: number; reason: string; extracted?: string | null; preview: string }> = [];
    for (let i = 0; i < user_ids.length; i++) {
      const entry = user_ids[i];
      const extracted = extractId(entry);
      if (!extracted) {
        invalidEntries.push({ index: i, reason: 'no-id-extracted', extracted: null, preview: safePreview(entry) });
        continue;
      }
      if (!uuidRe.test(extracted)) {
        invalidEntries.push({ index: i, reason: 'invalid-uuid-format', extracted, preview: safePreview(entry) });
      }
    }

    if (invalidEntries.length > 0) {
      console.error('bulk-delete found invalid user_ids:', invalidEntries.slice(0, 20));
      return NextResponse.json({ success: false, error: 'Beberapa user_ids tidak valid. Periksa payload.', invalid_entries: invalidEntries.slice(0, 20) }, { status: 400 });
    }

    // Check if users exist
    const existingUsers = await dbService.user.findMany({
      where: { id: { in: validUserIds } },
      select: { id: true, name: true, email: true, role: true }
    }) as { id: string; name: string; email: string; role: string }[];

    const foundIds = new Set(existingUsers.map(user => user.id));
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

      // Reassign all courses from these teachers to the admin
      const teacherIds = teacherUsers.map(user => user.id);
      await dbService.course.updateMany({
        where: { teacherId: { in: teacherIds } },
        data: { teacherId: adminUser.id }
      });
    }

    // Delete users - CASCADE DELETE will handle related records
    await dbService.user.deleteMany({
      where: { id: { in: validUserIds } }
    });

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