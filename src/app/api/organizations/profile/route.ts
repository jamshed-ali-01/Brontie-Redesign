import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import { connectToDatabase } from "@/lib/mongodb";
import Organization from "@/models/Organization";

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get("org-token")?.value;
    if (!token) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    let decoded: any;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET || "fallback-secret");
    } catch {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const organizationId = decoded.organizationId || decoded.orgId || decoded.id;

    if (!organizationId || !/^[0-9a-fA-F]{24}$/.test(String(organizationId))) {
      return NextResponse.json({ error: "Invalid organization id" }, { status: 400 });
    }

    await connectToDatabase();

    const organization = await Organization.findById(
      new mongoose.Types.ObjectId(organizationId)
    )
      .select("name slug email phone website address description logoUrl coverImageUrl status qrImageUrl favoriteMerchantId") // ✅ added coverImageUrl
      .lean();

    if (!organization) {
      return NextResponse.json({ error: "Organization not found" }, { status: 404 });
    }

    return NextResponse.json(organization);
  } catch (err) {
    console.error("GET organization profile error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const token = request.cookies.get("org-token")?.value;
    if (!token) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    let decoded: any;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET || "fallback-secret");
    } catch {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const organizationId = decoded.organizationId || decoded.orgId || decoded.id;

    if (!organizationId || !/^[0-9a-fA-F]{24}$/.test(String(organizationId))) {
      return NextResponse.json({ error: "Invalid organization id" }, { status: 400 });
    }

    const body = await request.json();

    const updateData: any = {
      name: body.name,
      email: body.email,
      phone: body.phone,
      website: body.website,
      address: body.address,
      description: body.description,
      logoUrl: body.logoUrl,
      coverImageUrl: body.coverImageUrl, // ✅ NEW
    };

    Object.keys(updateData).forEach(
      (key) => updateData[key] === undefined && delete updateData[key]
    );

    await connectToDatabase();

    const updatedOrg = await Organization.findByIdAndUpdate(
      new mongoose.Types.ObjectId(organizationId),
      { $set: updateData },
      { new: true }
    ).select("name slug email phone website address description logoUrl coverImageUrl status qrImageUrl favoriteMerchantId"); // ✅ added coverImageUrl

    if (!updatedOrg) {
      return NextResponse.json({ error: "Organization not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, organization: updatedOrg });
  } catch (err) {
    console.error("PUT organization profile error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
