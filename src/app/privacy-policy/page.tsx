'use client';
import Image from 'next/image';
import Link from 'next/link';
import React from 'react';

const PrivacyPolicy = () => {
  return (
    <div className="privacy-policy-page-main !pt-[145px] pb-20 md:py-16">
      <div className="custom-container">
        {/* Scoped with tc for typography */}
        <div className="privacy-policy-wrapper tc max-w-4xl mx-auto">
          <div className="mb-8 md:mb-10">
            <h2>Privacy Policy</h2>
            <p className="mt-2">Last updated: 20/09/2025</p>
            <p className="mt-4">
              Brontie Limited (“Brontie”, “we”, “our”, “us”) respects your
              privacy and is committed to protecting your personal data. This
              Privacy Policy explains how we collect, use, store, and share your
              information when you use our service at brontie.ie.
            </p>
          </div>

          {/* 1. Who We Are */}
          <section className="mb-10">
            <h3>1. Who We Are</h3>
            <p className="mt-2">
              Brontie Limited, registered in Ireland (Company No. 793231),
              located at 43 Greenfield Drive, Maynooth, Co. Kildare, is the
              controller of your personal data.
            </p>
            <p className="mt-2">
              If you have questions, contact us at:{' '}
              <a href="mailto:hello@brontie.ie">hello@brontie.ie</a>.
            </p>
          </section>

          {/* 2. What Data We Collect */}
          <section className="mb-10">
            <h3>2. What Data We Collect</h3>
            <ul className="tc-list mt-2">
              <li>
                <strong>Customer Data:</strong> name, email address, payment
                details (via Stripe), and gift purchase history.
              </li>
              <li>
                <strong>Recipient Data:</strong> name and email address (as
                provided by the sender).
              </li>
              <li>
                <strong>Café Partner Data:</strong> contact information, bank
                details for payouts, sales/redemption data.
              </li>
              <li>
                <strong>Usage Data:</strong> device/browser info, IP address,
                cookies, voucher tracking (e.g. redemption times, forwarding of
                voucher links).
              </li>
              <li>
                <strong>Communications:</strong> any emails or messages sent to
                us.
              </li>
            </ul>
          </section>

          {/* 3. How We Use Your Data */}
          <section className="mb-10">
            <h3>3. How We Use Your Data</h3>
            <ul className="tc-list mt-2">
              <li>
                To provide the Brontie service (purchase, send, redeem gifts).
              </li>
              <li>To process payments securely through Stripe.</li>
              <li>To notify cafés of redemptions and manage payouts.</li>
              <li>
                To track voucher usage, including viral flows (e.g. if a gift is
                forwarded).
              </li>
              <li>To improve the website and user experience via analytics.</li>
              <li>
                To send service-related updates (e.g. redemption reminders,
                support replies).
              </li>
              <li>
                With your consent, to send marketing updates (opt-in only).
              </li>
            </ul>
          </section>

          {/* 4. Legal Basis */}
          <section className="mb-10">
            <h3>4. Legal Basis</h3>
            <ul className="tc-list mt-2">
              <li>
                <strong>Contract:</strong> processing required to deliver our
                service.
              </li>
              <li>
                <strong>Legal obligation:</strong> for VAT, tax, and accounting
                purposes.
              </li>
              <li>
                <strong>Consent:</strong> for marketing and optional data
                tracking.
              </li>
              <li>
                <strong>Legitimate interests:</strong> to analyse usage and
                improve our service.
              </li>
            </ul>
          </section>

          {/* 5. Sharing Your Data */}
          <section className="mb-10">
            <h3>5. Sharing Your Data</h3>
            <ul className="tc-list mt-2">
              <li>
                <strong>Cafés:</strong> recipient’s name and gift details so
                they can redeem.
              </li>
              <li>
                <strong>Stripe:</strong> for payment processing.
              </li>
              <li>
                <strong>Analytics providers:</strong> e.g. Posthog (anonymised
                usage data).
              </li>
              <li>
                <strong>Legal/regulatory authorities:</strong> if required by
                law.
              </li>
            </ul>
            <p className="mt-2">We never sell your personal data.</p>
          </section>

          {/* 6. Data Retention */}
          <section className="mb-10">
            <h3>6. Data Retention</h3>
            <ul className="tc-list mt-2">
              <li>
                Customer and café data: retained for as long as you use the
                service, then securely archived for tax/legal compliance
                (usually 6 years).
              </li>
              <li>
                Cookies and analytics data: retained as per our [Cookie Policy].
              </li>
              <li>
                Gift data: retained for up to 5 years in line with Irish voucher
                expiry laws.
              </li>
            </ul>
          </section>

          {/* 7. Your Rights */}
          <section className="mb-10">
            <h3>7. Your Rights</h3>
            <p className="mt-2">Under GDPR, you have the right to:</p>
            <ul className="tc-list mt-2">
              <li>Access your data.</li>
              <li>Correct inaccuracies.</li>
              <li>
                Request deletion (except where retention is required by law).
              </li>
              <li>Object to processing for marketing or analytics.</li>
              <li>Withdraw consent at any time.</li>
            </ul>
            <p className="mt-2">
              Contact <a href="mailto:hello@brontie.ie">hello@brontie.ie</a> to
              exercise these rights.
            </p>
          </section>

          {/* 8. Data Security */}
          <section className="mb-10">
            <h3>8. Data Security</h3>
            <p className="mt-2">
              We use secure servers, encryption, and access controls to protect
              your data. Payments are processed by Stripe, and Brontie never
              stores your full card details.
            </p>
          </section>

          {/* 9. International Transfers */}
          <section className="mb-10">
            <h3>9. International Transfers</h3>
            <p className="mt-2">
              Data may be processed outside the EU by third-party providers
              (e.g. Stripe, analytics tools). We ensure such transfers comply
              with GDPR safeguards (e.g. SCCs).
            </p>
          </section>

          {/* 10. Updates */}
          <section className="mb-10">
            <h3>10. Updates</h3>
            <p className="mt-2">
              We may update this Privacy Policy from time to time. Updates will
              be posted here with a new “Last updated” date.
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

export default PrivacyPolicy;
