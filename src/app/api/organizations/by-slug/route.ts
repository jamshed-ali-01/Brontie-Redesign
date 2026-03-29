import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import Organization from "@/models/Organization";

export async function GET(req: NextRequest) {
  try {

    // return NextResponse.json({ organization: 'test' }, { status: 200 });

    await connectToDatabase();

    const { searchParams } = new URL(req.url);
    const slug = searchParams.get("slug");

    if (!slug) {
      return NextResponse.json(
        { error: "Organization slug is required" },
        { status: 400 }
      );
    }

    const org = await Organization.findOne({
      $or: [{ slug }, { redirectSlugs: slug }],
      status: "active",
    })
      .select("_id name slug favoriteMerchantId redirectSlugs")
      .lean();

    if (!org) {
      return NextResponse.json(
        { error: "Organization not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ organization: org }, { status: 200 });
  } catch (error) {
    console.error("Organization by slug error:", error);
    return NextResponse.json(
      { error: "Failed to fetch organization" },
      { status: 500 }
    );
  }
}
