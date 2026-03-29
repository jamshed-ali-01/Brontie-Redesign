import AvailableGiftsFromBackend from "@/components/pages/how-it-works/AvailableGiftsFromBackend";
import GiftCategorySection from "@/components/pages/how-it-works/GiftCategorySection";
import HowItWorksBanner from "@/components/pages/how-it-works/HowItWorksBanner";
import CountyFilter from "@/components/pages/how-it-works/CountyFilter";
import Image from "next/image";
import Link from "next/link";
import React, { Suspense } from "react";
import ProductsCityTracker from "@/components/ProductsCityTracker";
import { Lobster } from "next/font/google";
import { redirect } from "next/navigation";

const lobster = Lobster({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-lobster",
});

/* ----------------------------------
   Helpers
---------------------------------- */

async function getOrganizationBySlug(slug: string) {
  // http://localhost:3000/api/organizations/by-slug?slug=nexztech-trust
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_BASE_URL}/api/organizations/by-slug?slug=${slug}`,
    {
      cache: "no-store",
    }
  );

  if (!res.ok) return null;
  const json = await res.json();
  return json.organization || null;
}

async function getMerchants(favoriteMerchantId?: string | null) {
  try {
    const [merchantsRes, itemsRes] = await Promise.all([
      fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/admin/merchants`, {
        cache: "no-store",
      }),
      fetch(
        `${process.env.NEXT_PUBLIC_BASE_URL}/api/gift-items${favoriteMerchantId ? `?merchant=${favoriteMerchantId}` : ""
        }`,
        { cache: "no-store" }
      ),
    ]);

    console.log("fav id from get merchtencs " + favoriteMerchantId);
    console.log("merchantsRes from get merchtencs ");
    console.log(merchantsRes);

    if (!merchantsRes.ok) return [];

    const merchantsJson = await merchantsRes.json();
    const itemsJson = itemsRes.ok ? await itemsRes.json() : { giftItems: [] };

    const merchants = merchantsJson.data || merchantsJson.merchants || [];
    const items = itemsJson.giftItems || [];

    const merchantHasItem = new Set(
      items.map((i: any) => i.merchantId?._id).filter(Boolean)
    );

    let filtered = merchants
      .filter(
        (m: any) =>
          (m.status ? m.status === "approved" : true) && (m.isActive ?? true)
      )
      .filter((m: any) => merchantHasItem.has(m._id));

    if (favoriteMerchantId) {
      filtered = filtered.filter((m: any) => m._id === favoriteMerchantId);
    }

    return filtered.sort((a: any, b: any) => {
      const aOrder = a.displayOrder || 0;
      const bOrder = b.displayOrder || 0;
      return aOrder - bOrder;
    });
  } catch {
    return [];
  }
}

/* ----------------------------------
   PAGE
---------------------------------- */

const ProductsPage = async ({
  searchParams,
}: {
  searchParams: Promise<{ organization?: string; merchant?: string }>;
}) => {
  const { organization: orgSlug, merchant } = await searchParams;

  let favoriteMerchantId: string | null = null;
  let organizationtId: string | null = null;

  if (orgSlug) {
    const org = await getOrganizationBySlug(orgSlug);

    if (!org) {
      // Optional: Redirect to 404 or show error if org not found
    } else {
      // REDIRECT IF SLUG IS OLD (i.e. if org.slug from DB != orgSlug from URL)
      if (org.slug !== orgSlug) {
        const newUrl = new URL(`${process.env.NEXT_PUBLIC_BASE_URL}/products`);
        newUrl.searchParams.set("organization", org.slug);
        if (merchant) newUrl.searchParams.set("merchant", merchant);
        // Keep other params if needed, or just these two
        redirect(newUrl.toString());
      }

      favoriteMerchantId = org?.favoriteMerchantId || null;
      console.log(org);
      organizationtId = org?._id

      console.log({ favoriteMerchantId, merchant });

      if (favoriteMerchantId) {
        if (favoriteMerchantId !== merchant) {
          redirect(
            `/products?organization=${org.slug}&merchant=${favoriteMerchantId}&org_session=${organizationtId}`
          );
        }
      }
    }
  }
  console.log("Org Slug  " + orgSlug);

  const merchants = await getMerchants(favoriteMerchantId);

  return (
    <div className={`${lobster.variable} main-wrapper-how-it-works-page`}>
      <div className="how-it-work-top-box relative">
        <Suspense fallback={null}>
          <ProductsCityTracker />
        </Suspense>

        <HowItWorksBanner />

        <div className="blobs-wrapper-box relative">
          {/* County Filter */}
          {/* <Suspense fallback={null}>
            <CountyFilter merchants={merchants} />
          </Suspense> */}

          {/* <GiftCategorySection /> */}

          <Suspense fallback={null}>
            <AvailableGiftsFromBackend />
          </Suspense>
        </div>

        {/* CTA */}
        <div className="custom-container">
          <div className="site-cts-wrapper-area mt-16 relative z-[10] grid md:grid-cols-2 gap-12 rounded-[22px]">
            <div>
              <h2 className="text-[34px] xl:text-[60px] text-mono-0">
                “Brighten someone’s day. Gift a Brontie today.”
              </h2>

              <Link
                href="/products"
                className="mt-8 inline-flex bg-secondary-100 px-6 py-4 rounded-[11px]"
              >
                Gift a Brontie today →
              </Link>
            </div>

            <Image
              src="/images/cta-section-model.png"
              alt="cta model"
              width={600}
              height={480}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductsPage;
