import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function DELETE(request, { params }) {
    try {
        const { id } = params;
        
        if (!id) {
            return NextResponse.json({ error: "Expense ID required" }, { status: 400 });
        }

        await prisma.expense.delete({ 
            where: { id: id } 
        });
        
        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json(
            { error: "Failed to delete expense: " + error.message },
            { status: 500 }
        );
    }
}

export async function PUT(request, { params }) {
    try {
        const { id } = params;
        const body = await request.json();
        
        const { 
            title, 
            amount, 
            category_id, 
            subcategory, 
            created_at,
            recurring_type,
            is_recurring,
            mode_of_payment 
        } = body;

        const updated = await prisma.expense.update({
            where: { id },
            data: { 
                title,
                amount: parseFloat(amount),
                category_id,
                subcategory,
                created_at: created_at ? new Date(created_at) : undefined,
                recurring_type,
                is_recurring,
                mode_of_payment
            },
        });

        return NextResponse.json(updated);
    } catch (error) {
        return NextResponse.json(
            { error: "Failed to update expense: " + error.message },
            { status: 500 }
        );
    }
}
