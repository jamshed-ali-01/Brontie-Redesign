"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

interface VoucherMessageRow {
  _id: string;
  createdAt: string;
  senderName?: string;
  recipientName?: string;
  merchantName?: string;
  giftItemName?: string;
  amount?: number;
  message?: string;
  messageCardId?: string;
}

// Static message cards data - same as product page
const MESSAGE_CARDS = [
  {
    id: "1",
    image: "/images/pngs/message-card-one.png",
    title: "Hope this cheers you up",
  },
  {
    id: "2",
    image: "/images/pngs/message-card-two.png",
    title: "Thanks a Latte",
  },
  { id: "3", image: "/images/pngs/message-card-three.png", title: "Congrats" },
  {
    id: "4",
    image: "/images/pngs/message-card-four.png",
    title: "Thanks a Million",
  },
  {
    id: "5",
    image: "/images/pngs/message-card-five.png",
    title: "Sound for the Help",
  },
  {
    id: "6",
    image: "/images/pngs/message-card-six.png",
    title: "Happy Birthday",
  },
  {
    id: "7",
    image: "/images/pngs/message-card-seven.png",
    title: "Coach Thanks a Million",
  },
  {
    id: "8",
    image: "/images/pngs/message-card-eight.png",
    title: "Miss you Coffee Soon?",
  },
  {
    id: "9",
    image: "/images/pngs/message-card-nine.png",
    title: "Just Because 🙂",
  },
];
 
type MessageTemplate = {
  _id: string;
  templateId: number;
  title: string;
  image: string;
  isActive: boolean;
  displayOrder: number;
};

// Helper function to get card data by ID


export default function AdminMessagesPage() {
  const [rows, setRows] = useState<VoucherMessageRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [messageTemplates, setMessageTemplates] = useState<MessageTemplate[]>([]);

useEffect(() => {
  const fetchMessageTemplates = async () => {
    try {
      const res = await fetch('/api/messages');
      const json = await res.json();

      if (json.success) {
        setMessageTemplates(json.data);
      }
    } catch (err) {
      console.error('Failed to fetch message templates', err);
    }
  }; 

  fetchMessageTemplates();
}, []);

const getMessageCardData = (cardId: string) => {
  const card = messageTemplates.find((card) => card._id === cardId);
  
  if (card) {
    return card;
  }
  
  // Fallback to MESSAGE_CARDS if not found in messageTemplates
  const messageCard = MESSAGE_CARDS.find((card) => card.id === cardId);
  if (messageCard) {
    return {
      _id: messageCard.id,
      templateId: parseInt(messageCard.id),
      title: messageCard.title,
      image: messageCard.image,
      isActive: true,
      displayOrder: parseInt(messageCard.id),
    };
  }
  
  return null;
};


  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const res = await fetch("/api/admin/messages");
        if (!res.ok) throw new Error("Failed to fetch messages");
        const data = await res.json();
        setRows(data?.messages || []);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-amber-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-4">
        Voucher Messages
      </h1>
      <div className="bg-white rounded-lg shadow-sm overflow-hidden border border-amber-100">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-amber-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Date
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Sender
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Recipient
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Merchant
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Gift
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Amount
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Message
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Card Template
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {rows.length === 0 ? (
              <tr>
                <td className="px-4 py-4 text-center text-gray-500" colSpan={8}>
                  No messages found
                </td>
              </tr>
              
            ) : (
              rows.map((r) => {
                const cardData = r.messageCardId
                  ? getMessageCardData(r.messageCardId)
                  : null;

                return (
                  <tr key={r._id}>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {new Date(r.createdAt).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-sm">{r.senderName || "—"}</td>
                    <td className="px-4 py-3 text-sm">
                      {r.recipientName || "—"}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {r.merchantName || "—"}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {r.giftItemName || "—"}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {typeof r.amount === "number"
                        ? `€${r.amount.toFixed(2)}`
                        : "—"}
                    </td>
                    <td className="px-4 py-3 text-sm max-w-[420px] break-words">
                      {r.message || "—"}
                    </td>
                <td className="px-4 py-3 text-sm">
  {cardData ? (
    <div className="flex items-start gap-3">
      <div className="relative w-20 h-20 rounded-xl overflow-hidden border-2 border-gray-200 shadow-md flex-shrink-0">
        <Image
          src={cardData.image}
          alt={cardData.title}
          fill
          className="object-cover hover:scale-105 transition-transform duration-200"
        />
      </div>
      <div className="flex flex-col justify-center min-h-20">
        <span className="text-sm font-medium text-gray-900 leading-tight">
          {cardData.title}
        </span>
      </div>
    </div>
  ) : (
    <div className="flex items-center justify-center h-20">
      <span className="text-gray-400 text-sm bg-gray-50 px-3 py-2 rounded-lg border border-gray-200">
        Not Selected
      </span>
    </div>
  )}
</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
