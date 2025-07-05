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
      select: { currency: true }
    });
    
    return Response.json({ currency: user?.currency || 'INR' });
  } catch (error) {
    return Response.json({ error: "Failed to fetch currency" }, { status: 500 });
  }
}