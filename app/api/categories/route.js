import prisma from "@/lib/prisma";

export async function GET(req) {
    try {
        const { searchParams } = new URL(req.url);
        const email = searchParams.get('email');
        
        if (!email) {
            return new Response(JSON.stringify({ error: 'Email parameter required' }), { status: 400 });
        }

        const user = await prisma.user.findUnique({
            where: { email: email }
        });

        if (!user) {
            return new Response(JSON.stringify({ error: 'User not found' }), { status: 404 });
        }

        const categories = await prisma.category.findMany({
            where: { user_id: user.id },
        });

        return new Response(JSON.stringify(categories), { status: 200 });
    } catch (error) {
        return new Response(JSON.stringify({ error: 'Failed to fetch categories' }), { status: 500 });
    }
}