"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";

export default function LandingPage() {
  const [currentSlide, setCurrentSlide] = useState(0);

  const categories = [
    { name: "Women", image: "/women.png" },
    { name: "Men", image: "/men.png" },
    { name: "Kids", image: "/kids.png" },
    { name: "Shoes", image: "/shoes.png" },
    { name: "Home", image: "/home.png" },
  ];

  // Auto-scroll carousel - move one item at a time
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % categories.length);
    }, 3000); // Change slide every 3 seconds

    return () => clearInterval(interval);
  }, [categories.length]);

  // Create extended array for infinite scrolling effect
  const getExtendedCategories = () => {
    // Add 2 items before and 3 items after for smooth infinite scrolling
    const extended = [];
    for (let i = -2; i < categories.length + 3; i++) {
      const index = ((i % categories.length) + categories.length) % categories.length;
      extended.push({ ...categories[index], key: i });
    }
    return extended;
  };
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-center">
          {/* Logo */}
          <div className="flex items-center gap-1">
            <div className="text-red-600 text-3xl font-bold">★</div>
            <h1 className="text-2xl font-bold">MirrorMirror</h1>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="bg-gradient-to-b from-amber-50 to-stone-100">
        <div className="max-w-7xl mx-auto px-4 py-12">
          <div>
            {/* Main Hero Image */}
            <div className="relative aspect-[16/7] w-full rounded-lg overflow-hidden">
              <Image
                src="/Gemini_Generated_Image_w441m5w441m5w441.png"
                alt="Speak your Style - AI is your personal stylist"
                fill
                className="object-cover"
                priority
              />
            </div>
          </div>

          {/* Featured Categories Carousel Section */}
          <div className="mt-16">
            <h2 className="text-3xl font-bold text-center mb-8 text-black">
              Featured categories
            </h2>

            {/* Carousel Container */}
            <div className="relative overflow-hidden">
              {/* Slides - Horizontal sliding carousel */}
              <div className="relative w-full max-w-5xl mx-auto">
                <div className="overflow-hidden">
                  <div
                    className="flex transition-transform duration-700 ease-in-out"
                    style={{
                      transform: `translateX(calc(-${(currentSlide + 2) * (100 / 3)}% - ${(currentSlide + 2) * 1.5}rem))`,
                    }}
                  >
                    {getExtendedCategories().map((category, index) => (
                      <div
                        key={category.key}
                        className="flex-shrink-0 px-3"
                        style={{ width: 'calc(33.333% - 1rem)' }}
                      >
                        <div className="flex flex-col items-center">
                          <div className="relative w-full aspect-square rounded-lg overflow-hidden border-2 border-gray-200 hover:border-gray-300 transition-colors cursor-pointer bg-white">
                            <Image
                              src={category.image}
                              alt={category.name}
                              fill
                              className="object-cover"
                            />
                          </div>
                          <p className="mt-4 text-base font-normal text-center text-gray-800">
                            {category.name}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Navigation Dots */}
              <div className="flex justify-center gap-2 mt-6">
                {categories.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentSlide(index)}
                    className={`w-3 h-3 rounded-full transition-all ${
                      currentSlide === index
                        ? "bg-red-600 w-8"
                        : "bg-gray-300 hover:bg-gray-400"
                    }`}
                    aria-label={`Go to slide ${index + 1}`}
                  />
                ))}
              </div>
            </div>

            {/* CTA Button Below Featured Categories */}
            <div className="flex items-center justify-center mt-12">
              <Link
                href="/mirror"
                className="bg-red-600 hover:bg-red-700 text-white font-medium px-12 py-4 rounded-md shadow-lg transition-all transform hover:scale-105"
              >
                Try Mirror Mirror
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
