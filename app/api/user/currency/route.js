import { getServerSession } from "next-auth/next";
import { authOptions } from "../../auth/[...nextauth]/route";
import prisma from "@/lib/prisma";

export async function GET(request) {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { currency: true, avatar: true }
    });
    
    return Response.json({ 
      currency: user?.currency || 'INR',
      avatar: user?.avatar
    });
  } catch (error) {
    return Response.json({ error: "Failed to fetch user data" }, { status: 500 });
  }
}

export async function PUT(request) {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { currency, avatar } = await request.json();
    
    if (!currency) {
      return Response.json({ error: "Currency is required" }, { status: 400 });
    }

    const updateData = { currency };
    if (avatar) updateData.avatar = avatar;

    const user = await prisma.user.update({
      where: { id: session.user.id },
      data: updateData,
      select: { currency: true, avatar: true }
    });
    
    return Response.json({ 
      currency: user.currency,
      avatar: user.avatar
    });
  } catch (error) {
    return Response.json({ error: "Failed to update user data" }, { status: 500 });
  }
}