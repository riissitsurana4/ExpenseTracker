import prisma from '@/lib/prisma';

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const categoryId = searchParams.get('categoryId');

    if (!categoryId) {
      return new Response(JSON.stringify({ error: 'Category ID is required' }), { status: 400 });
    }

    const subcategories = await prisma.subcategory.findMany({
      where: { category_id: categoryId },
    });

    return new Response(JSON.stringify(subcategories), { status: 200 });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Failed to fetch subcategories' }), { status: 500 });
  }
}