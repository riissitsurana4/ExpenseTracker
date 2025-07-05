import { getServerSession } from "next-auth/next";
import { authOptions } from "../../auth/[...nextauth]/route";
import prisma from "@/lib/prisma";

export async function GET(request) {
    const session = await getServerSession(authOptions);
    
    if (!session) {
        return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const subcategories = await prisma.subcategory.findMany({
            where: { user_id: session.user.id },
        });

        return Response.json(subcategories);
    } catch (error) {
        return Response.json({ error: 'Failed to fetch subcategories' }, { status: 500 });
    }
}