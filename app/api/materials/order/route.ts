import { NextRequest, NextResponse } from 'next/server';
import { authErrorResponse, ensureRole, refreshAuthCookie, requireAuth } from '../../../utils/auth';
import { dbService } from '../../../../utils/database';

export async function PATCH(req: NextRequest) {
  let auth;
  try {
    auth = await requireAuth();
    ensureRole(auth.payload, ['teacher', 'admin']);
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
    const body = await req.json();
    const { order } = body; // [{ id, order }]
    if (!Array.isArray(order)) {
      return finalize({ success: false, error: 'Invalid order data' }, { status: 400 });
    }

    // Update order for each material
    for (const item of order) {
      await dbService.material.update({
        where: { id: item.id },
        data: { order: item.order }
      });
    }

    return finalize({ success: true }, { status: 200 });
  } catch {
    return finalize({ success: false, error: 'Failed to update order' }, { status: 500 });
  }
}
