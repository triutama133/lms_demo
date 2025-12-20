import { NextResponse } from 'next/server';
import { authErrorResponse, ensureRole, refreshAuthCookie, requireAuth } from '../../../../utils/auth';
import { prisma } from "@/app/utils/supabaseClient";

export async function GET(request: Request) {
  let auth;
  try {
    auth = await requireAuth();
    ensureRole(auth.payload, 'admin');
  } catch (error) {
    return authErrorResponse(error);
  }
  const { payload, shouldRefresh } = auth;
  const { searchParams } = new URL(request.url);
  const multi = searchParams.get('user_ids');
  if (multi) {
    const rawIds = multi.split(',').map((id) => id.trim()).filter(Boolean);
    if (rawIds.length === 0) {
      return NextResponse.json({ success: false, error: 'user_ids wajib.' }, { status: 400 });
    }
    const users = await prisma.user.findMany({
      where: { id: { in: rawIds } },
      select: { id: true, categories: true }
    });
    const assignments: Record<string, string[]> = {};
    rawIds.forEach((id) => {
      assignments[id] = [];
    });
    users.forEach((user: { id: string; categories: string[] | null }) => {
      assignments[user.id] = user.categories || [];
    });
    const response = NextResponse.json({ success: true, assignments });
    if (shouldRefresh) await refreshAuthCookie(response, payload);
    return response;
  }
  const user_id = searchParams.get('user_id') ?? '';
  if (!user_id) {
    return NextResponse.json({ success: false, error: 'user_id wajib.' }, { status: 400 });
  }
  const user = await prisma.user.findUnique({
    where: { id: user_id },
    select: { categories: true }
  });
  if (!user) {
    return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
  }
  const assigned = user.categories || [];
  const response = NextResponse.json({ success: true, assigned });
  if (shouldRefresh) await refreshAuthCookie(response, payload);
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
  const { user_id, category_id } = body ?? {};
  if (!user_id || !category_id) {
    return NextResponse.json({ success: false, error: 'user_id dan category_id wajib.' }, { status: 400 });
  }

  // Get current categories for the user
  const userData = await prisma.user.findUnique({
    where: { id: user_id },
    select: { categories: true }
  });

  if (!userData) {
    return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
  }

  const currentCategories = userData.categories || [];
  const newCategories = [...new Set([...currentCategories, category_id])]; // Avoid duplicates

  await prisma.user.update({
    where: { id: user_id },
    data: { categories: newCategories }
  });

  const response = NextResponse.json({ success: true }, { status: 200 });
  if (shouldRefresh) await refreshAuthCookie(response, payload);
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
  const body = await request.json();
  const { user_id, category_id } = body ?? {};
  if (!user_id || !category_id) {
    return NextResponse.json({ success: false, error: 'user_id dan category_id wajib.' }, { status: 400 });
  }

  // Get current categories for the user
  const userData = await prisma.user.findUnique({
    where: { id: user_id },
    select: { categories: true }
  });

  if (!userData) {
    return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
  }

  const currentCategories = userData.categories || [];
  const newCategories = currentCategories.filter((id: string) => id !== category_id);

  await prisma.user.update({
    where: { id: user_id },
    data: { categories: newCategories }
  });

  const response = NextResponse.json({ success: true }, { status: 200 });
  if (shouldRefresh) await refreshAuthCookie(response, payload);
  return response;
}
