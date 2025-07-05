import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]/route";
import prisma from "@/lib/prisma";

export async function GET(request) {
    const session = await getServerSession(authOptions);
    
    if (!session) {
        return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const { searchParams } = new URL(request.url);
        const categoryId = searchParams.get('categoryId');

        if (!categoryId) {
            return Response.json({ error: 'Category ID is required' }, { status: 400 });
        }

        const subcategories = await prisma.subcategory.findMany({
            where: { 
                category_id: categoryId,
                user_id: session.user.id 
            },
        });

        return Response.json(subcategories);
    } catch (error) {
        return Response.json({ error: 'Failed to fetch subcategories' }, { status: 500 });
    }
}

export async function POST(request) {
    const session = await getServerSession(authOptions);
    
    if (!session) {
        return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const { name, category_id } = await request.json();
        
        if (!name?.trim() || !category_id) {
            return Response.json({ error: "Name and category_id are required" }, { status: 400 });
        }


        const category = await prisma.category.findUnique({
            where: { 
                id: category_id,
                user_id: session.user.id 
            },
        });

        if (!category) {
            return Response.json({ error: "Category not found" }, { status: 404 });
        }

        const subcategory = await prisma.subcategory.create({
            data: {
                name: name.trim(),
                category_id,
                user_id: session.user.id,
            },
        });

        return Response.json(subcategory, { status: 201 });
    } catch (error) {
        return Response.json({ error: 'Failed to create subcategory' }, { status: 500 });
    }
}