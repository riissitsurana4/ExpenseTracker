import { getServerSession } from "next-auth/next";
import { authOptions } from "../../../auth/[...nextauth]/route";
import prisma from "@/lib/prisma";

export async function PUT(request, { params }) {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { budget } = body;

    const category = await prisma.category.update({
      where: { 
        id: params.id,
        user_id: session.user.id 
      },
      data: {
        budget: parseFloat(budget)
      }
    });

    return Response.json(category);
  } catch (error) {
    return Response.json({ error: "Failed to update category budget" }, { status: 500 });
  }
}