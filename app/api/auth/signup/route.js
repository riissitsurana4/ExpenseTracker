import { NextResponse } from "next/server";
import prisma from "../../../../lib/prisma";
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

  try {
    await prisma.category.createMany({
      data: presetCategories.map((category) => ({
        name: category.name,
        user_id: user.id,
      })),
    });
  } catch (error) {
    console.error("Error creating preset categories:", error);
    return NextResponse.json({ error: "Failed to create preset categories" }, { status: 500 });
  }

  return NextResponse.json({ id: user.id, email: user.email });
}