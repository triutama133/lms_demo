import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { authErrorResponse, refreshAuthCookie, requireAuth } from '../../../utils/auth';

const prisma = new PrismaClient();

export async function POST(req: Request) {
  const body = await req.json();
  const { user_id, material_id, status } = body;
  if (!user_id || !material_id || !status) {
    return NextResponse.json({ success: false, error: 'Data tidak lengkap' });
  }
  let auth;
  try {
    auth = await requireAuth();
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
  if (payload.sub !== user_id && payload.role !== 'admin' && payload.role !== 'teacher') {
    return authErrorResponse(new Error('Forbidden'));
  }

  try {
    // Get material to find courseId
    const material = await prisma.material.findUnique({
      where: { id: material_id },
      select: { courseId: true }
    });

    if (!material || !material.courseId) {
      return finalize({ success: false, error: 'Material tidak ditemukan atau tidak memiliki course' });
    }

    // Upsert progress
    await prisma.progress.upsert({
      where: {
        userId_courseId_materialId: {
          userId: user_id,
          courseId: material.courseId,
          materialId: material_id
        }
      },
      update: {
        completed: status === 'completed',
        completedAt: status === 'completed' ? new Date() : null,
        updatedAt: new Date()
      },
      create: {
        userId: user_id,
        courseId: material.courseId,
        materialId: material_id,
        completed: status === 'completed',
        completedAt: status === 'completed' ? new Date() : null
      }
    });

    return finalize({ success: true });
  } catch (error) {
    console.error('Error updating progress:', error);
    return finalize({ success: false, error: 'Gagal update progress' });
  }
}
