import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]/route";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request) {
    const session = await getServerSession(authOptions);
    
    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const expenses = await prisma.expense.findMany({
            where: { user_id: session.user.id },
            orderBy: { created_at: "desc" },
        });
        return NextResponse.json(expenses);
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch expenses" }, { status: 500 });
    }
}


export async function POST(request) {
    const session = await getServerSession(authOptions);
    
    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
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

        if (!title || !amount) {
            return NextResponse.json(
                { error: "Missing required fields: title and amount" },
                { status: 400 }
            );
        }

        const expense = await prisma.expense.create({
            data: {
                title,
                amount: parseFloat(amount),
                category_id: category_id || null,
                subcategory: subcategory || null,
                created_at: created_at ? new Date(created_at) : new Date(),
                user_id: session.user.id,
                recurring_type: recurring_type || null,
                is_recurring: is_recurring || false,
                mode_of_payment: mode_of_payment || null,
            },
        });

        return NextResponse.json(expense, { status: 201 });

    } catch (error) {
        return NextResponse.json(
            { error: "Failed to create expense: " + error.message },
            { status: 500 }
        );
    }
}