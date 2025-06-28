import { prisma } from "../../../lib/prisma";
import { getSession } from "next-auth/react";

export async function GET(req) {
    const session = await getSession({ req });
    if (!session) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    const { email } = session.user;
    const subcategories = await prisma.subcategory.findMany({
        where: { userEmail: email },
    });

    return new Response(JSON.stringify(subcategories), { status: 200 });
}