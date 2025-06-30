import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(req) {
  const { name, email, password } = await req.json();

  if (!email || !password) {
    return NextResponse.json({ error: "Email and password required" }, { status: 400 });
  }

  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    return NextResponse.json({ error: "User already exists" }, { status: 400 });
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: {
      name,
      email,
      password: hashedPassword,
      has_presets: true,
    },
  });

  const presetCategories = [
    { name: "Food", type: "expense", user_id: user.id },
    { name: "Travel", type: "expense", user_id: user.id },
    { name: "Utilities", type: "expense", user_id: user.id },
    { name: "Financial", type: "expense", user_id: user.id },
    { name: "Health", type: "expense", user_id: user.id },
    { name: "Miscellaneous", type: "expense", user_id: user.id },
    { name: "Shopping", type: "expense", user_id: user.id },
  ];

  const presetSubcategories = [
    { category: "Food", name: "Groceries", user_id: user.id },
    { category: "Food", name: "Dining Out", user_id: user.id },
    { category: "Food", name: "Delivery", user_id: user.id },
    { category: "Travel", name: "Flights", user_id: user.id },
    { category: "Travel", name: "Accommodation", user_id: user.id },
    { category: "Travel", name: "Fuel", user_id: user.id },
    { category: "Travel", name: "Taxi", user_id: user.id },
    { category: "Utilities", name: "Internet", user_id: user.id },
    { category: "Utilities", name: "Electricity", user_id: user.id },
    { category: "Utilities", name: "Water", user_id: user.id },
    { category: "Utilities", name: "Gas", user_id: user.id },
    { category: "Utilities", name: "Mobile", user_id: user.id },
    { category: "Financial", name: "Investments", user_id: user.id },
    { category: "Financial", name: "Loans", user_id: user.id },
    { category: "Financial", name: "Investments", user_id: user.id },
    { category: "Financial", name: "Savings", user_id: user.id },
    { category: "Financial", name: "Taxes", user_id: user.id },
    { category: "Health", name: "Medical Bills", user_id: user.id },
    { category: "Health", name: "Pharmacy", user_id: user.id },
    { category: "Health", name: "Health Insurance", user_id: user.id },
    { category: "Miscellaneous", name: "Gifts", user_id: user.id },
    { category: "Miscellaneous", name: "Donations", user_id: user.id },
    { category: "Miscellaneous", name: "DTH/Subscriptions", user_id: user.id },
    { category: "Miscellaneous", name: "Education", user_id: user.id },
    { category: "Miscellaneous", name: "Pets", user_id: user.id },
    { category: "Shopping", name: "In-store", user_id: user.id },
    { category: "Shopping", name: "Online", user_id: user.id },
  ];

  try {
    await prisma.category.createMany({
      data: presetCategories.map((category) => ({
        name: category.name,
        user_id: user.id,
      })),
    });
  } catch (error) {
    return NextResponse.json({ error: "Failed to create preset categories" }, { status: 500 });
  }

  try {
    const categories = await prisma.category.findMany({
      where: { user_id: user.id },
    });

    const subcategoriesData = presetSubcategories.map((subcategory) => {
      const dbCategory = categories.find((cat) => cat.name === subcategory.category);
      if (!dbCategory) {
        return null;
      }
      return {
        name: subcategory.name,
        category_id: dbCategory.id,
        user_id: user.id,
      };
    }).filter(Boolean);

    if (subcategoriesData.length > 0) {
      await prisma.subcategory.createMany({
        data: subcategoriesData,
      });
    }
  } catch (error) {
    return NextResponse.json({ error: "Failed to create preset subcategories" }, { status: 500 });
  }

  return NextResponse.json({ id: user.id, email: user.email });
}