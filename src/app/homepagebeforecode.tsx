'use client';

import ContactForm from "@/components/contactform/ContactForm";
import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from 'react';

interface Category {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  imageUrl?: string;
  displayOrder: number;
  isActive: boolean;
}

export default function Home() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch('/api/categories');
        const data = await response.json();
        if (data.success) {
          setCategories(data.categories);
        }
      } catch (error) {
        console.error('Error fetching categories:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  const scrollToConnection = () => {
    const element = document.getElementById('connection-section');
    element?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-red-50 to-orange-100">
      
      {/* Fixed Navbar with Café Buttons */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-200/50 shadow-sm">
        <div className="max-w-6xl mx-auto px-1 md:px-2">
          <div className="flex justify-between items-center h-12 md:h-14">
            {/* Logo/Brand - Left side */}
            <div className="flex items-center">
              <Image
                src="/brontie-logo.webp"
                alt="Brontie"
                width={120}
                height={48}
                className="h-22 md:h-22 w-auto object-contain"
              />
            </div>
            
            {/* Café Buttons - Right side */}
            <div className="flex items-center gap-3 md:gap-4">
              {/* Café Sign-up Button */}
              <Link
                href="/cafes/signup"
                className="group bg-gradient-to-r from-teal-600 to-teal-700 text-white font-medium px-3 py-1.5 md:px-4 md:py-2 rounded-full hover:from-teal-700 hover:to-teal-800 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl border border-teal-500/20"
              >
                <span className="flex items-center gap-2 text-sm md:text-base text-white">
                  <span className="text-base md:text-lg">☕</span>
                  <span className="hidden sm:inline text-white">Join Brontie</span>
                  <span className="sm:hidden text-white">Join</span>
                  <span className="group-hover:translate-x-1 transition-transform duration-300 text-white">→</span>
                </span>
              </Link>
              
              {/* Café Login Button */}
              <Link
                href="/cafes/login"
                className="group bg-gradient-to-r from-yellow-500 to-yellow-600 text-white font-medium px-3 py-1.5 md:px-4 md:py-2 rounded-full hover:from-yellow-600 hover:to-yellow-700 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl border border-yellow-400/20"
              >
                <span className="flex items-center gap-2 text-sm md:text-base text-white">
                  <span className="text-base md:text-lg">🔑</span>
                  <span className="hidden sm:inline text-white">Café Login</span>
                  <span className="sm:hidden text-white">Login</span>
                  <span className="group-hover:translate-x-1 transition-transform duration-300 text-white">→</span>
                </span>
              </Link>
            </div>
          </div>
        </div>
      </nav>


      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="flex justify-center">
          <Image
            src="/brontie-logo.webp"
            alt="Brontie Logo"
            width={400}
            height={160}
            className="object-contain"
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-r from-orange-100/30 via-yellow-100/30 to-green-100/30"></div>
        <div className="relative max-w-6xl mx-auto px-6 pt-20 pb-20 md:pt-24 md:pb-28">
          <div className="text-center">
            {/* Floating elements for micro-joy */}
            <div className="absolute top-10 left-10 w-6 h-6 bg-yellow-400 rounded-full animate-float shadow-lg"></div>
            <div className="absolute top-20 right-16 w-4 h-4 bg-orange-400 rounded-full animate-float shadow-lg" style={{ animationDelay: '1s' }}></div>
            <div className="absolute bottom-20 left-20 w-5 h-5 bg-green-400 rounded-full animate-float shadow-lg" style={{ animationDelay: '2s' }}></div>

            <div className="inline-block mb-6">
              <span className="text-green-700 text-sm font-medium tracking-wide uppercase bg-green-100 px-4 py-2 rounded-full border border-green-200">
                Thoughtful gifting, made simple
              </span>
            </div>

            <h1 className="text-6xl md:text-8xl font-bold mb-6 leading-tight" style={{ fontFamily: 'Alegreya SC, serif' }}>
              <span className="text-slate-700">A warm cup,</span><br />
              <span className="text-orange-600 animate-gentle-pulse">a kind thought.</span>
            </h1>

            <p className="text-xl md:text-2xl text-slate-600 mb-4 max-w-3xl mx-auto leading-relaxed">
              Send small surprises that create big smiles. Coffee, treats, experiences —
              delivered instantly, redeemed locally.
            </p>

            <p className="text-lg text-green-600 mb-12 font-medium">
              A small treat, a big smile. ✨
            </p>

            {!loading && categories.filter(cat => cat.isActive).length > 0 && (
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <Link
                  href={`/category/${categories.find(cat => cat.isActive)?.slug}`}
                  className="group bg-orange-600 text-white font-bold px-8 py-4 rounded-full hover:bg-orange-700 transition-all duration-300 transform hover:scale-105 shadow-xl hover:shadow-2xl border-2 border-orange-500"
                >
                  <span className="flex items-center gap-2 text-white">
                    Send a Gift
                    <span className="group-hover:translate-x-1 transition-transform duration-300 text-white">→</span>
                  </span>
                </Link>
                <button
                  onClick={scrollToConnection}
                  className="text-slate-600 font-medium hover:text-orange-500 transition-colors duration-300 underline underline-offset-4"
                >
                  Learn more about gifting
                </button>
              </div>
            )}


          </div>
        </div>
      </section>

      {/* Emotional Connection Section */}
      <section id="connection-section" className="py-20 bg-gradient-to-r from-red-50 via-orange-50 to-yellow-50">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-700 mb-4" style={{ fontFamily: 'Alegreya SC, serif' }}>
              More than a gift. A moment of connection.
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              In a world of digital noise, create meaningful moments that bridge distance and bring joy to everyday life.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Surprise & Delight */}
            <div className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 text-center group border-2 border-yellow-200">
              <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300 border-2 border-yellow-300">
                <span className="text-3xl">✨</span>
              </div>
              <h3 className="text-xl font-bold mb-4 text-slate-700">Surprise & Delight</h3>
              <p className="text-slate-600 leading-relaxed">
                An unexpected coffee voucher turns an ordinary Tuesday into a mini celebration.
                Facilitate spontaneous happiness in daily life.
              </p>
            </div>

            {/* Connection & Belonging */}
            <div className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 text-center group border-2 border-orange-200">
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300 border-2 border-orange-300">
                <span className="text-3xl">🤝</span>
              </div>
              <h3 className="text-xl font-bold mb-4 text-slate-700">Connection & Belonging</h3>
              <p className="text-slate-600 leading-relaxed">
                &ldquo;I sent you a gift&rdquo; means &ldquo;I want you to enjoy something I believe you&rsquo;ll love.&rdquo;
                Turn gestures into shared experiences.
              </p>
            </div>

            {/* Meaningful Presence */}
            <div className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 text-center group border-2 border-green-200">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300 border-2 border-green-300">
                <span className="text-3xl">💝</span>
              </div>
              <h3 className="text-xl font-bold mb-4 text-slate-700">Presence in Absence</h3>
              <p className="text-slate-600 leading-relaxed">
                A friend in another city sending you coffee in your neighborhood feels intimate —
                a way to say &ldquo;I&rsquo;m with you.&rdquo;
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works - Redesigned */}
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-700 mb-4" style={{ fontFamily: 'Alegreya SC, serif' }}>
              Three simple steps to spread joy
            </h2>
            <p className="text-lg text-slate-600">
              Thoughtful gifting shouldn&rsquo;t be complicated
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <div className="text-center group">
              <div className="relative mb-8">
                <div className="w-20 h-20 bg-orange-500 rounded-full flex items-center justify-center mx-auto shadow-xl group-hover:scale-110 transition-transform duration-300 border-4 border-orange-200">
                  <span className="text-white font-bold text-2xl">1</span>
                </div>
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-yellow-400 rounded-full animate-sparkle shadow-lg border-2 border-yellow-200"></div>
              </div>
              <h3 className="text-xl font-bold mb-4 text-slate-700">Choose with heart</h3>
              <p className="text-slate-600 leading-relaxed">
                Browse locally-rooted experiences and pick something that speaks to you and your recipient.
              </p>
            </div>

            <div className="text-center group">
              <div className="relative mb-8">
                <div className="w-20 h-20 bg-slate-600 rounded-full flex items-center justify-center mx-auto shadow-xl group-hover:scale-110 transition-transform duration-300 border-4 border-slate-200">
                  <span className="text-white font-bold text-2xl">2</span>
                </div>
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-yellow-400 rounded-full animate-sparkle shadow-lg border-2 border-yellow-200" style={{ animationDelay: '0.5s' }}></div>
              </div>
              <h3 className="text-xl font-bold mb-4 text-slate-700">Send with intention</h3>
              <p className="text-slate-600 leading-relaxed">
                Complete your thoughtful gesture and share the gift. Watch as anticipation builds into delight.
              </p>
            </div>

            <div className="text-center group">
              <div className="relative mb-8">
                <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto shadow-xl group-hover:scale-110 transition-transform duration-300 border-4 border-green-200">
                  <span className="text-white font-bold text-2xl">3</span>
                </div>
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-yellow-400 rounded-full animate-sparkle shadow-lg border-2 border-yellow-200" style={{ animationDelay: '1s' }}></div>
              </div>
              <h3 className="text-xl font-bold mb-4 text-slate-700">Experience together</h3>
              <p className="text-slate-600 leading-relaxed">
                They visit their local spot, redeem with a simple scan, and feel your thoughtfulness in every sip.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Categories Section - Reimagined */}
      <section className="py-20 bg-gradient-to-br from-orange-50 via-red-50 to-yellow-50">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-700 mb-4" style={{ fontFamily: 'Alegreya SC, serif' }}>
              Curated experiences, local joy
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Each category represents moments of connection, carefully chosen to bring authentic smiles to people you care about.
            </p>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-orange-200 border-t-orange-500"></div>
              <p className="mt-4 text-slate-600">Preparing your gifting options...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {categories.map((category) => (
                category.isActive ? (
                  <Link
                    key={category._id}
                    href={`/category/${category.slug}`}
                    className="group bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 p-8 text-center border-2 border-orange-200 hover:border-orange-300 transform hover:-translate-y-2"
                  >
                    {category.imageUrl ? (
                      <div className="mb-6 overflow-hidden rounded-xl">
                        <Image
                          src={category.imageUrl}
                          alt={category.name}
                          width={80}
                          height={80}
                          className="mx-auto group-hover:scale-110 transition-transform duration-300"
                        />
                      </div>
                    ) : (
                      <div className="mb-6 w-20 h-20 bg-gradient-to-br from-orange-100 to-yellow-100 rounded-xl mx-auto flex items-center justify-center group-hover:scale-110 transition-transform duration-300 border-2 border-orange-200">
                        <span className="text-slate-700 text-3xl font-bold">{category.name.charAt(0)}</span>
                      </div>
                    )}
                    <h3 className="text-xl font-bold mb-3 text-slate-700 group-hover:text-orange-600 transition-colors duration-300">
                      {category.name}
                    </h3>
                    {category.description && (
                      <p className="text-slate-600 text-sm leading-relaxed">{category.description}</p>
                    )}
                    <div className="mt-4 text-orange-500 font-medium text-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      Explore gifts →
                    </div>
                  </Link>
                ) : (
                  <div
                    key={category._id}
                    className="bg-white rounded-2xl shadow-lg p-8 text-center border-2 border-gray-200 relative opacity-75"
                  >
                    <div className="absolute top-4 right-4 bg-green-500 text-white text-xs font-medium py-1 px-3 rounded-full">
                      Coming Soon
                    </div>
                    {category.imageUrl ? (
                      <div className="mb-6 overflow-hidden rounded-xl opacity-60">
                        <Image
                          src={category.imageUrl}
                          alt={category.name}
                          width={80}
                          height={80}
                          className="mx-auto"
                        />
                      </div>
                    ) : (
                      <div className="mb-6 w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl mx-auto flex items-center justify-center opacity-60">
                        <span className="text-gray-500 text-3xl font-bold">{category.name.charAt(0)}</span>
                      </div>
                    )}
                    <h3 className="text-xl font-bold mb-3 text-slate-700 opacity-60">{category.name}</h3>
                    {category.description && (
                      <p className="text-slate-600 text-sm leading-relaxed opacity-60">{category.description}</p>
                    )}
                  </div>
                )
              ))}
            </div>
          )}

          {!loading && categories.length === 0 && (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-orange-300">
                <span className="text-orange-500 text-2xl">☕</span>
              </div>
              <h3 className="text-xl font-bold text-slate-700 mb-2">Building something beautiful</h3>
              <p className="text-slate-600">We&rsquo;re carefully curating local experiences for you to share.</p>
            </div>
          )}
        </div>
      </section>

      {/* Call to Action - Final touch */}
      <section className="py-20 bg-gradient-to-r from-orange-100 via-yellow-100 to-green-100">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-700 mb-6" style={{ fontFamily: 'Alegreya SC, serif' }}>
            Ready to brighten someone&rsquo;s day?
          </h2>
          <p className="text-lg text-slate-600 mb-8 max-w-2xl mx-auto">
            Every small gesture creates ripples of joy. Start with a simple gift and watch how it transforms an ordinary moment into something memorable.
          </p>
          {!loading && categories.filter(cat => cat.isActive).length > 0 && (
            <Link
              href={`/category/${categories.find(cat => cat.isActive)?.slug}`}
              className="inline-block bg-orange-600 text-white! font-bold px-10 py-4 rounded-full hover:bg-orange-700 transition-all duration-300 transform hover:scale-105 shadow-xl hover:shadow-2xl border-2 border-orange-500"
            >
              Start Gifting
            </Link>
          )}
        </div>
      </section>
      <ContactForm />
    </div>
  );
}
