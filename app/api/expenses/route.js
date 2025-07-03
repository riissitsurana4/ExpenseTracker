import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";


export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get("email");

    if (!email) return NextResponse.json([], { status: 400 });

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return NextResponse.json([], { status: 404 });

    const expenses = await prisma.expense.findMany({
        where: { user_id: user.id },
        orderBy: { created_at: "desc" },
    });
    return NextResponse.json(expenses);
}


export async function POST(request) {
    try {
        const body = await request.json();

        const { 
            title, 
            amount, 
            category_id, 
            subcategory, 
            created_at, 
            user_id, 
            user_email,
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

        let userId = user_id;

        if (!userId && user_email) {
            const user = await prisma.user.findUnique({
                where: { email: user_email }
            });
            
            if (!user) {
                return NextResponse.json(
                    { error: "User not found" },
                    { status: 404 }
                );
            }
            userId = user.id;
        }

        if (!userId) {
            return NextResponse.json(
                { error: "User ID or email is required" },
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
                user_id: userId,
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