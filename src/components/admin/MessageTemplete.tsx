"use client";

import { useState } from "react";
import Image from "next/image";

export interface MessageCardType {
  _id: string;
  templateId: number;
  title: string;
  image: string;
  isActive: boolean;
  displayOrder: number;
  createdAt: string;
  updatedAt: string;
}

interface MessageCardProps {
  card: MessageCardType;
  onEdit: (card: MessageCardType) => void;
  onToggleStatus: (cardId: string, currentStatus: boolean) => void;
  onDelete?: (cardId: string) => void;
}

export default function MessageCard({
  card,
  onEdit,
  onToggleStatus,
  onDelete,
}: MessageCardProps) {
  const [imageError, setImageError] = useState(false);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-amber-100 overflow-hidden hover:shadow-lg transition-all duration-300 hover:border-amber-200">
      <div className="flex items-center">
        {/* Image Section - Smaller and on the left */}
        <div className="relative w-32 h-32 flex-shrink-0 bg-gradient-to-br from-amber-50 to-orange-50">
          {card.image && !imageError ? (
            <Image
              src={card.image}
              alt={card.title}
              fill
              className="object-cover"
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-amber-50 to-orange-50">
              <svg
                className="w-8 h-8 text-amber-400 mb-1"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              <span className="text-amber-600 text-xs font-medium">
                No Image
              </span>
            </div>
          )}
        </div>

        {/* Content Section - Horizontal Layout */}
        <div className="flex-1 p-4 flex items-center justify-between">
          {/* Left Side - Title and Date */}

          <div className="flex-1 min-w-0 pr-4">
            
              <div className="flex items-center gap-3 mb-2">
                
              <div className=" bg-amber-100 text-amber-800 font-bold px-2 py-1 rounded-full text-sm   w-[50px] flex items-cetner justify-center mb-1"> 
                # {card.displayOrder}
              </div>
              
                <h3 className="font-bold text-gray-900 text-base line-clamp-1 leading-tight">
                  {card.title}
                </h3>
                <span
                  className={`px-2 py-1 text-xs font-semibold rounded-full whitespace-nowrap ${
                    card.isActive
                      ? "bg-green-100 text-green-700 border border-green-200"
                      : "bg-red-100 text-red-700 border border-red-200"
                  }`}
                >
                  {card.isActive ? "Active" : "Inactive"}
                </span>
              </div>
            

            <div className="flex items-center text-sm text-gray-500">
              <svg
                className="w-4 h-4 mr-1 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              <span>Created: {formatDate(card.createdAt)}</span>
            </div>
          </div>

          {/* Right Side - Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => onEdit(card)}
              className="flex items-center px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors font-medium text-sm whitespace-nowrap"
            >
              <svg
                className="w-4 h-4 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                />
              </svg>
              Edit
            </button>

            <button
              onClick={() => onToggleStatus(card._id, card.isActive)}
              className={`flex items-center px-3 py-2 text-sm rounded-lg transition-colors font-medium whitespace-nowrap ${
                card.isActive
                  ? "bg-red-50 text-red-700 hover:bg-red-100 border border-red-200"
                  : "bg-green-50 text-green-700 hover:bg-green-100 border border-green-200"
              }`}
            >
              {card.isActive ? (
                <>
                  <svg
                    className="w-4 h-4 mr-1"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  Disable
                </>
              ) : (
                <>
                  <svg
                    className="w-4 h-4 mr-1"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  Enable
                </>
              )}
            </button>

            {onDelete && (
              <button
                onClick={() => onDelete(card._id)}
                className="flex items-center px-3 py-2 bg-gray-50 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors font-medium text-sm border border-gray-200 whitespace-nowrap"
              >
                <svg
                  className="w-4 h-4 mr-1"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
                Delete
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
