    import { getServerSession } from "next-auth/next";
import { authOptions } from "../../auth/[...nextauth]/route";
import prisma from "@/lib/prisma";

export async function GET(request) {
    const session = await getServerSession(authOptions);
    
    if (!session) {
        return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const expenses = await prisma.expense.findMany({
            where: { user_id: session.user.id },
            include: {
                category: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
            },
        });

        const categoryTotals = {};
        const subcategoryTotals = {};

        expenses.forEach(expense => {
            const amount = parseFloat(expense.amount) || 0;
            
            const categoryName = expense.category?.name || 'Unknown';
            if (!categoryTotals[categoryName]) {
                categoryTotals[categoryName] = 0;
            }
            categoryTotals[categoryName] += amount;

            if (expense.subcategory) {
                if (!subcategoryTotals[expense.subcategory]) {
                    subcategoryTotals[expense.subcategory] = 0;
                }
                subcategoryTotals[expense.subcategory] += amount;
            }
        });

        return Response.json({
            categoryTotals,
            subcategoryTotals,
        });
    } catch (error) {
        return Response.json({ error: 'Failed to fetch expense totals' }, { status: 500 });
    }
}
