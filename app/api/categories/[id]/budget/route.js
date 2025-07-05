import { getServerSession } from "next-auth/next";
import { authOptions } from "../../../auth/[...nextauth]/route";
import prisma from "@/lib/prisma";

export async function PUT(request, { params }) {
    const session = await getServerSession(authOptions);
    
    if (!session) {
        return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const { name } = await request.json();
        const categoryId = params.id;
        
        if (!name?.trim()) {
            return Response.json({ error: "Category name is required" }, { status: 400 });
        }

        const category = await prisma.category.update({
            where: { 
                id: categoryId,
                user_id: session.user.id 
            },
            data: { name: name.trim() },
        });

        return Response.json(category);
    } catch (error) {
        return Response.json({ error: 'Failed to update category' }, { status: 500 });
    }
}

export async function DELETE(request, { params }) {
    const session = await getServerSession(authOptions);
    
    if (!session) {
        return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const categoryId = params.id;

       
        await prisma.subcategory.deleteMany({
            where: { 
                category_id: categoryId,
                user_id: session.user.id 
            },
        });

        
        await prisma.category.delete({
            where: { 
                id: categoryId,
                user_id: session.user.id 
            },
        });

        return Response.json({ message: 'Category deleted successfully' });
    } catch (error) {
        return Response.json({ error: 'Failed to delete category' }, { status: 500 });
    }
}