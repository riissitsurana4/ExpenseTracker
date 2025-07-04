import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]/route";
import prisma from "@/lib/prisma";

export async function GET(request) {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const budgets = await prisma.budget.findMany({
      where: { user_id: session.user.id },
      orderBy: { start_date: 'asc' }
    });
    
    return Response.json(budgets);
  } catch (error) {
    return Response.json({ error: "Failed to fetch budgets" }, { status: 500 });
  }
}

export async function POST(request) {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { amount, start_date, end_date, budget_period_type } = body;

    const budget = await prisma.budget.create({
      data: {
        user_id: session.user.id,
        amount: parseFloat(amount),
        start_date: new Date(start_date),
        end_date: new Date(end_date),
        budget_period_type,
      }
    });

    return Response.json(budget, { status: 201 });
  } catch (error) {
    return Response.json({ error: "Failed to create budget" }, { status: 500 });
  }
}