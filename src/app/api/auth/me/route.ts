import { NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await getAuthSession();

  if (!session) {
    return NextResponse.json({ authenticated: false });
  }

  if (session.role === "admin") {
    return NextResponse.json({
      authenticated: true,
      user: { role: "admin" },
    });
  }

  if (!session.customerId) {
    return NextResponse.json({ authenticated: false });
  }

  const customer = await prisma.customer.findUnique({
    where: { id: session.customerId },
    select: {
      id: true,
      name: true,
      lastName: true,
      phone: true,
      email: true,
    },
  });

  if (!customer) {
    return NextResponse.json({ authenticated: false });
  }

  return NextResponse.json({
    authenticated: true,
    user: {
      role: "customer",
      profile: customer,
    },
  });
}
