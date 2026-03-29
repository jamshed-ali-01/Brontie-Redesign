
import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import Organization from "@/models/Organization";
import crypto from "crypto";

export async function GET() {
    try {
        await connectToDatabase();

        const organizations = await Organization.find({});
        const migrated: string[] = [];
        const skipped: string[] = [];

        for (const org of organizations) {
            // If slug is already short (<= 6 chars), skip
            if (org.slug.length <= 6) {
                skipped.push(`${org.name} (${org.slug})`);
                continue;
            }

            const oldSlug = org.slug;

            // Generate new short slug
            let newSlug = "";
            let isUnique = false;
            while (!isUnique) {
                newSlug = crypto.randomBytes(3).toString("hex");
                const existing = await Organization.findOne({ slug: newSlug });
                if (!existing) isUnique = true;
            }

            // Update org
            org.slug = newSlug;
            if (!org.redirectSlugs) org.redirectSlugs = [];
            org.redirectSlugs.push(oldSlug);

            await org.save();
            migrated.push(`${org.name}: ${oldSlug} -> ${newSlug}`);
        }

        return NextResponse.json({
            message: "Migration completed",
            migratedCount: migrated.length,
            skippedCount: skipped.length,
            migrated,
            skipped,
        });
    } catch (error) {
        console.error("Migration error:", error);
        return NextResponse.json(
            { error: "Migration failed", details: error instanceof Error ? error.message : String(error) },
            { status: 500 }
        );
    }
}
