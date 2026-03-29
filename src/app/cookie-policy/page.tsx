'use client';
import Image from 'next/image';
import Link from 'next/link';
import React from 'react';

const CookiePolicy = () => {
  return (
    <div className="cookie-policy-page-main !pt-[145px] pb-20 md:py-16">
      <div className="custom-container">
        {/* Scoped with tc for typography (h2..h6 + p/li) */}
        <div className="cookie-policy-wrapper tc max-w-4xl mx-auto">
          <div className="mb-8 md:mb-10">
            <h2>Cookie Policy</h2>
            <p className="mt-2">Last updated: 20/09/2025</p>
            <p className="mt-4">
              Brontie Limited (“Brontie”, “we”, “our”, “us”) uses cookies and
              similar technologies on brontie.ie to improve your experience,
              analyse usage, and support the operation of our platform. This
              Cookie Policy explains what cookies are, how we use them, and your
              choices.
            </p>
          </div>

          {/* 1. What Are Cookies? */}
          <section className="mb-10">
            <h3>1. What Are Cookies?</h3>
            <p className="mt-2">
              Cookies are small text files placed on your device when you visit
              a website. They allow us to recognise your device, remember your
              preferences, and improve the functionality of our service.
            </p>
          </section>

          {/* 2. How We Use Cookies */}
          <section className="mb-10">
            <h3>2. How We Use Cookies</h3>
            <ul className="tc-list mt-2">
              <li>
                <strong>Essential Cookies</strong> — Required for the website to
                function (e.g. secure checkout via Stripe, user session
                management). These cannot be switched off.
              </li>
              <li>
                <strong>Performance &amp; Analytics Cookies</strong> — Help us
                understand how users interact with our site (e.g. number of
                visits, clicks on vouchers, redemption rates). We may use tools
                such as Posthog, GA or similar to track anonymised user
                behaviour.
              </li>
              <li>
                <strong>Functional Cookies</strong> — Store user preferences,
                such as remembering your name when sending gifts.
              </li>
              <li>
                <strong>Tracking &amp; Viral Flow Cookies</strong> — We may
                assign unique codes to vouchers and store limited cookie data to
                understand if a voucher link is forwarded, shared, or redeemed
                by another recipient. This helps us analyse and improve the
                viral gifting flow. No personally identifiable information is
                stored in these cookies.
              </li>
              <li>
                <strong>Marketing Cookies</strong> — Occasionally, cookies may
                be used to measure the effectiveness of online campaigns (e.g.
                Facebook or Instagram ads).
              </li>
            </ul>
          </section>

          {/* 3. Third-Party Cookies */}
          <section className="mb-10">
            <h3>3. Third-Party Cookies</h3>
            <p className="mt-2">
              Some cookies are placed by third-party services we use, such as:
            </p>
            <ul className="tc-list mt-2">
              <li>Stripe – for secure payments</li>
              <li>
                Posthog / GA / analytics tools – for tracking anonymised usage
              </li>
              <li>
                Social media platforms – if you engage with our ads or embedded
                content
              </li>
            </ul>
          </section>

          {/* 4. Managing Cookies */}
          <section className="mb-10">
            <h3>4. Managing Cookies</h3>
            <p className="mt-2">
              You can control and manage cookies in your browser settings. Most
              browsers allow you to block or delete cookies. However, blocking
              essential cookies may affect your ability to use the platform.
            </p>
            <p className="mt-2">For more information:</p>
            <ul className="tc-list mt-2">
              <li>
                <a
                  href="https://www.aboutcookies.org"
                  target="_blank"
                  rel="noreferrer"
                >
                  AboutCookies.org
                </a>
              </li>
              <li>
                <a
                  href="https://www.allaboutcookies.org"
                  target="_blank"
                  rel="noreferrer"
                >
                  AllAboutCookies.org
                </a>
              </li>
            </ul>
          </section>

          {/* 5. Updates */}
          <section className="mb-10">
            <h3>5. Updates</h3>
            <p className="mt-2">
              We may update this Cookie Policy to reflect changes in technology,
              law, or our practices. Updates will be posted here with a new
              “Last updated” date.
            </p>
          </section>
        </div>
      </div>
      {/* CTA */}
      <div className="custom-container">
        <div className="site-cts-wrapper-area mt-16 md:mt-20 xl:mt-[129px] -mb-[280px] md:-mb-[210px] lg:-mb-[270px] xl:-mb-[388px] relative z-[999] grid grid-cols-1 md:grid-cols-2 gap-14 md:gap-16 lg:gap-20 pt-[30px] md:pt-[47px] pr-[11px] md:pr-10 lg:pr-[56px] pb-[27px] md:pb-[34px] pl-0 md:pl-14 lg:pl-[77px] rounded-[22px]">
          <div className="site-cta-left-cont flex flex-col justify-center items-start pl-[26px] md:pl-0">
            <h2 className="title text-left text-[34px] lg:text-[46px] xl:text-[60px] text-mono-0 font-normal font-primary leading-[120%] max-w-[553px]">
              “Brighten someone’s day. Gift a Brontie today.”
            </h2>
            <div className="button-item relative mt-8 md:mt-9 lg:mt-[50px]">
              <Link
                className="bg-secondary-100 hover:opacity-85 flex relative z-[9] h-[49px] md:h-[60px] lg:h-[79px] items-center max-w-[305px] w-full justify-center py-4 md:py-5 xl:py-[27px] pl-[35px] pr-[19px] rounded-[11px] text-[12px] md:text-[18px] lg:text-[22px] text-center font-secondary font-normal leading-[1]"
                href="/products"
              >
                Gift a Brontie today →
              </Link>
              <Image
                src="/images/icons/shadow-elisp.svg"
                width={233}
                height={41}
                alt="angle arrow model"
                className="absolute -bottom-[45px] -left-[26px] right-0 mx-auto"
              />
            </div>
          </div>
          <div className="site-cta-right-cont">
            <Image
              src="/images/cta-section-model.png"
              alt="cta model image"
              width={626}
              height={480}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default CookiePolicy;
