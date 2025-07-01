import NextAuth from "next-auth";
import prisma from "@/lib/prisma";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });
        if (!user || !user.password) return null;

        const bcrypt = require("bcryptjs");
        const isValid = await bcrypt.compare(credentials.password, user.password);
        if (!isValid) return null;

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
        };
      },
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  ],
  session: { strategy: "jwt" },
  secret: process.env.NEXTAUTH_SECRET,
  callbacks: {
    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id;
        token.name = user.name;
        token.email = user.email;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id;
        session.user.name = token.name;
        session.user.email = token.email;
      }
      return session;
    },
    async signIn({ user, account, profile }) {
      console.log("signIn callback triggered for provider:", account?.provider);
      
      if (account?.provider === "credentials") {
        return true;
      }

      // Handle OAuth providers (Google)
      if (account?.provider === "google") {
        try {
          console.log("Processing OAuth sign-in for:", user.email);
          
          let existingUser = await prisma.user.findUnique({ 
            where: { email: user.email },
            select: { id: true, has_presets: true, name: true, email: true }
          });

          // If user doesn't exist, create them
          if (!existingUser) {
            console.log("Creating new user for OAuth:", user.email);
            existingUser = await prisma.user.create({
              data: {
                email: user.email,
                name: user.name || user.email.split('@')[0],
                has_presets: false,
              },
            });
            console.log("New user created:", existingUser.id);
          }

          // Create presets if user doesn't have them
          if (!existingUser.has_presets) {
            console.log("Creating preset categories for user:", existingUser.id);
            
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
                user_id: existingUser.id,
              })),
            });

            // Get created categories
            const categories = await prisma.category.findMany({ 
              where: { user_id: existingUser.id } 
            });

            // Create subcategories
            const subcategoriesData = presetSubcategories.map((subcategory) => {
              const dbCategory = categories.find((cat) => cat.name === subcategory.category);
              if (!dbCategory) return null;
              return {
                name: subcategory.name,
                category_id: dbCategory.id,
                user_id: existingUser.id,
              };
            }).filter(Boolean);

            if (subcategoriesData.length > 0) {
              await prisma.subcategory.createMany({
                data: subcategoriesData,
              });
            }

            // Mark user as having presets
            await prisma.user.update({
              where: { id: existingUser.id },
              data: { has_presets: true },
            });

            console.log("Preset categories created successfully for user:", existingUser.id);
          }

          // Update the user object with the database ID for the token
          user.id = existingUser.id;
          
          return true;
        } catch (error) {
          console.error("Error in OAuth signIn callback:", error);
          return false;
        }
      }
      
      return true;
    }
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };