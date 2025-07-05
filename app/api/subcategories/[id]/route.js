import { getServerSession } from "next-auth/next";
import { authOptions } from "../../auth/[...nextauth]/route";
import prisma from "@/lib/prisma";

export async function PUT(request, { params }) {
    const session = await getServerSession(authOptions);
    
    if (!session) {
        return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const { name } = await request.json();
        const subcategoryId = params.id;
        
        if (!name?.trim()) {
            return Response.json({ error: "Subcategory name is required" }, { status: 400 });
        }

        const subcategory = await prisma.subcategory.update({
            where: { 
                id: subcategoryId,
                user_id: session.user.id 
            },
            data: { name: name.trim() },
        });

        return Response.json(subcategory);
    } catch (error) {
        return Response.json({ error: 'Failed to update subcategory' }, { status: 500 });
    }
}

export async function DELETE(request, { params }) {
    const session = await getServerSession(authOptions);
    
    if (!session) {
        return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const subcategoryId = params.id;

        await prisma.subcategory.delete({
            where: { 
                id: subcategoryId,
                user_id: session.user.id 
            },
        });

        return Response.json({ message: 'Subcategory deleted successfully' });
    } catch (error) {
        return Response.json({ error: 'Failed to delete subcategory' }, { status: 500 });
    }
}