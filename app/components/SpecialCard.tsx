"use client";

import Image from "next/image";

export default function SpecialCard() {
  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden hover:shadow-lg transition-shadow relative z-0">
      <div className="flex flex-col sm:flex-row">
        {/* Content Area */}
        <div className="flex-1 p-6 sm:p-8">
          <div className="flex flex-col items-center text-center">
            {/* Logo - Made smaller */}
            <div className="w-48 sm:w-56 mb-6">
              <img
                src="acc_logo.png"
                alt="Art Crawl Cluj"
                className="w-full h-auto object-contain"
              />
            </div>

            {/* Description Text */}
            <div className="max-w-2xl space-y-3 text-gray-700 dark:text-gray-300">
              <p className="text-base font-medium">
                ArtCrawl Cluj e un ghid de cultură.
              </p>

              <p className="text-sm leading-relaxed">
                Publicăm un calendar care centralizează o selecție de evenimente
                de cultură contemporană. Disponibil online, oricând, gratuit.
              </p>

              <p className="text-sm leading-relaxed">
                Organizăm tururi ghidate în spații de artă și creative, care pot
                include expoziții, ateliere, street art, arhitectură, teatru,
                muzică, alte evenimente, cu focus pe creație contemporană și
                locală.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="w-full max-w-2xl mt-6 space-y-3">
              <button className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 px-6 rounded-lg transition-colors duration-200 text-sm uppercase tracking-wider">
                Rezerveaza un tur
              </button>

              <button className="w-full bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-900 dark:text-white font-bold py-3 px-6 rounded-lg transition-colors duration-200 text-sm uppercase tracking-wider border border-gray-300 dark:border-gray-600">
                Calendar evenimente
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
