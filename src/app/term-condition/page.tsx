'use client';
import Image from 'next/image';
import Link from 'next/link';
import React from 'react';

const TermCondition = () => {
  return (
    <div className="term-and-condition-page-main !pt-[145px] pb-20 md:py-16">
      <div className="custom-container">
        <div className="term-and-condition-wrapper tc max-w-4xl mx-auto">
          <div className="mb-8 md:mb-10">
            <h2>Terms &amp; Conditions</h2>
            <p className="mt-4">
              These Terms &amp; Conditions ("Terms") govern your use of Brontie.
              By using our website, purchasing or redeeming a Brontie gift, or
              partnering as a café or organisation, you agree to these Terms.
            </p>
            <p className="mt-3">
              Brontie Limited is registered in Ireland at:
              <br />
              <strong>
                43 Greenfield Drive, Maynooth, Co. Kildare, Ireland.
              </strong>
            </p>
          </div>

          {/* 1. For Customers */}
          <section className="mb-10">
            <h3>1. For Customers</h3>

            <h4 className="mt-6">What Brontie Is</h4>
            <p className="mt-2">
              Brontie is Ireland's first café gifting platform. We make it easy
              to send and redeem small gifts like coffees, cakes, and other
              treats. Brontie acts as a facilitator between customers and cafés
              — the actual sale and product responsibility belong to the café
              where the gift is redeemed.
            </p>

            <h4 className="mt-6">Nature of Brontie Gifts</h4>
            <p className="mt-2">
              Brontie gifts are specific product vouchers — not monetary credit
              or gift cards. When you purchase a Brontie gift, you are
              purchasing a specific named item (for example, "One Great Coffee
              from So Coffee"). The recipient is entitled to redeem that
              specific item at the named café.
            </p>
            <p className="mt-2">
              Brontie gifts do not represent a monetary value that can be
              applied to any purchase at the café. The price paid by the
              customer includes Brontie's platform fee and does not entitle the
              recipient to spend the full amount paid at the café — they are
              entitled to receive the specific item purchased only.
            </p>

            <h4 className="mt-6">Voucher Validity</h4>
            <ul className="tc-list mt-2">
              <li>
                Brontie gifts ("vouchers") are valid for 5 years from the date
                of purchase (in line with Irish law).
              </li>
              <li>Vouchers cannot be exchanged for cash.</li>
              <li>
                No "change" will be given. For example, if you redeem a €4
                coffee voucher for a €3.50 tea, the remaining €0.50 is not
                refunded.
              </li>
              <li>
                If the recipient wishes to redeem a different item of equal or
                lesser value, this is at the café's discretion.
              </li>
            </ul>

            <h4 className="mt-6">Price Changes</h4>
            <ul className="tc-list mt-2">
              <li>
                If the café has increased its prices since purchase, you may be
                asked to pay the difference at the till.
              </li>
              <li>
                Cafés can allow swaps (e.g. coffee for tea) at their discretion,
                but they are not obliged to provide a like-for-like exchange.
              </li>
            </ul>

            <h4 className="mt-6">Refunds</h4>
            <ul className="tc-list mt-2">
              <li>
                If the wrong email address is used, contact{' '}
                <a href="mailto:hello@brontie.ie">hello@brontie.ie</a> and
                we'll fix it.
              </li>
              <li>
                If a café closes down or leaves Brontie, we'll refund your
                unredeemed voucher.
              </li>
              <li>
                If a gift has not been redeemed after 3 months, you can request
                a refund at any time by contacting{' '}
                <a href="mailto:hello@brontie.ie">hello@brontie.ie</a>.
              </li>
            </ul>

            <h4 className="mt-6">Limitations</h4>
            <ul className="tc-list mt-2">
              <li>
                Brontie is not responsible for product quality, safety, or café
                service. These are the responsibility of the café.
              </li>
              <li>
                Our maximum liability is the original purchase price of your
                voucher.
              </li>
            </ul>
          </section>

          {/* 2. For Cafés */}
          <section className="mb-10">
            <h3>2. For Cafés</h3>

            <h4 className="mt-6">What Cafés Are Agreeing To</h4>
            <p className="mt-2">
              By joining Brontie, cafés agree to honour valid Brontie gift
              vouchers for the specific items listed on their Brontie menu
              during normal trading hours. The café's obligation is to provide
              the specific item listed — not a monetary credit equal to the
              customer-facing price.
            </p>
            <p className="mt-2">
              Example: A café lists a coffee at €4.00. The customer pays €4.40
              (Brontie platform markup included). The café receives €4.00 minus
              Stripe fees. The café's obligation is to provide the coffee — not
              €4.40 worth of goods.
            </p>

            <h4 className="mt-6">Pricing Model</h4>
            <p className="mt-2">
              Brontie operates as a facilitator between customers and cafés.
              Cafés list their items at their own base price. Brontie adds a
              platform markup which is charged to the customer. The café always
              receives their listed base price minus Stripe transaction fees
              only. The platform markup is Brontie's revenue and is entirely
              separate from the café's listed price.
            </p>

            <h4 className="mt-6">Future Commission Structure</h4>
            <p className="mt-2">
              Brontie currently operates a customer-side markup model only.
              Brontie reserves the right to introduce a café-side commission or
              amend its fee structure in the future. Cafés will be given a
              minimum of 30 days written notice of any such change via email.
              Continued use of the Brontie platform after the notice period
              constitutes acceptance of the updated fee structure. Cafés who do
              not wish to accept the new terms may terminate their participation
              by contacting{' '}
              <a href="mailto:hello@brontie.ie">hello@brontie.ie</a> before the
              change takes effect.
            </p>

            <h4 className="mt-6">Payments</h4>
            <ul className="tc-list mt-2">
              <li>
                Payouts are processed at the end of each calendar month for all
                vouchers redeemed during that month.
              </li>
              <li>
                Payouts are visible in your café dashboard, showing total
                redeemed sales minus Stripe transaction fees.
              </li>
              <li>Payments are processed via Stripe Connect.</li>
              <li>
                Cafés must complete Stripe onboarding to receive payouts.
              </li>
            </ul>

            <h4 className="mt-6">VAT &amp; Compliance</h4>
            <ul className="tc-list mt-2">
              <li>
                Brontie operates as a facilitator between customers and cafés.
                Cafés are responsible for accounting for VAT on redeemed sales
                at the point of redemption. Brontie accounts for VAT on its
                platform fees only.
              </li>
              <li>
                Cafés should consult their accountant regarding VAT treatment
                of Brontie redemptions.
              </li>
              <li>
                Brontie may request VAT receipts or records to comply with
                Revenue requirements.
              </li>
            </ul>

            <h4 className="mt-6">Pricing &amp; Flexibility</h4>
            <ul className="tc-list mt-2">
              <li>
                Cafés may raise their listed prices at any time. Suspicious or
                exploitative pricing changes may result in a warning or
                suspension.
              </li>
              <li>
                Cafés are free to allow product swaps at their discretion but
                are not required to do so.
              </li>
            </ul>

            <h4 className="mt-6">Obligations</h4>
            <ul className="tc-list mt-2">
              <li>
                Cafés must honour valid Brontie vouchers during normal trading
                hours.
              </li>
              <li>
                Cafés must not refuse valid vouchers without good reason.
              </li>
              <li>
                If a café leaves Brontie, Brontie will refund all unredeemed
                vouchers linked to that café.
              </li>
            </ul>

            <h4 className="mt-6">Images, Logos &amp; Marketing Assets</h4>
            <ul className="tc-list mt-2">
              <li>
                By uploading a logo, product photo, or any image to Brontie,
                the café confirms they have the right to use that image and
                grants Brontie a non-exclusive royalty-free licence to use it
                for promoting that café on the Brontie platform and Brontie's
                own marketing channels including social media.
              </li>
              <li>
                Brontie may use café logos, product photos, and café images for
                promotional purposes including the Brontie website, social
                media channels, marketing materials, and partnership
                announcements.
              </li>
              <li>
                Any AI-generated images created using Brontie's built-in
                content generation tools are owned by Brontie. By using these
                tools the café agrees that Brontie retains ownership of
                generated assets, though the café may use them freely for their
                own promotional purposes.
              </li>
              <li>
                Cafés may request removal of their images from Brontie's
                marketing materials at any time by contacting{' '}
                <a href="mailto:hello@brontie.ie">hello@brontie.ie</a>.
              </li>
            </ul>

            <h4 className="mt-6">Liability</h4>
            <ul className="tc-list mt-2">
              <li>
                Brontie is a facilitator and does not take responsibility for
                food or drink quality, health and safety, or customer service.
              </li>
              <li>
                Fraudulent redemptions, fake chargebacks, or other abuse may
                result in immediate suspension and referral to relevant
                authorities.
              </li>
            </ul>
          </section>

          {/* 3. For Organisations */}
          <section className="mb-10">
            <h3>3. For Organisations</h3>

            <h4 className="mt-6">What Organisation Gifting Is</h4>
            <p className="mt-2">
              Organisations such as GAA clubs, tidy towns groups, charities,
              and community organisations can be listed on Brontie so that
              supporters can send coffee gifts to their volunteers and members.
              Gifts are allocated to the organisation's Brontie dashboard and
              redeemed at the linked local café.
            </p>

            <h4 className="mt-6">Organisation Accounts</h4>
            <ul className="tc-list mt-2">
              <li>
                Organisations must provide accurate information when
                registering.
              </li>
              <li>
                Organisations are responsible for keeping their login
                credentials secure.
              </li>
              <li>
                Organisations can upload a logo and community cover photo which
                will appear on the Brontie platform and on the gift success
                page shown to purchasers.
              </li>
            </ul>

            <h4 className="mt-6">Images &amp; Logos</h4>
            <ul className="tc-list mt-2">
              <li>
                By uploading a logo or cover photo, the organisation confirms
                they have the right to use that image and grants Brontie a
                non-exclusive licence to display it on the platform and in
                related promotional materials.
              </li>
              <li>
                Brontie may use organisation logos and community photos to
                promote community gifting features on the Brontie platform and
                social media channels.
              </li>
              <li>
                Organisations may request removal of their images at any time
                by contacting{' '}
                <a href="mailto:hello@brontie.ie">hello@brontie.ie</a>.
              </li>
            </ul>
          </section>

          {/* 4. For Bulk Buy / Brontie for Business */}
          <section className="mb-10">
            <h3>4. For Bulk Buy / Brontie for Business Customers</h3>

            <h4 className="mt-6">What Bulk Buy Is</h4>
            <p className="mt-2">
              Brontie for Business allows companies, organisations, and event
              organisers to purchase multiple coffee gifts in a single
              transaction and distribute them individually via email, WhatsApp,
              or CSV upload.
            </p>

            <h4 className="mt-6">Service Fee</h4>
            <ul className="tc-list mt-2">
              <li>
                A 5% service fee applies to all Bulk Buy / Brontie for Business
                orders. This fee is displayed clearly at checkout and on the
                order confirmation.
              </li>
              <li>
                This fee does not apply to standard individual gift purchases.
              </li>
            </ul>

            <h4 className="mt-6">Gift Distribution &amp; Data Retention</h4>
            <ul className="tc-list mt-2">
              <li>
                When a CSV of recipient email addresses is uploaded to Brontie
                for distribution purposes, Brontie acts as a data processor on
                behalf of the purchasing organisation (the data controller).
              </li>
              <li>
                Recipient email addresses are stored solely for the purpose of
                gift delivery and distribution tracking.
              </li>
              <li>
                A gift distribution log is maintained for 30 days from the date
                of sending, showing which voucher was assigned to which
                recipient and the delivery status. This log is accessible to
                the purchasing organisation via their Brontie dashboard.
              </li>
              <li>
                After 30 days, all recipient email addresses are automatically
                and permanently deleted from Brontie's systems. Voucher status
                and redemption records are retained for accounting and audit
                purposes with no personally identifiable information attached.
              </li>
              <li>
                Purchasing organisations are responsible for ensuring they have
                appropriate authorisation to share recipient email addresses
                with Brontie for the purpose of gift distribution.
              </li>
            </ul>

            <h4 className="mt-6">Magic Link Dashboard</h4>
            <ul className="tc-list mt-2">
              <li>
                After a Bulk Buy purchase, the buyer receives a secure magic
                link to a private dashboard to manage and distribute their
                gifts.
              </li>
              <li>
                This link should be kept secure. Brontie is not responsible for
                unauthorised access resulting from the link being shared.
              </li>
            </ul>
          </section>

          {/* 5. General */}
          <section className="mb-10">
            <h3>5. General</h3>

            <h4 className="mt-6">Data Protection</h4>
            <p className="mt-2">
              Brontie processes personal data in accordance with the General
              Data Protection Regulation (GDPR) and applicable Irish data
              protection law. For full details on how we collect, use, and
              store personal data, please refer to our Privacy Policy at{' '}
              <a href="https://www.brontie.ie/privacy-policy">
                www.brontie.ie/privacy-policy
              </a>
              . Recipient email addresses uploaded for bulk gift distribution
              are deleted after 30 days as outlined in Section 4.
            </p>

            <h4 className="mt-6">Force Majeure</h4>
            <p className="mt-2">
              Brontie is not liable for failure to perform due to events
              outside our reasonable control — including strikes, pandemics,
              internet outages, payment processor failures, or other unexpected
              circumstances.
            </p>

            <h4 className="mt-6">Updates to Terms</h4>
            <p className="mt-2">
              We may update these Terms from time to time. The latest version
              published on www.brontie.ie is binding. Continued use of the
              platform after changes constitutes acceptance of the updated
              Terms. For significant changes, we will notify registered users
              and café partners by email with a minimum of 14 days notice.
            </p>

            <h4 className="mt-6">Disputes</h4>
            <p className="mt-2">
              If you have a complaint or dispute, contact{' '}
              <a href="mailto:hello@brontie.ie">hello@brontie.ie</a>. We will
              aim to respond within 5 working days. Irish law governs these
              Terms. Any disputes shall be subject to the exclusive jurisdiction
              of the Irish courts.
            </p>
          </section>
        </div>
      </div>

      {/* CTA */}
      <div className="custom-container">
        <div className="site-cts-wrapper-area mt-16 md:mt-20 xl:mt-[129px] -mb-[280px] md:-mb-[210px] lg:-mb-[270px] xl:-mb-[388px] relative z-[999] grid grid-cols-1 md:grid-cols-2 gap-14 md:gap-16 lg:gap-20 pt-[30px] md:pt-[47px] pr-[11px] md:pr-10 lg:pr-[56px] pb-[27px] md:pb-[34px] pl-0 md:pl-14 lg:pl-[77px] rounded-[22px]">
          <div className="site-cta-left-cont flex flex-col justify-center items-start pl-[26px] md:pl-0">
            <h2 className="title text-left text-[34px] lg:text-[46px] xl:text-[60px] text-mono-0 font-normal font-primary leading-[120%] max-w-[553px]">
              "Brighten someone's day. Gift a Brontie today."
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

export default TermCondition;
