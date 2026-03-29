import { NextResponse } from "next/server";
import Organization from "@/models/Organization";
import { connectToDatabase } from "@/lib/mongodb";
import { put } from "@vercel/blob";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectToDatabase();
    const { id } = await params;
    const form = await req.formData();

    const name = form.get("name")?.toString();
    const slug = form.get("slug")?.toString();
    const email = form.get("email")?.toString();
    const description = form.get("description")?.toString();
    const phone = form.get("phone")?.toString();
    const website = form.get("website")?.toString();
    const address = form.get("address")?.toString();
    const status = form.get("status")?.toString();
    const image = form.get("logo") as File | null;

    if (!name) return NextResponse.json({ error: "Name is required" }, { status: 400 });

    const org = await Organization.findById(id);
    if (!org) return NextResponse.json({ error: "Organization not found" }, { status: 404 });

    // Handle Slug Update
    if (slug && slug !== org.slug) {
      // Check for uniqueness
      const existing = await Organization.findOne({ slug });
      if (existing) {
        return NextResponse.json({ error: "Slug already in use" }, { status: 400 });
      }

      // Add OLD slug to redirects
      if (!org.redirectSlugs) org.redirectSlugs = [];
      org.redirectSlugs.push(org.slug);

      // Update to NEW slug
      org.slug = slug;
    }

    let logoUrl: string | undefined;
    if (image) {
      const blob = await put(`org-logos/${image.name}`, image, { access: "public" });
      logoUrl = blob.url;
      org.logoUrl = logoUrl;
    }

    org.name = name;
    org.email = email;
    org.description = description;
    org.phone = phone;
    org.website = website;
    org.address = address;
    org.status = (status === "active" || status === "inactive") ? status : "active";

    await org.save();

    return NextResponse.json(org);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to update organization" }, { status: 500 });
  }
}


export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    await connectToDatabase();
    const { id } = params;

    const deletedOrg = await Organization.findByIdAndDelete(id);

    if (!deletedOrg) {
      return NextResponse.json({ error: "Organization not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Organization deleted successfully" });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to delete organization" }, { status: 500 });
  }
}