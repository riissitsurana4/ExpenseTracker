import { getServerSession } from "next-auth/next";
import { authOptions } from "../../auth/[...nextauth]/route";
import prisma from "@/lib/prisma";

export async function PUT(request, {params})
{
    const session = await getServerSession(authOptions);
    if (!session) {
        return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }
    try{
        const body = await request.json();
        const { amount, start_date, end_date, budget_period_type } = body;

        const budget = await prisma.budget.update({
            where: { 
                id: params.id, 
                user_id: session.user.id 
            },
            data: {
                amount: parseFloat(amount),
                start_date: new Date(start_date),
                end_date: new Date(end_date),
                budget_period_type,
                updated_at: new Date()
            }
        });

        return Response.json(budget);
    } catch (error) {
        return Response.json({ error: "Failed to update budget" }, { status: 500 });
    }
}

export async function DELETE(request, { params }) {
    const session = await getServerSession(authOptions);
    
    if (!session) {
        return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        await prisma.budget.delete({
            where: { 
                id: params.id, 
                user_id: session.user.id 
            }
        });

        return Response.json({ message: "Budget deleted successfully" });
    } catch (error) {
        return Response.json({ error: "Failed to delete budget" }, { status: 500 });
    }
}