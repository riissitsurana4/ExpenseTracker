import { prisma } from "../../../lib/prisma";
import { getSession } from "next-auth/react";

export async function GET(req) {
    const session = await getSession({ req });
    if (!session) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    const { email } = session.user;
    const categories = await prisma.category.findMany({
        where: { userEmail: email },
    });

    return new Response(JSON.stringify(categories), { status: 200 });
}