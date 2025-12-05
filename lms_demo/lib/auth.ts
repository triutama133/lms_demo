import { JWTPayload, SignJWT, jwtVerify } from 'jose';

export interface AuthTokenPayload extends JWTPayload {
  sub: string;
  role: string;
  email?: string;
  name?: string;
}

function getSecretKey(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET is not defined');
  }
  return new TextEncoder().encode(secret);
}

export async function signAuthToken(payload: {
  sub: string;
  role: string;
  email?: string;
  name?: string;
}, expiresIn?: string): Promise<string> {
  const token = await new SignJWT({
    role: payload.role,
    email: payload.email,
    name: payload.name,
  })
    .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime(expiresIn ?? process.env.JWT_EXPIRES_IN ?? '30d')
    .sign(getSecretKey());
  return token;
}

export async function verifyAuthToken(token: string): Promise<AuthTokenPayload> {
  const { payload } = await jwtVerify(token, getSecretKey());
  if (!payload.sub || !payload.role) {
    throw new Error('Token payload incomplete');
  }
  return payload as AuthTokenPayload;
}
