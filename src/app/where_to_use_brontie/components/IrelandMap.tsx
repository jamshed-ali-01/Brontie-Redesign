// app/map/components/IrelandMap.tsx
"use client";

import { useState, useRef, useEffect } from "react";
import { Coffee } from "lucide-react";
import { Lobster } from "next/font/google";

const lobster = Lobster({
  subsets: ["latin"],
  weight: ["400"],
});

const IrelandMap = () => {
  const [isMobile, setIsMobile] = useState(false);
  const [selectedCounty, setSelectedCounty] = useState<string>("Kildare");
  const [hoveredCounty, setHoveredCounty] = useState<string | null>(null);
  const [zoom, setZoom] = useState(2.75);
  const [position, setPosition] = useState({ x: 500, y: -530 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [cafes, setCafes] = useState<any[]>([]);
  const [irelandGeoData, setIrelandGeoData] = useState<any>({
    type: "FeatureCollection",
    features: [],
  });
  const [loadingCafes, setLoadingCafes] = useState(true);
  const [loadingGeoData, setLoadingGeoData] = useState(true);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  const [showTooltip, setShowTooltip] = useState(false);

  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  /* ---------------- Mobile detect ---------------- */
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 640);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  useEffect(() => {
    if (isMobile) {
      setZoom(4);
      setPosition({ x: 500, y: -930 });
    } else {
      setZoom(2.75);
      setPosition({ x: 500, y: -530 });
    }
  }, [isMobile]);

  /* ---------------- GeoJSON ---------------- */
  useEffect(() => {
    const loadGeoJSON = async () => {
      try {
        setLoadingGeoData(true);
        const response = await fetch("/ireland-counties.json");
        const data = await response.json();
        setIrelandGeoData(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingGeoData(false);
      }
    };
    loadGeoJSON();
  }, []);

  /* ---------------- Cafes ---------------- */
  useEffect(() => {
    const fetchCafes = async () => {
      try {
        setLoadingCafes(true);
        const response = await fetch("/api/admin/merchants");
        if (!response.ok) throw new Error("API error");

        const data = await response.json();

        let merchantsArray: any[] = [];
        if (Array.isArray(data)) merchantsArray = data;
        else if (Array.isArray(data.merchantsData))
          merchantsArray = data.merchantsData;
        else if (Array.isArray(data.merchants))
          merchantsArray = data.merchants;
        else if (Array.isArray(data.data)) merchantsArray = data.data;

        // const transformed = merchantsArray.map((merchant: any) => ({
        //   id: merchant._id || merchant.id,
        //   name: merchant.name || "Unnamed Cafe",
        //   county: merchant.county || "Unknown",
        //   address: merchant.address
        //     ? `${merchant.address.street || ""}, ${
        //         merchant.address.city || ""
        //       }`.trim()
        //     : "Address not available",
        //   description: merchant.description || "",
        //   phone: merchant.contactPhone || merchant.phone || "",
        //   features: merchant.tags || [],
        //   locations: merchant.locations || [],
        // }));
        const transformed = merchantsArray.flatMap((merchant: any) =>
          (merchant.locations || []).map((loc: any) => ({
            id: `${merchant._id}-${loc._id}`,
            merchantId: merchant._id,
            merchantName: merchant.name,
            locationName: loc.name,
            area: loc.area || "",
            county: loc.county,
            address: loc.address,
            phone: loc.phoneNumber || merchant.contactPhone || "",
          }))
        );


        setCafes(transformed);
      } catch (err) {
        console.error(err);
        setCafes([]);
      } finally {
        setLoadingCafes(false);
      }
    };
    fetchCafes();
  }, []);

  // const getCafeCount = (county: string) =>
  //   cafes.filter((c) => c.county === county).length;
  const getCafeCount = (county: string) =>
    cafes.filter(c => c.county === county).length;

  const groupByMerchant = (locations: any[]) => {
    console.log(locations);
    return locations.reduce((acc: any, loc: any) => {
      if (!acc[loc.merchantId]) {
        acc[loc.merchantId] = {
          merchantName: loc.merchantName,
          locations: [],
        };
      }

      acc[loc.merchantId].locations.push(loc);
      return acc;
    }, {});
  };


  const getCountyColor = (county: string) => {
    if (hoveredCounty === county) return "#059669";
    if (getCafeCount(county) > 0) return "#10B981";
    return "#DBDBDB";
  };

  /* ---------------- Drag (unchanged) ---------------- */
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 0) {
      setIsDragging(true);
      setDragStart({
        x: e.clientX - position.x,
        y: e.clientY - position.y,
      });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    }
  };

  const handleMouseUp = () => setIsDragging(false);

  /* ---------------- Tooltip handlers ---------------- */
  const handleCountyMouseEnter = (county: string, e: React.MouseEvent) => {
    setHoveredCounty(county);
    setShowTooltip(true);

    if (containerRef.current && !isMobile) {
      const rect = containerRef.current.getBoundingClientRect();
      setTooltipPos({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
    }
  };

  const handleCountyMouseLeave = () => {
    if (!isMobile) {
      setHoveredCounty(null);
      setShowTooltip(false);
    }
  };

  /* ---------------- Path generator (UNCHANGED) ---------------- */
  const coordinatesToPath = (coords: any): string => {
    try {
      if (Array.isArray(coords[0][0][0])) {
        return coords
          .map((polygon: any) =>
            polygon
              .map(
                (ring: any) =>
                  ring
                    .map((point: [number, number], i: number) => {
                      const x = (point[0] + 8) * 30 * zoom;
                      const y = (60 - point[1]) * 50 * zoom;
                      return `${i === 0 ? "M" : "L"} ${x + position.x} ${y + position.y
                        }`;
                    })
                    .join(" ") + " Z"
              )
              .join(" ")
          )
          .join(" ");
      }

      return coords
        .map(
          (ring: any) =>
            ring
              .map((point: [number, number], i: number) => {
                const x = (point[0] + 8) * 50 * zoom;
                const y = (60 - point[1]) * 50 * zoom;
                return `${i === 0 ? "M" : "L"} ${x + position.x} ${y + position.y
                  }`;
              })
              .join(" ") + " Z"
        )
        .join(" ");
    } catch {
      return "";
    }
  };

  if (loadingCafes || loadingGeoData) {
    return (
      <div className="min-h-[500px] flex items-center justify-center">
        <div className="animate-spin h-16 w-16 border-b-2 border-red-500 rounded-full" />
      </div>
    );
  }

  return (
    <div
      className={`${lobster.className} bg-[#FDF5EA] rounded-3xl shadow-lg border border-gray-200`}
    >
      <div
        ref={containerRef}
        className="relative h-[450px] sm:h-[520px] lg:h-[650px]  "
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <svg width="100%" height="100%" viewBox="90 65 900 650">
          <rect width="900" height="800" fill="#FDF5EA" />

          {irelandGeoData.features.map((feature: any, index: number) => {
            const countyName =
              feature.properties?.name ||
              feature.properties?.NAME_1 ||
              feature.properties?.NAME_0 ||
              `County ${index + 1}`;

            const pathData = coordinatesToPath(
              feature.geometry.coordinates
            );
            if (!pathData) return null;

            return (
              <path
                key={index}
                d={pathData}
                fill={getCountyColor(countyName)}
                stroke="#fff"
                strokeWidth={selectedCounty === countyName ? 3 : 2}
                onMouseEnter={
                  !isMobile
                    ? (e) => handleCountyMouseEnter(countyName, e)
                    : undefined
                }
                onMouseLeave={
                  !isMobile ? handleCountyMouseLeave : undefined
                }
                onClick={() => {
                  setSelectedCounty(countyName);
                  setHoveredCounty(countyName);
                  setShowTooltip(true);
                }}
                className="cursor-pointer transition-opacity hover:opacity-90"
              />
            );
          })}
        </svg>

        {/* ---------------- Tooltip (DATA RESTORED) ---------------- */}
        {showTooltip && hoveredCounty && (
          <div
            className={`absolute bg-white rounded-xl p-4 shadow-xl border border-gray-200
              ${isMobile
                ? "left-1/2 bottom-4 -translate-x-1/2 w-[90%]"
                : "min-w-[280px]"
              }`}
            style={
              !isMobile
                ? {
                  left: Math.min(tooltipPos.x + 20, 550),
                  top: Math.min(tooltipPos.y + 20, 450),
                }
                : {}
            }
          >
            {isMobile && (
              <button
                onClick={() => {
                  setHoveredCounty(null);
                  setShowTooltip(false);
                }}
                className="absolute top-2 right-3 text-gray-400 text-xl"
              >
                ×
              </button>
            )}

            <div className="flex items-center gap-3 mb-3">
              <div className="bg-[#F4C24D] rounded-full size-10 flex items-center justify-center">
                <Coffee color="white" />
              </div>
              <h3 className="text-2xl text-gray-900">
                County {hoveredCounty}
              </h3>
            </div>

            {getCafeCount(hoveredCounty) > 0 ? (
              (() => {
                const countyLocations = cafes.filter(
                  (c) => c.county === hoveredCounty
                );

                const grouped = groupByMerchant(countyLocations);

                return Object.entries(grouped).map(
                  ([merchantId, merchant]: any) => (
                    <div key={merchantId} className="mb-4">
                      {/* Merchant name – ONLY ONCE */}
                      <h4 className="text-[#388A91] text-lg mb-1">
                        {merchant.merchantName}
                      </h4>

                      {/* Locations list */}
                      {merchant.locations.map((loc: any) => (
                         
                        <p
                          key={loc.id}
                          className="text-sm text-gray-700 ml-2"
                        >
                          • {loc.locationName}  {loc.area && `- ${loc.area}`}
                        </p>
                      ))}
                    </div>
                  )
                );
              })()
            ) : (
              <p className="text-gray-500">
                No partner cafés found yet
              </p>
            )}
          </div>
        )}

        {/* Map Legend */}
        <div className="absolute top-4 left-4 bg-white/95 backdrop-blur-sm rounded-xl p-4 shadow-lg border border-gray-200">
          <h4 className="text-sm font-bold text-gray-900 mb-2">Legend</h4>
          <div className="space-y-2">

            <div className="flex items-center gap-2">
              <div className="md:size-4 size-2 rounded-full bg-[#10B981]"></div>
              <span className="md:text-sm text-xs"> Cafes available</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="md:size-4 size-2 rounded-full bg-[#DBDBDB]"></div>
              <span className="md:text-sm text-xs"> Coming soon</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IrelandMap;
