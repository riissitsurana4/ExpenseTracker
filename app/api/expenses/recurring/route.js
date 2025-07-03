import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const email = searchParams.get("email");

        if (!email) return NextResponse.json([], { status: 400 });

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) return NextResponse.json([], { status: 404 });

        const recurringExpenses = await prisma.expense.findMany({
            where: { 
                user_id: user.id,
                is_recurring: true
            },
            orderBy: { created_at: "desc" },
        });
        
        return NextResponse.json(recurringExpenses);
    } catch (error) {
        return NextResponse.json(
            { error: "Failed to fetch recurring expenses" },
            { status: 500 }
        );
    }
}

export async function POST(request) {
    try {
        const { email } = await request.json();
        
        if (!email) {
            return NextResponse.json({ error: "Email required" }, { status: 400 });
        }

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        const today = new Date();
        const recurringExpenses = await prisma.expense.findMany({
            where: {
                user_id: user.id,
                is_recurring: true
            }
        });

        const newExpenses = [];

        for (const expense of recurringExpenses) {
            const lastInstance = await prisma.expense.findFirst({
                where: {
                    user_id: user.id,
                    title: expense.title,
                    amount: expense.amount,
                    category_id: expense.category_id,
                    recurring_type: expense.recurring_type,
                    is_recurring: false
                },
                orderBy: { created_at: 'desc' }
            });

            const lastCreated = lastInstance ? new Date(lastInstance.created_at) : new Date(expense.created_at);
            const shouldCreate = shouldCreateRecurringExpense(expense, lastCreated, today);

            if (shouldCreate) {
                const newExpense = await prisma.expense.create({
                    data: {
                        title: expense.title,
                        amount: expense.amount,
                        category_id: expense.category_id,
                        subcategory: expense.subcategory,
                        user_id: expense.user_id,
                        recurring_type: expense.recurring_type,
                        is_recurring: false,
                        mode_of_payment: expense.mode_of_payment,
                        created_at: today,
                    }
                });
                newExpenses.push(newExpense);
            }
        }

        return NextResponse.json({ 
            message: `${newExpenses.length} recurring expenses processed`,
            expenses: newExpenses 
        });

    } catch (error) {
        return NextResponse.json(
            { error: "Failed to process recurring expenses: " + error.message },
            { status: 500 }
        );
    }
}

function shouldCreateRecurringExpense(expense, lastCreated, today) {
    const daysDiff = Math.floor((today - lastCreated) / (1000 * 60 * 60 * 24));
    
    switch (expense.recurring_type) {
        case 'daily':
            return daysDiff >= 1;
        case 'weekly':
            return daysDiff >= 7;
        case 'monthly':
            const lastMonth = lastCreated.getMonth();
            const currentMonth = today.getMonth();
            const lastYear = lastCreated.getFullYear();
            const currentYear = today.getFullYear();
            
            return (currentYear > lastYear) || 
                   (currentYear === lastYear && currentMonth > lastMonth);
        case 'yearly':
            return today.getFullYear() > lastCreated.getFullYear();
        default:
            return false;
    }
}