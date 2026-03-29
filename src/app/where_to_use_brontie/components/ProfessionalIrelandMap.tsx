// app/map/components/ProfessionalIrelandMap.tsx
"use client";

import { useState, useEffect } from "react";
import { Coffee, MapPin, ChevronRight, Star, Clock, Phone } from "lucide-react";
import Image from "next/image";

interface Cafe {
  id: number;
  name: string;
  county: string;
  coordinates: [number, number];
  address: string;
  description: string;
  rating: number;
  openingHours: string;
  phone?: string;
  features: string[];
}

interface County {
  name: string;
  cafeCount: number;
  cafes: Cafe[];
}

const ProfessionalIrelandMap = () => {
  const [selectedCounty, setSelectedCounty] = useState<string>("Dublin");
  const [selectedCafe, setSelectedCafe] = useState<Cafe | null>(null);
  const [hoveredCounty, setHoveredCounty] = useState<string | null>(null);

  // Sample data - Replace with your actual data
  const countiesData: County[] = [
    {
      name: "Dublin",
      cafeCount: 3,
      cafes: [
        {
          id: 1,
          name: "Bewley's Café",
          county: "Dublin",
          coordinates: [-6.2603, 53.3498],
          address: "78 Grafton Street, Dublin 2",
          description: "Iconic Dublin café established in 1840, famous for its beautiful Harry Clarke stained glass windows.",
          rating: 4.5,
          openingHours: "Mon-Sat: 8:00 AM - 10:00 PM, Sun: 9:00 AM - 9:00 PM",
          phone: "+353 1 672 7720",
          features: ["WiFi", "Outdoor Seating", "Vegan Options", "Live Music"]
        },
        {
          id: 2,
          name: "Café Nero",
          county: "Dublin",
          coordinates: [-6.2650, 53.3434],
          address: "Henry Street, Dublin 1",
          description: "Modern Italian-style café serving premium coffee and pastries.",
          rating: 4.3,
          openingHours: "Daily: 7:00 AM - 10:00 PM",
          phone: "+353 1 872 3456",
          features: ["Free WiFi", "Takeaway", "Student Discount"]
        },
        {
          id: 3,
          name: "The Fumbally",
          county: "Dublin",
          coordinates: [-6.2735, 53.3358],
          address: "Fumbally Lane, Dublin 8",
          description: "Trendy café known for its specialty coffee and artisanal food.",
          rating: 4.7,
          openingHours: "Mon-Fri: 8:00 AM - 5:00 PM, Sat-Sun: 9:00 AM - 4:00 PM",
          features: ["Specialty Coffee", "Local Art", "Workspace"]
        }
      ]
    },
    {
      name: "Cork",
      cafeCount: 2,
      cafes: [
        {
          id: 4,
          name: "The English Market Café",
          county: "Cork",
          coordinates: [-8.4756, 51.8985],
          address: "English Market, Cork City",
          description: "Located in the historic English Market, offering fresh local produce and artisanal coffee.",
          rating: 4.6,
          openingHours: "Mon-Sat: 8:30 AM - 5:30 PM",
          phone: "+353 21 427 0022",
          features: ["Local Produce", "Market Dining", "Family Friendly"]
        }
      ]
    },
    {
      name: "Galway",
      cafeCount: 1,
      cafes: [
        {
          id: 5,
          name: "Café Moly",
          county: "Galway",
          coordinates: [-9.0568, 53.2738],
          address: "Shop Street, Galway",
          description: "Charming café in the heart of Galway's bustling Shop Street, perfect for people watching.",
          rating: 4.4,
          openingHours: "Daily: 7:30 AM - 11:00 PM",
          features: ["Cozy Atmosphere", "Art Exhibitions", "Book Exchange"]
        }
      ]
    },
    {
      name: "Limerick",
      cafeCount: 1,
      cafes: [
        {
          id: 6,
          name: "The Buttery Café",
          county: "Limerick",
          coordinates: [-8.6249, 52.6682],
          address: "O'Connell Street, Limerick",
          description: "Modern café with a traditional twist, known for excellent breakfast and specialty coffee.",
          rating: 4.2,
          openingHours: "Mon-Fri: 7:00 AM - 6:00 PM, Sat-Sun: 8:00 AM - 5:00 PM",
          features: ["Breakfast All Day", "Specialty Coffee", "Meeting Space"]
        }
      ]
    },
    {
      name: "Louth",
      cafeCount: 1,
      cafes: [
        {
          id: 7,
          name: "Dundalk Café",
          county: "Louth",
          coordinates: [-6.3970, 53.9941],
          address: "Market Square, Dundalk",
          description: "Family-run café offering homemade baked goods and premium Irish coffee.",
          rating: 4.5,
          openingHours: "Daily: 8:00 AM - 9:00 PM",
          phone: "+353 42 987 654",
          features: ["Homemade Pastries", "Local Art", "Pet Friendly"]
        }
      ]
    }
  ];

  const totalCafes = countiesData.reduce((sum, county) => sum + county.cafeCount, 0);

  const getCountyColor = (countyName: string) => {
    const county = countiesData.find(c => c.name === countyName);
    if (!county) return "#E5E7EB";
    
    if (selectedCounty === countyName) return "#DC2626";
    if (hoveredCounty === countyName) return "#059669";
    
    // Color based on cafe count
    if (county.cafeCount >= 3) return "#F59E0B"; // Orange
    if (county.cafeCount >= 2) return "#10B981"; // Green
    return "#3B82F6"; // Blue
  };

  return (
    <div className="bg-white rounded-3xl shadow-2xl border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="p-8 bg-gradient-to-r from-red-50 via-orange-50 to-amber-50 border-b border-gray-200">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
              Partner Cafés Across Ireland
            </h1>
            <p className="text-gray-600 text-lg">
              Discover {totalCafes} partner cafés in {countiesData.length} counties
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="bg-white rounded-xl p-4 shadow-lg">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-r from-red-500 to-orange-500 flex items-center justify-center">
                  <Coffee className="w-6 h-6 text-white" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900">{totalCafes}</div>
                  <div className="text-sm text-gray-600">Total Cafés</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid lg:grid-cols-3 gap-8 p-8">
        {/* Left Column - Map */}
        <div className="lg:col-span-2">
          <div className="bg-gradient-to-br from-blue-50 to-green-50 rounded-2xl border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-red-500" />
              Interactive Ireland Map
            </h2>
            
            {/* SVG Map */}
            <div className="relative h-[400px] bg-white rounded-xl border border-gray-300 overflow-hidden">
              {/* Ireland Outline with Counties */}
              <svg width="100%" height="100%" viewBox="0 0 600 400" className="absolute inset-0">
                {/* Background */}
                <rect width="600" height="400" fill="#F8FAFC" />
                
                {/* Ireland Island Shape */}
                <path
                  d="M100,80 Q180,50 250,70 Q320,60 380,90 Q420,140 400,200 Q370,280 300,320 Q220,350 150,320 Q100,280 80,200 Q70,140 100,80 Z"
                  fill="#EFF6FF"
                  stroke="#CBD5E1"
                  strokeWidth="2"
                />
                
                {/* Counties */}
                {countiesData.map((county, index) => {
                  // Positions for each county
                  const positions = [
                    { x: 320, y: 180, r: 35 }, // Dublin
                    { x: 180, y: 280, r: 30 }, // Cork
                    { x: 120, y: 200, r: 25 }, // Galway
                    { x: 220, y: 220, r: 25 }, // Limerick
                    { x: 350, y: 150, r: 25 }, // Louth
                  ];
                  
                  const pos = positions[index] || { x: 100, y: 100, r: 20 };
                  
                  return (
                    <g key={county.name}>
                      {/* County Circle */}
                      <circle
                        cx={pos.x}
                        cy={pos.y}
                        r={pos.r}
                        fill={getCountyColor(county.name)}
                        stroke={selectedCounty === county.name ? "#DC2626" : "#FFFFFF"}
                        strokeWidth={selectedCounty === county.name ? "4" : "3"}
                        className="cursor-pointer transition-all duration-300 hover:opacity-90"
                        onClick={() => setSelectedCounty(county.name)}
                        onMouseEnter={() => setHoveredCounty(county.name)}
                        onMouseLeave={() => setHoveredCounty(null)}
                      />
                      
                      {/* County Name */}
                      <text
                        x={pos.x}
                        y={pos.y}
                        textAnchor="middle"
                        fill="#1F2937"
                        fontSize="14"
                        fontWeight="600"
                        className="pointer-events-none"
                      >
                        {county.name}
                      </text>
                      
                      {/* Cafe Count */}
                      <text
                        x={pos.x}
                        y={pos.y + 25}
                        textAnchor="middle"
                        fill="white"
                        fontSize="16"
                        fontWeight="bold"
                        className="pointer-events-none"
                      >
                        {county.cafeCount}
                      </text>
                      
                      {/* Cafe Markers */}
                      {county.cafes.slice(0, 3).map((_, cafeIndex) => {
                        const angle = (cafeIndex * 120) * (Math.PI / 180);
                        const markerRadius = pos.r + 15;
                        const markerX = pos.x + Math.cos(angle) * markerRadius;
                        const markerY = pos.y + Math.sin(angle) * markerRadius;
                        
                        return (
                          <circle
                            key={cafeIndex}
                            cx={markerX}
                            cy={markerY}
                            r="6"
                            fill="#DC2626"
                            stroke="#FFFFFF"
                            strokeWidth="2"
                            className="animate-pulse"
                          />
                        );
                      })}
                    </g>
                  );
                })}
                
                {/* Connection Lines */}
                <path
                  d="M320,180 L350,150"
                  fill="none"
                  stroke="#94A3B8"
                  strokeWidth="2"
                  strokeDasharray="5,5"
                />
                <path
                  d="M320,180 L220,220 L180,280"
                  fill="none"
                  stroke="#94A3B8"
                  strokeWidth="2"
                  strokeDasharray="5,5"
                />
                <path
                  d="M220,220 L120,200"
                  fill="none"
                  stroke="#94A3B8"
                  strokeWidth="2"
                  strokeDasharray="5,5"
                />
              </svg>
              
              {/* Map Legend */}
              <div className="absolute bottom-4 left-4 bg-white/95 backdrop-blur-sm rounded-xl p-4 shadow-lg border border-gray-200">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full bg-[#F59E0B]"></div>
                    <span className="text-sm font-medium">3+ cafes</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full bg-[#10B981]"></div>
                    <span className="text-sm font-medium">2 cafes</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full bg-[#3B82F6]"></div>
                    <span className="text-sm font-medium">1 cafe</span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* County Selection */}
            <div className="mt-6 flex flex-wrap gap-3">
              {countiesData.map((county) => (
                <button
                  key={county.name}
                  onClick={() => setSelectedCounty(county.name)}
                  className={`px-4 py-2 rounded-lg border transition-all flex items-center gap-2 ${
                    selectedCounty === county.name
                      ? 'bg-red-500 text-white border-red-500'
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <span className="font-medium">{county.name}</span>
                  <span className={`px-2 py-0.5 rounded-full text-xs ${
                    selectedCounty === county.name
                      ? 'bg-white/20'
                      : 'bg-gray-100'
                  }`}>
                    {county.cafeCount}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column - Cafe Details */}
        <div className="lg:col-span-1">
          <div className="bg-gradient-to-b from-gray-50 to-white rounded-2xl border border-gray-200 p-6 h-full">
            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <Coffee className="w-5 h-5 text-red-500" />
              Cafés in {selectedCounty}
            </h2>
            
            {/* Selected County Stats */}
            <div className="mb-6 p-4 bg-gradient-to-r from-red-50 to-orange-50 rounded-xl">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-gray-900">{selectedCounty}</div>
                  <div className="text-gray-600">
                    {countiesData.find(c => c.name === selectedCounty)?.cafeCount || 0} partner cafés
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-red-500">
                    {countiesData.find(c => c.name === selectedCounty)?.cafeCount || 0}
                  </div>
                  <div className="text-sm text-gray-500">cafés</div>
                </div>
              </div>
            </div>
            
            {/* Cafe List */}
            <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
              {countiesData
                .find(c => c.name === selectedCounty)
                ?.cafes.map((cafe) => (
                  <div
                    key={cafe.id}
                    className={`p-4 rounded-xl border transition-all cursor-pointer ${
                      selectedCafe?.id === cafe.id
                        ? 'bg-red-50 border-red-200 shadow-lg'
                        : 'bg-white border-gray-200 hover:shadow-md'
                    }`}
                    onClick={() => setSelectedCafe(cafe)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-bold text-gray-900">{cafe.name}</h3>
                          <div className="flex items-center gap-1">
                            <Star className="w-4 h-4 text-yellow-500 fill-current" />
                            <span className="text-sm font-medium">{cafe.rating}</span>
                          </div>
                        </div>
                        <p className="text-sm text-gray-600 mb-3 line-clamp-2">{cafe.description}</p>
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <div className="flex items-center gap-1">
                            <MapPin className="w-4 h-4" />
                            <span>{cafe.address.split(',')[0]}</span>
                          </div>
                          {cafe.phone && (
                            <div className="flex items-center gap-1">
                              <Phone className="w-4 h-4" />
                              <span>{cafe.phone}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      <ChevronRight className={`w-5 h-5 text-gray-400 ml-2 ${
                        selectedCafe?.id === cafe.id ? 'text-red-500' : ''
                      }`} />
                    </div>
                    
                    {/* Features */}
                    {selectedCafe?.id === cafe.id && (
                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <div className="flex flex-wrap gap-2">
                          {cafe.features.map((feature, index) => (
                            <span
                              key={index}
                              className="px-3 py-1 bg-white border border-gray-300 text-gray-700 rounded-full text-xs font-medium"
                            >
                              {feature}
                            </span>
                          ))}
                        </div>
                        <div className="mt-3 flex items-center gap-2 text-sm text-gray-600">
                          <Clock className="w-4 h-4" />
                          <span>{cafe.openingHours}</span>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
            </div>
            
            {/* Empty State */}
            {(!countiesData.find(c => c.name === selectedCounty)?.cafes.length) && (
              <div className="text-center py-12">
                <Coffee className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No cafés found in this county</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Partnership Banner */}
      <div className="px-8 pb-8">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-8 text-white">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="md:w-2/3">
              <h3 className="text-2xl font-bold mb-4">In Partnership With Pennypop</h3>
              <p className="text-blue-100 mb-4">
                Brontie proudly partners with leading marketing agency Pennypop to bring you 
                exceptional café experiences across Ireland. Our collaboration ensures premium 
                quality and service at every location.
              </p>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                    <Coffee className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-bold">{totalCafes}+</div>
                    <div className="text-sm text-blue-200">Partner Cafés</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-bold">{countiesData.length}</div>
                    <div className="text-sm text-blue-200">Counties</div>
                  </div>
                </div>
              </div>
            </div>
            <div className="md:w-1/3 flex justify-center">
              <div className="relative">
                <div className="w-40 h-40 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                  <div className="w-32 h-32 rounded-full bg-white flex items-center justify-center p-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">Pennypop</div>
                      <div className="text-xs text-gray-600 mt-1">Marketing Partner</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfessionalIrelandMap;