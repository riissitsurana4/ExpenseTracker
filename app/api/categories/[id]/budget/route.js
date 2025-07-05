import { getServerSession } from "next-auth/next";
import { authOptions } from "../../../auth/[...nextauth]/route";
import prisma from "@/lib/prisma";

export async function PUT(request, { params }) {
    const session = await getServerSession(authOptions);
    
    if (!session) {
        return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const { budget } = await request.json();
        const categoryId = params.id;
        
        if (budget === undefined || budget < 0) {
            return Response.json({ error: "Valid budget amount is required" }, { status: 400 });
        }

        const category = await prisma.category.update({
            where: { 
                id: categoryId,
                user_id: session.user.id 
            },
            data: { budget: parseFloat(budget) },
        });

        return Response.json(category);
    } catch (error) {
        return Response.json({ error: 'Failed to update category budget' }, { status: 500 });
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