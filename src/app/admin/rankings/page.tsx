'use client';

import { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { Merchant } from '@/types/merchant';
import { GiftItem } from '../gift-items/page';
import { MdOutlineDragIndicator } from 'react-icons/md';

export default function RankingsPage() {
  const [merchants, setMerchants] = useState<Merchant[]>([]);
  const [selectedMerchant, setSelectedMerchant] = useState<Merchant | null>(null);
  const [giftItems, setGiftItems] = useState<GiftItem[]>([]);
  const [loadingMerchants, setLoadingMerchants] = useState(true);
  const [loadingGiftItems, setLoadingGiftItems] = useState(false);

  useEffect(() => {
    fetchMerchants();
  }, []); 
  

  const fetchMerchants = async () => {
    try {
      setLoadingMerchants(true);
      const res = await fetch('/api/admin/merchants');
      const data = await res.json();
      console.log('Merchants response:', data);
      setMerchants(data.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingMerchants(false);
    }
  };

  const fetchGiftItems = async (merchantId: string) => {
    try {
      setLoadingGiftItems(true);
      const res = await fetch(`/api/admin/merchants/${merchantId}/gift-items`);
      const data = await res.json();
      setGiftItems(data.giftItems || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingGiftItems(false);
    }
  };

  const handleMerchantSelect = (merchant: Merchant) => {
    setSelectedMerchant(merchant);
    fetchGiftItems(merchant._id);
  };

  const handleMerchantOrderChange = async (merchant: Merchant, newOrder: number) => {
    try {
      const res = await fetch(`/api/admin/merchants/${merchant._id}/update-order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ displayOrder: newOrder }),
      });
      if (res.ok) fetchMerchants();
    } catch (err) {
      console.error(err);
    }
  };

  const handleGiftItemsDragEnd = async (result: DropResult) => {
    if (!result.destination) return;
    const items = Array.from(giftItems);
    const [reordered] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reordered);

    const updatedItems = items.map((item, index) => ({ ...item, itemDisplayOrder: index + 1 }));
    setGiftItems(updatedItems);

    try {
      await fetch(`/api/admin/merchants/${selectedMerchant?._id}/update-gift-items-order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: updatedItems.map(i => ({ _id: i._id, itemDisplayOrder: i.itemDisplayOrder })) }),
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handleMerchantsDragEnd = async (result: DropResult) => {
    if (!result.destination) return;
    const items = Array.from(merchants);
    const [reordered] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reordered);

    const updatedMerchants = items.map((m, index) => ({ ...m, displayOrder: index + 1 }));
    setMerchants(updatedMerchants);

    try {
      await Promise.all(updatedMerchants.map(m =>
        fetch(`/api/admin/merchants/${m._id}/update-order`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ displayOrder: m.displayOrder }),
        })
      ));
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="p-6 flex gap-6 h-screen">
      {/* Left Panel: Merchants */}
      <div className="w-1/3 bg-gray-50 rounded shadow p-4 overflow-y-auto">
        <h2 className="text-xl font-bold mb-4">Merchants</h2>
        {loadingMerchants ? (
          <p>Loading...</p>
        ) : (
          <DragDropContext onDragEnd={handleMerchantsDragEnd}>
            <Droppable droppableId="merchants">
              {(provided) => (
                <ul {...provided.droppableProps} ref={provided.innerRef} className="space-y-2">
                  {merchants.sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0)).map((merchant, index) => (
                    <Draggable key={merchant._id} draggableId={merchant._id} index={index}>
                      {(provided, snapshot) => (
                        <li
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          className={`flex justify-between items-center p-3 rounded shadow-sm hover:shadow-md transition cursor-grab bg-white ${
                          snapshot.isDragging ? 'bg-blue-50 shadow-lg' : ''
                          }`}
                        >
                          <div className={`flex items-center gap-2 w-full`} onClick={() => handleMerchantSelect(merchant)}>
                          <MdOutlineDragIndicator className="text-gray-400" />
                          <span className={`${selectedMerchant?._id === merchant._id ? 'font-bold text-amber-600' : ''}`}>
                            {merchant.name}
                          </span>
                          </div>
                          <p className="flex items-center gap-2 text-sm text-gray-700 font-semibold">
                          Order: <span className='text-base'>{merchant.displayOrder || 0}</span>
                          </p>
                        </li>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </ul>
              )}
            </Droppable>
          </DragDropContext>
        )}
      </div>

      {/* Right Panel: Gift Items */}
      <div className="w-2/3 bg-gray-50 rounded shadow p-4 overflow-y-auto">
        <h2 className="text-xl font-bold mb-4">
          Gift Items {selectedMerchant?.name && `for ${selectedMerchant.name}`}
        </h2>
        {loadingGiftItems ? (
          <p>Loading...</p>
        ) : selectedMerchant ? (
          <DragDropContext onDragEnd={handleGiftItemsDragEnd}>
            <Droppable droppableId="giftItems">
              {(provided) => (
                <ul {...provided.droppableProps} ref={provided.innerRef} className="space-y-2">
                  {giftItems
                    .sort((a, b) => (a.itemDisplayOrder || 0) - (b.itemDisplayOrder || 0))
                    .map((item, index) => (
                      <Draggable key={item._id} draggableId={item._id} index={index}>
                        {(provided, snapshot) => (
                          <li
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps} // full item draggable
                            className={`flex justify-between items-center p-3 rounded shadow-sm bg-white hover:shadow-md transition cursor-grab ${
                              snapshot.isDragging ? 'bg-green-50 shadow-lg' : ''
                            }`}
                          >
                            <div className="flex items-center gap-2 w-full">
                              <MdOutlineDragIndicator className="text-gray-400" />
                              <span>{item.name}</span>
                            </div>
                            <p className=" flex  items-center gap-2 text-sm text-gray-700 font-semibold">Order: <span className='text-base'>
                              {item.itemDisplayOrder}</span> </p>
                          </li>
                        )}
                      </Draggable>
                    ))}
                  {provided.placeholder}
                </ul>
              )}
            </Droppable>
          </DragDropContext>
        ) : (
          <p>Select a merchant to view gift items.</p>
        )}
      </div>
    </div>
  );
}
