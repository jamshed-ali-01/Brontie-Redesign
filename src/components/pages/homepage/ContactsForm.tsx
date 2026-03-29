'use client';
import Image from 'next/image';
import Link from 'next/link';
import React, { useState } from 'react';

type FormState = {
  name: string;
  email: string;
  cafe: string;
  description: string;
  // honeypot for bots:
  website?: string;
};

const ContactsForm: React.FC = () => {
  const [form, setForm] = useState<FormState>({
    name: '',
    email: '',
    cafe: '',
    description: '',
    website: '', // honeypot
  });
  const [status, setStatus] = useState<string>(''); // human-friendly message
  const [statusType, setStatusType] = useState<
    'idle' | 'sending' | 'success' | 'error'
  >('idle');

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // block obvious bots
    if (form.website) return;

    setStatusType('sending');
    setStatus('Sending...');

    try {
      const res = await fetch('/api/contactus', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          cafe: form.cafe,
          description: form.description,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (res.ok) {
        setStatusType('success');
        setStatus('Message sent successfully!');
        setForm({
          name: '',
          email: '',
          cafe: '',
          description: '',
          website: '',
        });
      } else {
        setStatusType('error');
        setStatus((data && data.message) || 'Something went wrong.');
      }
    } catch {
      setStatusType('error');
      setStatus('Failed to send email');
    }
  };

  const isSending = statusType === 'sending';

  return (
    <section className="contact-form-section pt-16 md:pt-[90px] xl:pt-[164px] pb-0">
      <div className="custom-container">
        <div className="contact-form-wrapper grid grid-cols-1 md:grid-cols-2 gap-0 md:gap-6 lg:gap-10 xl:gap-[97px]">
          <div className="contact-form-left-cont">
            <h2 className="title text-left text-[35px]  md:text-[48px] lg:text-[56px] xl:text-[67px] text-mono-100 font-primary font-normal mb-[17px] md:mb-10 xl:mb-12">
              Let’s Get in Touch, Contact us
            </h2>

            <div className="model-image-box hidden md:block xl:h-[834px] w-full overflow-hidden rounded-[16px]">
              <Image
                height={834}
                width={625}
                src="/images/contact-form-sec-model-image.png"
                alt="contact form model image"
                className="w-full h-full rounded-[16px] overflow-hidden object-fill"
                loading="lazy"
              />
            </div>
          </div>

          <div className="contact-form-right-cont border border-[#FFDC89] bg-tarteary-100 rounded-[16px] pt-[27px] px-[18px] md:pt-[52px] md:px-[35px] pb-9 md:pb-12 xl:pb-[69px]">
            <form
              onSubmit={handleSubmit}
              className="contact-forms-main flex flex-col gap-5 lg:gap-6 xl:gap-12"
              noValidate
            >
              {/* Honeypot */}
              <input
                type="text"
                name="website"
                value={form.website}
                onChange={handleChange}
                className="hidden"
                tabIndex={-1}
                autoComplete="off"
              />

              {/* Name */}
              <div className="input-group-box">
                <label
                  htmlFor="name"
                  className="mb-3 md:mb-4 xl:mb-6 block text-[14px] md:text-[18px] lg:text-[22px] xl:text-[28px] text-left text-[#232323] font-secondary font-normal leading-[100%]"
                >
                  Your Name
                </label>
                <input
                  className="pt-6 pr-[35px] w-full h-10 lg:h-16 xl:h-[94px] flex justify-start items-center pb-6 rounded-[12px] !border-2 border-mono-0 focus:!border-[#F4C24D] placeholder:text-[24px] placeholder:text-mono-100 pl-[31px] text-[28px] text-left text-[#232323] font-secondary font-bold leading-[100%]"
                  type="text"
                  name="name"
                  id="name"
                  placeholder="Your Name"
                  value={form.name}
                  onChange={handleChange}
                  required
                  disabled={isSending}
                />
              </div>

              {/* Email */}
              <div className="input-group-box">
                <label
                  htmlFor="email"
                  className="mb-3 md:mb-4 xl:mb-6 block text-[14px] md:text-[18px] lg:text-[22px] xl:text-[28px] text-left text-[#232323] font-secondary font-normal leading-[100%]"
                >
                  Your Email
                </label>
                <input
                  className="pt-6 pr-[35px] w-full h-10 lg:h-16 xl:h-[94px] flex justify-start items-center pb-6 rounded-[12px] !border-2 border-mono-0 focus:!border-[#F4C24D] placeholder:text-[24px] placeholder:text-mono-100 pl-[31px] text-[28px] text-left text-[#232323] font-secondary font-bold leading-[100%]"
                  type="email"
                  name="email"
                  id="email"
                  placeholder="you@example.com"
                  value={form.email}
                  onChange={handleChange}
                  required
                  disabled={isSending}
                />
              </div>

              {/* Cafe */}
              <div className="input-group-box">
                <label
                  htmlFor="cafe"
                  className="mb-3 md:mb-4 xl:mb-6 block text-[14px] md:text-[18px] lg:text-[22px] xl:text-[28px] text-left text-[#232323] font-secondary font-normal leading-[100%]"
                >
                  Cafe Name
                </label>
                <input
                  className="pt-6 pr-[35px] w-full h-10 lg:h-16 xl:h-[94px] flex justify-start items-center pb-6 rounded-[12px] !border-2 border-mono-0 focus:!border-[#F4C24D] placeholder:text-[24px] placeholder:text-mono-100 pl-[31px] text-[28px] text-left text-[#232323] font-secondary font-bold leading-[100%]"
                  type="text"
                  name="cafe"
                  id="cafe"
                  placeholder="Cafe Name"
                  value={form.cafe}
                  onChange={handleChange}
                  required
                  disabled={isSending}
                />
              </div>

              {/* Description */}
              <div className="input-group-box">
                <label
                  htmlFor="description"
                  className="mb-3 md:mb-4 xl:mb-6 block text-[14px] md:text-[18px] lg:text-[22px] xl:text-[28px] text-left text-[#232323] font-secondary font-normal leading-[100%]"
                >
                  Describe your request
                </label>
                <textarea
                  className="pt-6 w-full bg-mono-0 pr-5 md:pr-[35px] h-20 lg:h-[127px] pb-6 !rounded-[12px] !border-2 border-mono-0 focus:!border-[#F4C24D] placeholder:text-[24px] placeholder:text-mono-100 pl-[31px] text-[28px] text-left text-[#232323] font-secondary font-bold leading-[100%] resize-none"
                  name="description"
                  id="description"
                  placeholder="Tell us a bit about your request…"
                  value={form.description}
                  onChange={handleChange}
                  required
                  disabled={isSending}
                />
              </div>

              {/* Submit */}
              <div className="input-group-box">
                <button
                  type="submit"
                  disabled={isSending}
                  className="h-[44px] hover:opacity-70 cursor-pointer xl:h-[84px] md:h-[65px] max-w-[202px] md:max-w-[386px] w-full text-[12px] md:text-[22px] lg:text-[24px] xl:text-[28px] text-center flex justify-center items-center text-mono-100 font-normal font-secondary leading-[100%] bg-secondary-100 rounded-[10px] md:rounded-[12px] xl:rounded-[18px] mx-auto disabled:opacity-60"
                  aria-busy={isSending}
                >
                  {isSending ? 'Sending…' : 'Send Request'}
                </button>

                {status && (
                  <p
                    className={`text-center mt-3 text-sm md:text-base ${
                      statusType === 'success'
                        ? 'text-green-600'
                        : statusType === 'error'
                          ? 'text-red-500'
                          : 'text-neutral-700'
                    }`}
                    role="status"
                    aria-live="polite"
                  >
                    {status}
                  </p>
                )}
              </div>
            </form>
          </div>

          {/* Mobile image */}
          <div className="model-image-box mt-[25px] block md:hidden h-[290px] md:h-[469px] xl:h-[834px] w-full overflow-hidden rounded-[16px]">
            <Image
              height={834}
              width={625}
              src="/images/contact-form-sec-model-image.png"
              alt="contact form model image"
              className="w-full h-full rounded-[16px] overflow-hidden object-cover md:object-fill"
              loading="lazy"
            />
          </div>
        </div>

        {/* CTA */}
        <div className="site-cts-wrapper-area mt-16 md:mt-20 xl:mt-[129px] -mb-[180px] md:-mb-[160px] lg:-mb-[220px] xl:-mb-[318px] relative z-[999] grid grid-cols-1 md:grid-cols-2 gap-14 md:gap-16 lg:gap-20 pt-[30px] md:pt-[47px] pr-[11px] md:pr-10 lg:pr-[56px] pb-[27px] md:pb-[34px] pl-0 md:pl-14 lg:pl-[77px] rounded-[22px]">
          <div className="site-cta-left-cont flex flex-col justify-center items-start pl-[26px] md:pl-0">
            <h2 className="title text-left text-[34px] lg:text-[46px] xl:text-[60px] text-mono-0 font-normal font-primary leading-[120%] max-w-[553px]">
              “Brighten someone’s day. Gift a Brontie today.”
            </h2>
            <div className="button-item relative mt-8 md:mt-9 lg:mt-[50px]">
              <Link
                className="bg-secondary-100 hover:opacity-70 flex relative z-[9] h-[49px] md:h-[60px] lg:h-[79px] items-center max-w-[305px] w-full justify-center py-4 md:py-5 xl:py-[27px] pl-[35px] pr-[19px] rounded-[11px] text-[12px] md:text-[18px] lg:text-[22px] text-center font-secondary font-normal leading-[1]"
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
                loading="lazy"
              />
            </div>
          </div>
          <div className="site-cta-right-cont">
            <Image
              src="/images/cta-section-model.png"
              alt="cta model image"
              width={626}
              height={480}
              loading="lazy"
            />
          </div>
        </div>
      </div>
    </section>
  );
};

export default ContactsForm;
