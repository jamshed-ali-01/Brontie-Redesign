import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import { connectToDatabase } from "@/lib/mongodb";
import Organization from "@/models/Organization";

export async function PUT(request: NextRequest) {
  try {
    /* =========================
       1. Read token
       ========================= */
    const token = request.cookies.get("org-token")?.value;
    if (!token) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    /* =========================
       2. Verify token
       ========================= */
    let decoded: any;
    try {
      decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || "fallback-secret"
      );
    } catch {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const organizationId =
      decoded.organizationId || decoded.orgId || decoded.id;

    if (
      !organizationId ||
      !/^[0-9a-fA-F]{24}$/.test(String(organizationId))
    ) {
      return NextResponse.json(
        { error: "Invalid organization id" },
        { status: 400 }
      );
    }

    /* =========================
       3. Read body
       ========================= */
    const { currentPassword, newPassword } = await request.json();

    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { error: "Current and new password are required" },
        { status: 400 }
      );
    }

    if (newPassword.length < 8) {
      return NextResponse.json(
        { error: "New password must be at least 8 characters" },
        { status: 400 }
      );
    }

    /* =========================
       4. Fetch org
       ========================= */
    await connectToDatabase();

    const org = await Organization.findById(
      new mongoose.Types.ObjectId(organizationId)
    ).select("password");

    if (!org || !org.password) {
      return NextResponse.json(
        { error: "Organization not found" },
        { status: 404 }
      );
    }

    /* =========================
       5. Verify current password
       ========================= */
    const isMatch = await bcrypt.compare(currentPassword, org.password);

    if (!isMatch) {
      return NextResponse.json(
        { error: "Current password is incorrect" },
        { status: 400 }
      );
    }

    /* =========================
       6. Hash & save new password
       ========================= */
    const hashedPassword = await bcrypt.hash(newPassword, 12);
    org.password = hashedPassword;
    await org.save();

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Change password error:", err);
    return NextResponse.json(
      { error: "Server error" },
      { status: 500 }
    );
  }
}
