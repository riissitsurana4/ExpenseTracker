import prisma from "@/lib/prisma";
import { getToken } from "next-auth/jwt";

export async function GET(req) {
    console.log('Incoming request headers:', req.headers);

    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    console.log('Token:', token);

    if (!token) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    const { email } = token;
    const categories = await prisma.category.findMany({
        where: { user_id: email },
    });

    return new Response(JSON.stringify(categories), { status: 200 });
}