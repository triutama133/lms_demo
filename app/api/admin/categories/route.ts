import { NextResponse } from 'next/server';
import { authErrorResponse, ensureRole, refreshAuthCookie, requireAuth } from '../../../utils/auth';
import { prisma } from "@/app/utils/supabaseClient";
import { v4 as uuidv4 } from 'uuid';

export async function GET() {
  let auth;
  try {
    auth = await requireAuth();
    ensureRole(auth.payload, 'admin');
  } catch (error) {
    return authErrorResponse(error);
  }
  const { payload, shouldRefresh } = auth;
  try {
    const categories = await prisma.category.findMany({
      select: { id: true, name: true, description: true, createdAt: true },
      orderBy: { name: 'asc' }
    });
    const response = NextResponse.json({ success: true, categories });
    if (shouldRefresh) await refreshAuthCookie(response, payload);
    return response;
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Database error';
    return NextResponse.json({ success: false, error: errorMsg }, { status: 500 });
  }
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
  const { name, description } = body ?? {};
  if (!name || typeof name !== 'string') {
    return NextResponse.json({ success: false, error: 'Nama kategori wajib.' }, { status: 400 });
  }

  // Generate UUID for category ID
  const categoryId = uuidv4();

  try {
    const category = await prisma.category.create({
      data: { id: categoryId, name, description }
    });
    const response = NextResponse.json({ success: true, category }, { status: 200 });
    if (shouldRefresh) await refreshAuthCookie(response, payload);
    return response;
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Database error';
    return NextResponse.json({ success: false, error: errorMsg }, { status: 500 });
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
  const { id, name, description } = body ?? {};
  if (!id || !name) {
    return NextResponse.json({ success: false, error: 'id dan name wajib.' }, { status: 400 });
  }
  try {
    const category = await prisma.category.update({
      where: { id },
      data: { name, description }
    });
    const response = NextResponse.json({ success: true, category }, { status: 200 });
    if (shouldRefresh) await refreshAuthCookie(response, payload);
    return response;
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Database error';
    return NextResponse.json({ success: false, error: errorMsg }, { status: 500 });
  }
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
  const { id } = body ?? {};
  if (!id) {
    return NextResponse.json({ success: false, error: 'id wajib.' }, { status: 400 });
  }
  try {
    await prisma.category.delete({ where: { id } });
    const response = NextResponse.json({ success: true }, { status: 200 });
    if (shouldRefresh) await refreshAuthCookie(response, payload);
    return response;
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Database error';
    return NextResponse.json({ success: false, error: errorMsg }, { status: 500 });
  }
}

