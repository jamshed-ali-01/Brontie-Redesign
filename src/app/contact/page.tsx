import ContactsForm from '@/components/pages/homepage/ContactsForm';
import { Lobster } from 'next/font/google';

const lobster = Lobster({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-lobster',
});

export default function ContactPage() {
  return (
    <div className={`${lobster.variable} home-page-main-wrapper`}>
      {/* Email Contact Info */}
      <section className="pt-16 md:pt-20 mt-16">
        <div className="custom-container text-center">
          <div className="bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 rounded-2xl p-8 max-w-2xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-4">
              Get in Touch
            </h2>
            <p className="text-gray-600 mb-6">
              Have a question or want to partner with us? We&apos;d love to hear from you.
            </p>
            <div className="flex items-center justify-center space-x-2">
              <span className="text-gray-700 font-medium">Email us at:</span>
              <a 
                href="mailto:hello@brontie.ie" 
                className="text-amber-600 hover:text-amber-700 font-semibold text-lg underline"
              >
                hello@brontie.ie
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Form */}
      <ContactsForm />
    </div>
  );
}

