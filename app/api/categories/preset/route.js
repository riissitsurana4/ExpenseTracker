import { getServerSession } from "next-auth/next";
import { authOptions } from "../../auth/[...nextauth]/route";
import prisma from "@/lib/prisma";

export async function POST(request) {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { has_presets: true }
    });

    if (user?.has_presets) {
      return Response.json({ message: "User already has presets" });
    }

    // Create preset categories and subcategories
    const presetCategories = [
      { name: "Food", type: "expense" },
      { name: "Travel", type: "expense" },
      { name: "Utilities", type: "expense" },
      { name: "Financial", type: "expense" },
      { name: "Health", type: "expense" },
      { name: "Miscellaneous", type: "expense" },
      { name: "Shopping", type: "expense" },
    ];

    const presetSubcategories = [
      { category: "Food", name: "Groceries" },
      { category: "Food", name: "Dining Out" },
      { category: "Food", name: "Delivery" },
      { category: "Travel", name: "Flights" },
      { category: "Travel", name: "Accommodation" },
      { category: "Travel", name: "Fuel" },
      { category: "Travel", name: "Taxi" },
      { category: "Utilities", name: "Internet" },
      { category: "Utilities", name: "Electricity" },
      { category: "Utilities", name: "Water" },
      { category: "Utilities", name: "Gas" },
      { category: "Utilities", name: "Mobile" },
      { category: "Financial", name: "Investments" },
      { category: "Financial", name: "Loans" },
      { category: "Financial", name: "Savings" },
      { category: "Financial", name: "Taxes" },
      { category: "Health", name: "Medical Bills" },
      { category: "Health", name: "Pharmacy" },
      { category: "Health", name: "Health Insurance" },
      { category: "Miscellaneous", name: "Gifts" },
      { category: "Miscellaneous", name: "Donations" },
      { category: "Miscellaneous", name: "DTH/Subscriptions" },
      { category: "Miscellaneous", name: "Education" },
      { category: "Miscellaneous", name: "Pets" },
      { category: "Shopping", name: "In-store" },
      { category: "Shopping", name: "Online" },
    ];

    // Create categories
    await prisma.category.createMany({
      data: presetCategories.map((category) => ({
        name: category.name,
        type: category.type,
        user_id: session.user.id,
      })),
    });

    // Get created categories
    const categories = await prisma.category.findMany({ 
      where: { user_id: session.user.id } 
    });

    // Create subcategories
    const subcategoriesData = presetSubcategories.map((subcategory) => {
      const dbCategory = categories.find((cat) => cat.name === subcategory.category);
      if (!dbCategory) return null;
      return {
        name: subcategory.name,
        category_id: dbCategory.id,
        user_id: session.user.id,
      };
    }).filter(Boolean);

    if (subcategoriesData.length > 0) {
      await prisma.subcategory.createMany({
        data: subcategoriesData,
      });
    }

    // Mark user as having presets
    await prisma.user.update({
      where: { id: session.user.id },
      data: { has_presets: true },
    });

    return Response.json({ message: "Preset categories created successfully" });
  } catch (error) {
    console.error("Error creating presets:", error);
    return Response.json({ error: "Failed to create presets" }, { status: 500 });
  }
}
