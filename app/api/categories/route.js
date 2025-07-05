import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]/route";
import prisma from "@/lib/prisma";

export async function GET(request) {
    const session = await getServerSession(authOptions);
    
    if (!session) {
        return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const categories = await prisma.category.findMany({
            where: { user_id: session.user.id },
        });

        return Response.json(categories);
    } catch (error) {
        return Response.json({ error: 'Failed to fetch categories' }, { status: 500 });
    }
}