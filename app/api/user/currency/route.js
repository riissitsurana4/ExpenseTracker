import prisma from '@/lib/prisma';
import { getToken } from 'next-auth/jwt';

export async function GET(req) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!token) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  const { email } = token;
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    return new Response(JSON.stringify({ error: 'User not found' }), { status: 404 });
  }

  return new Response(JSON.stringify({ currency: user.currency || 'INR' }), { status: 200 });
}