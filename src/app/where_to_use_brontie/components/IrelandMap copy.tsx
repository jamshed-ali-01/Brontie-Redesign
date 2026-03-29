// app/map/components/IrelandMap.tsx
"use client";

import { useState, useRef, useEffect } from "react";
import { Coffee, MapPin, Star, Phone, ChevronRight, ZoomIn, ZoomOut, Maximize2 } from "lucide-react";

const IrelandMap = () => {
  const [selectedCounty, setSelectedCounty] = useState<string>("Kildare");
  const [selectedCafe, setSelectedCafe] = useState<any>(null);
  const [hoveredCounty, setHoveredCounty] = useState<string | null>(null);
  const [zoom, setZoom] = useState(2.75);
  const [position, setPosition] = useState({ x: 500, y: -530 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [cafes, setCafes] = useState<any[]>([]);
  const [irelandGeoData, setIrelandGeoData] = useState<any>({ type: "FeatureCollection", features: [] });
  const [loadingCafes, setLoadingCafes] = useState(true);
  const [loadingGeoData, setLoadingGeoData] = useState(true);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  const [showTooltip, setShowTooltip] = useState(false);
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // ✅ GeoJSON file se data load karo
  useEffect(() => {
    const loadGeoJSON = async () => {
      try {
        setLoadingGeoData(true);
        const response = await fetch('/ireland-counties.json');
        const data = await response.json();
        setIrelandGeoData(data);
      } catch (error) {
        console.error("Error loading GeoJSON:", error);
      } finally {
        setLoadingGeoData(false);
      }
    };

    loadGeoJSON();
  }, []);

  // ✅ API se cafes fetch karo
  useEffect(() => {
    const fetchCafes = async () => {
      try {
        setLoadingCafes(true);
        const response = await fetch('/api/admin/merchants');
        
        if (!response.ok) {
          throw new Error(`API error: ${response.status}`);
        }
        
        const data = await response.json();
        
        let merchantsArray = [];
        
        if (Array.isArray(data)) {
          merchantsArray = data;
        } else if (data.merchantsData && Array.isArray(data.merchantsData)) {
          merchantsArray = data.merchantsData;
        } else if (data.merchants && Array.isArray(data.merchants)) {
          merchantsArray = data.merchants;
        } else if (data.data && Array.isArray(data.data)) {
          merchantsArray = data.data;
        } else {
          setCafes([]);
          return;
        }
        
        const transformedCafes = merchantsArray.map((merchant: any) => {
          return {
            id: merchant._id || merchant.id,
            name: merchant.name || "Unnamed Cafe",
            county: merchant.county || "Unknown",
            address: merchant.address ? 
              `${merchant.address.street || ''}, ${merchant.address.city || ''}`.trim() : 
              "Address not available",
            description: merchant.description || "",
            phone: merchant.contactPhone || merchant.phone || "",
            features: merchant.tags || []
          };
        });
        
        setCafes(transformedCafes);
        
      } catch (error) {
        console.error("Error fetching cafes:", error);
        setCafes([]);
      } finally {
        setLoadingCafes(false);
      }
    };

    fetchCafes();
  }, []);

  // Get cafe count for a county
  const getCafeCount = (countyName: string) => {
    return cafes.filter(cafe => cafe.county === countyName).length;
  };

  // Get color based on cafe count
  const getCountyColor = (countyName: string) => {
    const count = getCafeCount(countyName);
    
    if (selectedCounty === countyName) return "#EF4444";
    if (hoveredCounty === countyName) return "#059669";
    
    if (count > 0) return "#10B981";
    return "#94A3B8";
  };

  // Handle zoom in
  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 0.25, 4));
  };

  // Handle zoom out
  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 0.25, 0.5));
  };

  // Handle reset zoom
  const handleResetZoom = () => {
    setZoom(2);
    setPosition({ x: 0, y: 0 });
  };

  // Handle mouse down for dragging
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 0) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
    }
  };

  // Handle mouse move for dragging
  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
  };

  // Handle mouse up
  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Handle county mouse enter
  const handleCountyMouseEnter = (countyName: string, e: React.MouseEvent) => {
    setHoveredCounty(countyName);
    setShowTooltip(true);
    
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setTooltipPos({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      });
    }
  };

  // Handle county mouse leave
  const handleCountyMouseLeave = () => {
    setHoveredCounty(null);
    setShowTooltip(false);
  };

  // Handle county click
  const handleCountyClick = (countyName: string) => {
    setSelectedCounty(countyName);
    const countyCafe = cafes.find(cafe => cafe.county === countyName);
    if (countyCafe) {
      setSelectedCafe(countyCafe);
    }
  };

  const totalCafes = cafes.length;
  const countiesWithCafes = new Set(cafes.map(cafe => cafe.county)).size;
  const isLoading = loadingCafes || loadingGeoData;

  // Convert coordinates to SVG path
  const coordinatesToPath = (coords: any, index: number): string => {
    try {
      if (Array.isArray(coords[0][0][0])) {
        return coords.map((polygon: any) =>
          polygon.map((ring: any) =>
            ring.map((point: [number, number], pointIndex: number) => {
              const x = (point[0] + 8) * 50 * zoom;
              const y = (60 - point[1]) * 50 * zoom;
              return `${pointIndex === 0 ? 'M' : 'L'} ${x + position.x} ${y + position.y}`;
            }).join(' ') + ' Z'
          ).join(' ')
        ).join(' ');
      } else {
        return coords.map((ring: any) =>
          ring.map((point: [number, number], pointIndex: number) => {
            const x = (point[0] + 8) * 50 * zoom;
            const y = (60 - point[1]) * 50 * zoom;
            return `${pointIndex === 0 ? 'M' : 'L'} ${x + position.x} ${y + position.y}`;
          }).join(' ') + ' Z'
        ).join(' ');
      }
    } catch (error) {
      return "";
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-3xl shadow-2xl border border-gray-200 overflow-hidden">
        <div className="p-8 bg-gradient-to-r from-red-50 to-orange-50 border-b border-gray-200">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
                Ireland Café Network Map
              </h1>
              <p className="text-gray-600 text-lg">
                <span className="flex items-center gap-2">
                  <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-500"></span>
                  Loading map data...
                </span>
              </p>
            </div>
          </div>
        </div>
        
        <div className="p-12 flex flex-col items-center justify-center min-h-[500px]">
          <div className="animate-spin rounded-full h-20 w-20 border-b-2 border-red-500 mb-6"></div>
          <p className="text-gray-700 text-lg font-medium mb-2">Loading Ireland Map</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-3xl shadow-2xl border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="p-8 bg-gradient-to-r from-red-50 to-orange-50 border-b border-gray-200">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
              Ireland Café Network Map
            </h1>
            <p className="text-gray-600 text-lg">
              {totalCafes} partner cafés across {countiesWithCafes} counties
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
                  <div className="text-sm text-gray-600">Partner Cafés</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8 p-8">
        {/* Map Section */}
        <div className="lg:col-span-2">
          <div className="bg-gradient-to-br from-blue-50 to-green-50 rounded-2xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-red-500" />
                Interactive Ireland Map
              </h2>
              
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 bg-white rounded-lg border border-gray-300 p-1">
                  <button
                    onClick={handleZoomOut}
                    className="p-2 hover:bg-gray-100 rounded-md transition-colors"
                    title="Zoom Out"
                  >
                    <ZoomOut className="w-4 h-4 text-gray-600" />
                  </button>
                  <span className="px-2 text-sm text-gray-600 font-medium">
                    {Math.round(zoom * 100)}%
                  </span>
                  <button
                    onClick={handleZoomIn}
                    className="p-2 hover:bg-gray-100 rounded-md transition-colors"
                    title="Zoom In"
                  >
                    <ZoomIn className="w-4 h-4 text-gray-600" />
                  </button>
                  <button
                    onClick={handleResetZoom}
                    className="p-2 hover:bg-gray-100 rounded-md transition-colors ml-1 border-l border-gray-300"
                    title="Reset View"
                  >
                    <Maximize2 className="w-4 h-4 text-gray-600" />
                  </button>
                </div>
              </div>
            </div>
            
            <div 
              ref={containerRef}
              className="relative h-[550px] bg-white rounded-xl border border-gray-300 overflow-hidden"
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
            >
              <svg 
                ref={svgRef}
                width="100%" 
                height="100%" 
                viewBox="0 0 900 800"
                className="absolute inset-0"
                preserveAspectRatio="xMidYMid meet"
              >
                <rect width="900" height="800" fill="#F8FAFC" />
                
                {irelandGeoData.features?.map((feature: any, index: number) => {
                  const countyName = feature.properties?.name || `County ${index + 1}`;
                  const color = getCountyColor(countyName);
                  const isSelected = selectedCounty === countyName;
                  
                  try {
                    const pathData = coordinatesToPath(feature.geometry.coordinates, index);
                    
                    if (!pathData) return null;
                    
                    return (
                      <g key={feature.id || index}>
                        <path
                          d={pathData}
                          fill={color}
                          stroke="#FFFFFF"
                          strokeWidth={isSelected ? "3" : "1"}
                          className="cursor-pointer transition-all duration-300 hover:opacity-90"
                          onClick={() => handleCountyClick(countyName)}
                          onMouseEnter={(e) => handleCountyMouseEnter(countyName, e)}
                          onMouseLeave={handleCountyMouseLeave}
                        />
                      </g>
                    );
                  } catch (error) {
                    return null;
                  }
                })}
              </svg>

              {/* Tooltip */}
              {showTooltip && hoveredCounty && (
                <div 
                  className="absolute bg-white/95 backdrop-blur-sm rounded-xl p-4 shadow-2xl border border-gray-200 z-50 min-w-[280px] max-w-[320px]"
                  style={{
                    left: `${Math.min(tooltipPos.x + 20, 550)}px`,
                    top: `${Math.min(tooltipPos.y + 20, 450)}px`,
                  }}
                >
                  <div className="mb-3">
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-gray-900 text-lg">{hoveredCounty}</h3>
                      <span className="bg-red-500 text-white text-xs font-medium px-2.5 py-1 rounded-full">
                        {getCafeCount(hoveredCounty)} café{getCafeCount(hoveredCounty) !== 1 ? 's' : ''}
                      </span>
                    </div>
                  </div>
                  
                  {getCafeCount(hoveredCounty) > 0 ? (
                    <>
                      <div className="mb-4">
                        <p className="text-sm text-gray-600 mb-2">Featured cafes:</p>
                        <div className="space-y-3">
                          {cafes
                            .filter(cafe => cafe.county === hoveredCounty)
                            .slice(0, 3)
                            .map((cafe) => (
                              <div 
                                key={cafe.id}
                                className="flex items-start gap-3 p-2.5 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors border border-gray-100"
                                onClick={() => {
                                  setSelectedCounty(hoveredCounty);
                                  setSelectedCafe(cafe);
                                  setShowTooltip(false);
                                }}
                              >
                                <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                                  <Coffee className="w-4 h-4 text-red-500" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-gray-900 truncate">{cafe.name}</p>
                                  <p className="text-xs text-gray-500 truncate mt-0.5">{cafe.address.split(',')[0]}</p>
                                  {cafe.phone && (
                                    <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                                      <Phone className="w-3 h-3" /> {cafe.phone}
                                    </p>
                                  )}
                                </div>
                              </div>
                            ))}
                        </div>
                        
                        {getCafeCount(hoveredCounty) > 3 && (
                          <p className="text-xs text-gray-400 text-center mt-2">
                            +{getCafeCount(hoveredCounty) - 3} more cafe{getCafeCount(hoveredCounty) - 3 !== 1 ? 's' : ''}
                          </p>
                        )}
                      </div>
                      
                      {/* <button
                        onClick={() => {
                          setSelectedCounty(hoveredCounty);
                          setShowTooltip(false);
                        }}
                        className="w-full bg-red-500 hover:bg-red-600 text-white font-medium py-2.5 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
                      >
                        <Coffee className="w-4 h-4" />
                        View all cafes in {hoveredCounty}
                      </button> */}
                    </>
                  ) : (
                    <div className="text-center py-4">
                      <Coffee className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-500">No partner cafés found yet</p>
                      <p className="text-sm text-gray-400 mt-1">Check back soon for updates!</p>
                    </div>
                  )}
                </div>
              )}

              {/* Map Legend */}
              <div className="absolute bottom-4 left-4 bg-white/95 backdrop-blur-sm rounded-xl p-4 shadow-lg border border-gray-200">
                <h4 className="text-sm font-bold text-gray-900 mb-2">Legend</h4>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full bg-[#EF4444]"></div>
                    <span className="text-sm">Selected County</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full bg-[#10B981]"></div>
                    <span className="text-sm">Has Partner Cafés</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full bg-[#94A3B8]"></div>
                    <span className="text-sm">No Cafés Yet</span>
                  </div>
                </div>
              </div>

              {/* Zoom Instructions */}
              <div className="absolute top-4 left-4 bg-white/95 backdrop-blur-sm rounded-xl p-3 shadow-lg border border-gray-200">
                <div className="text-xs text-gray-600">
                  <div className="flex items-center gap-1 mb-1">
                    <span className="font-medium">Click & Drag</span> to pan
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="font-medium">Scroll</span> or use buttons to zoom
                  </div>
                </div>
              </div>

              {/* Stats Panel */}
              <div className="absolute top-4 right-4 bg-gradient-to-r from-red-500 to-orange-500 text-white rounded-xl p-4 shadow-lg">
                <div className="text-center">
                  <div className="text-3xl font-bold">{totalCafes}</div>
                  <div className="text-sm opacity-90">Partner Cafés</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Cafe Details Section */}
        <div className="lg:col-span-1">
          <div className="bg-gradient-to-b from-gray-50 to-white rounded-2xl border border-gray-200 p-6 h-full">
            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <Coffee className="w-5 h-5 text-red-500" />
              {selectedCounty ? `Cafés in ${selectedCounty}` : 'Select a County'}
            </h2>
            
            {selectedCounty && (
              <>
                <div className="mb-6 p-4 bg-gradient-to-r from-red-50 to-orange-50 rounded-xl">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-2xl font-bold text-gray-900">{selectedCounty}</div>
                      <div className="text-gray-600">
                        {getCafeCount(selectedCounty)} partner café{getCafeCount(selectedCounty) !== 1 ? 's' : ''}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-3xl font-bold text-red-500">{getCafeCount(selectedCounty)}</div>
                      <div className="text-sm text-gray-500">cafés</div>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
                  {cafes
                    .filter(cafe => cafe.county === selectedCounty)
                    .map((cafe) => (
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
                        
                        {selectedCafe?.id === cafe.id && (
                          <div className="mt-4 pt-4 border-t border-gray-200">
                            <div className="flex flex-wrap gap-2">
                              {cafe.features.map((feature: string, index: number) => (
                                <span
                                  key={index}
                                  className="px-3 py-1 bg-white border border-gray-300 text-gray-700 rounded-full text-xs font-medium"
                                >
                                  {feature}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  
                  {getCafeCount(selectedCounty) === 0 && (
                    <div className="text-center py-12">
                      <Coffee className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-500">No partner cafés found in this county</p>
                      <p className="text-sm text-gray-400 mt-2">Check back soon for updates!</p>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default IrelandMap;