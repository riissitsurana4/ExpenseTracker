import prisma from "@/lib/prisma";
import { getSession } from "next-auth/react";
import { getToken } from "next-auth/jwt";

export async function GET(req) {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (!token) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    const session = await getSession({ req });
    if (!session) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    const { email } = session.user;
    const subcategories = await prisma.subcategory.findMany({
        where: { user_id: email },
    });

    return new Response(JSON.stringify(subcategories), { status: 200 });
}