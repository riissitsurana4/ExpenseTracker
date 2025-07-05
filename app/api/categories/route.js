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
            include: {
                subcategories: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
            },
            orderBy: { name: 'asc' },
        });

        return Response.json(categories);
    } catch (error) {
        return Response.json({ error: 'Failed to fetch categories' }, { status: 500 });
    }
}

export async function POST(request) {
    const session = await getServerSession(authOptions);
    
    if (!session) {
        return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const { name } = await request.json();
        
        if (!name?.trim()) {
            return Response.json({ error: "Category name is required" }, { status: 400 });
        }

        const category = await prisma.category.create({
            data: {
                name: name.trim(),
                user_id: session.user.id,
            },
        });

        return Response.json(category, { status: 201 });
    } catch (error) {
        return Response.json({ error: 'Failed to create category' }, { status: 500 });
    }
}