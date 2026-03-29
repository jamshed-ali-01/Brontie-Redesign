// src/app/api/organizations/favorite/route.ts
import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import { connectToDatabase } from "@/lib/mongodb";
import Organization from "@/models/Organization";
import Merchant from "@/models/Merchant";

export async function PUT(request: NextRequest) {
  try {
    // Read token from cookie
    const token = request.cookies.get("org-token")?.value;
    if (!token) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    // Verify JWT
    let decoded: any;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET || "fallback-secret");
    } catch (err) {
      console.error("favorite - JWT verify failed", err);
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const organizationId = decoded.organizationId || decoded.orgId || decoded.id;
    if (!organizationId || !/^[0-9a-fA-F]{24}$/.test(String(organizationId))) {
      return NextResponse.json({ error: "Invalid organization id" }, { status: 400 });
    }

    const body = await request.json().catch(() => ({}));
    const merchantId = body?.merchantId ?? null; // can be null to clear
  console.log('merchant id from body ',merchantId)
    await connectToDatabase(); 

    // Update organization - set or unset favoriteMerchantId
    
    const orgObjectId = new mongoose.Types.ObjectId(organizationId);
    const update = { favoriteMerchantId: merchantId }; // Define the update object
    const updated = await Organization.findByIdAndUpdate(orgObjectId, { $set: update }, { new: true }).select("name email logoUrl favoriteMerchantId").lean();
console.log('updated',updated)
    if (!updated) {
      return NextResponse.json({ error: "Organization not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, organization: updated });
  } catch (err) {
    console.error("favorite route error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
