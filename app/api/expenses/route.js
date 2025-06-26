import { NextResponse } from "next/server";
import prisma from "../../../../lib/prisma";


export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get("email");

    if (!email) return NextResponse.json([], { status: 400 });

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return NextResponse.json([], { status: 404 });

    const expenses = await prisma.expense.findMany({
        where: { userId: user.id },
        orderBy: { created_at: "desc" },
    });
    return NextResponse.json(expenses);
}


export async function POST(req) {
    const body = await req.json();
    const expense = await prisma.expense.create({ data: body });
    return NextResponse.json(expense);
}

export async function PUT(request, { params }) {
    const { id } = params;
    const { amount, description, categoryId, subcategoryId } = await request.json();

    const updated = await prisma.expense.update({
        where: { id },
        data: { amount, description, categoryId, subcategoryId },
    });

    return NextResponse.json(updated);
}

export async function DELETE(request, { params }) {
    const { id } = params;
    await prisma.expense.delete({ where: { id } });
    return NextResponse.json({ success: true });
}