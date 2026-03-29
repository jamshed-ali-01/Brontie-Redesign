import { NextResponse } from "next/server";
import Organization from "@/models/Organization";
import { connectToDatabase } from "@/lib/mongodb";

export async function GET() {
  try {
    await connectToDatabase();

    // Fetch only active organizations + select only required fields
    const organizations = await Organization.find(
      { status: "active" },          // Filter
      "_id name logoUrl "              // Only required fields
    )
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({ data: organizations });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to fetch organizations" },
      { status: 500 }
    );
  }
}
