import { prisma } from '../../../lib/prisma';
import { getSession } from 'next-auth/react';

export async function GET(req) {
  const session = await getSession({ req });
  if (!session) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const categoryId = searchParams.get('categoryId');

  if (!categoryId) {
    return new Response(JSON.stringify({ error: 'Category ID is required' }), { status: 400 });
  }

  const subcategories = await prisma.subcategory.findMany({
    where: { categoryId: parseInt(categoryId) },
  });

  return new Response(JSON.stringify(subcategories), { status: 200 });
}