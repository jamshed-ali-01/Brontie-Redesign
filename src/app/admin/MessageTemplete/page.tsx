"use client";

import { useState, useEffect } from "react";
import MessageCard, {
  MessageCardType,
} from "@/components/admin/MessageTemplete";
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from "@hello-pangea/dnd";

export default function MessageTempletePage() {
  const [cards, setCards] = useState<MessageCardType[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingCard, setEditingCard] = useState<MessageCardType | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    image: "",
    isActive: true,
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchCards();
  }, []);

  // const onDragEnd = async (result: any) => {
  //   if (!result.destination) return;

  //   const items = Array.from(cards);
  //   const [reorderedItem] = items.splice(result.source.index, 1);
  //   items.splice(result.destination.index, 0, reorderedItem);

  //   setCards(items);

  //   try {
  //     const reorderedIds = cards.map((card) => card._id);

  //     // await fetch("/api/admin/message-templates/reorder", {
  //     //   method: "PUT",
  //     //   headers: { "Content-Type": "application/json" },
  //     //   body: JSON.stringify({ reorderedIds }),
  //     // });

  //     // const reorderedIds = items.map((item) => item._id);
  //     const response = await fetch("/api/admin/message-templates/reorder", {
  //       method: "PUT",
  //       headers: { "Content-Type": "application/json" },
  //       body: JSON.stringify({ reorderedIds }),
  //     });

  //     if (!response.ok) throw new Error("Failed to save order");
  //     // optional: show success toast
  //   } catch (error: any) {
  //     console.error(error);
  //     alert(error.message || "Failed to reorder templates");
  //   }
  // };

  // API se data fetch karna
 
//  const onDragEnd = async (result: DropResult) => {
//   if (!result.destination) return;

//   const items = Array.from(cards);
//   const [reorderedItem] = items.splice(result.source.index, 1);
//   items.splice(result.destination.index, 0, reorderedItem);

//   // Frontend me order update
//   setCards(items);

//   try {
//     // Yahan items ka use karo, na ki old cards state
//     const reorderedIds = items.map((card) => card._id);

//     const response = await fetch("/api/admin/message-templates/reorder", {
//       method: "PUT",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify({ reorderedIds }),
//     });

//     if (!response.ok) throw new Error("Failed to save order");
//   } catch (error: any) {
//     console.error(error);
//     alert(error.message || "Failed to reorder templates");
//   }
// };

const onDragEnd = async (result: DropResult) => {
  if (!result.destination) return;

  const items = Array.from(cards);
  const [reorderedItem] = items.splice(result.source.index, 1);
  items.splice(result.destination.index, 0, reorderedItem);

  // frontend me displayOrder update karo
  const updatedItems = items.map((item, index) => ({
    ...item,
    displayOrder: index + 1, // 1-based index
  }));

  setCards(updatedItems);

  try {
    const reorderedIds = updatedItems.map((card) => card._id);

    const response = await fetch("/api/admin/message-templates/reorder", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reorderedIds }),
    });

    if (!response.ok) throw new Error("Failed to save order");
  } catch (error: any) {
    console.error(error);
    alert(error.message || "Failed to reorder templates");
  }
};


  const fetchCards = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/admin/message-templates");

      if (!response.ok) {
        throw new Error(`Failed to fetch cards: ${response.status}`);
      }

      const data = await response.json();
      console.log(data);

      setCards(data);
    } catch (error) {
      console.error("Error fetching cards:", error);
      alert("Failed to load message templates");
    } finally {
      setLoading(false);
    }
  };

  // Image upload function
  const uploadImage = async (file: File): Promise<string> => {
    const uploadFormData = new FormData();
    uploadFormData.append("image", file);

    const response = await fetch("/admin/upload", {
      method: "POST",
      body: uploadFormData,
    });

    if (!response.ok) {
      throw new Error("Image upload failed");
    }

    const data = await response.json();
    return data.imageUrl;
  };

  // New card add karna
  const handleAddCard = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setUploading(true);
      let imageUrl = formData.image;

      // Agar image file hai to upload karo
      if (imageFile) {
        imageUrl = await uploadImage(imageFile);
      }

      const response = await fetch("/api/admin/message-templates", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: formData.title,
          image: imageUrl,
          isActive: formData.isActive,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to add template");
      }

      await fetchCards();
      setShowAddModal(false);
      resetForm();
      //   alert('Message template added successfully!');
    } catch (error: any) {
      console.error("Error adding template:", error);
      alert(error.message || "Failed to add template");
    } finally {
      setUploading(false);
    }
  };

  // Card edit karna
  const handleEditCard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCard) return;

    try {
      setUploading(true);
      let imageUrl = formData.image;

      // Agar naya image file hai to upload karo
      if (imageFile) {
        imageUrl = await uploadImage(imageFile);
      }

      const response = await fetch(
        `/api/admin/message-templates/${editingCard._id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            title: formData.title,
            image: imageUrl,
            isActive: formData.isActive,
          }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update template");
      }

      await fetchCards();
      setShowEditModal(false);
      setEditingCard(null);
      resetForm();
      //   alert('Message template updated successfully!');
    } catch (error: any) {
      console.error("Error updating template:", error);
      alert(error.message || "Failed to update template");
    } finally {
      setUploading(false);
    }
  };

  // Card status toggle karna
  const handleToggleStatus = async (cardId: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/admin/message-templates/${cardId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          isActive: !currentStatus,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update template status");
      }

      await fetchCards();
    } catch (error: any) {
      console.error("Error updating template status:", error);
      alert(error.message || "Failed to update template status");
    }
  };

  // Card delete karna
  const handleDeleteCard = async (cardId: string) => {
    if (!confirm("Are you sure you want to delete this template?")) return;

    try {
      const response = await fetch(`/api/admin/message-templates/${cardId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete template");
      }

      await fetchCards();
      //   alert('Message template deleted successfully!');
    } catch (error: any) {
      console.error("Error deleting template:", error);
      alert(error.message || "Failed to delete template");
    }
  };

  const openEditModal = (card: MessageCardType) => {
    setEditingCard(card);
    setFormData({
      title: card.title,
      image: card.image,
      isActive: card.isActive,
    });
    setImageFile(null);
    setShowEditModal(true);
  };

  const resetForm = () => {
    setFormData({
      title: "",
      image: "",
      isActive: true,
    });
    setImageFile(null);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // File size check (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert("Image size should be less than 5MB");
        return;
      }

      setImageFile(file);
      // Preview ke liye temporary URL banao
      const imageUrl = URL.createObjectURL(file);
      setFormData((prev) => ({ ...prev, image: imageUrl }));
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-600"></div>
      </div>
    );
  }

  return (
    <div className="py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Message Templates
          </h1>
          <p className="text-gray-600 mt-2">
            Create and manage your message templates with images
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center px-6 py-3 bg-amber-600 text-white rounded-xl hover:bg-amber-700 transition-colors font-semibold shadow-sm"
        >
          <svg
            className="w-5 h-5 mr-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4v16m8-8H4"
            />
          </svg>
          Add New Template
        </button>
      </div>

      {/* Cards Grid */}
      {cards.length === 0 ? (
        <div className="text-center py-16 bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl border-2 border-dashed border-amber-200">
          <div className="max-w-md mx-auto">
            <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg
                className="w-10 h-10 text-amber-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z"
                />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">
              No templates yet
            </h3>
            <p className="text-gray-600 mb-8">
              Create your first message template to get started
            </p>
            <button
              onClick={() => setShowAddModal(true)}
              className="px-8 py-3 bg-amber-600 text-white rounded-xl hover:bg-amber-700 transition-colors font-semibold shadow-sm"
            >
              Create Your First Template
            </button>
          </div>
        </div>
      ) : (
        // <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        //   {cards.map((card) => (
        //     <MessageCard
        //       key={card._id}
        //       card={card}
        //       onEdit={openEditModal}
        //       onToggleStatus={handleToggleStatus}
        //       onDelete={handleDeleteCard}
        //     />
        //   ))}
        // </div>

        <DragDropContext onDragEnd={onDragEnd}>
          <Droppable droppableId="templates">
            {(provided) => (
              <div {...provided.droppableProps} ref={provided.innerRef}>
                {cards.map((card: any, index: any) => (
                    <Draggable
                      key={card._id}
                      draggableId={card._id}
                      index={index}
                    >
                      {(provided) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                        >
                          <MessageCard
                            key={card._id}
                            card={card}
                            onEdit={openEditModal}
                            onToggleStatus={handleToggleStatus}
                            onDelete={handleDeleteCard}
                          />
                        </div>
                      )}
                    </Draggable>
                  ))}

                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      )}

      {/* Add Card Modal */}
      {showAddModal && (
        <CardModal
          title="Add New Message Template"
          formData={formData}
          imageFile={imageFile}
          onFormDataChange={setFormData}
          onImageChange={handleImageChange}
          onSubmit={handleAddCard}
          onClose={() => {
            setShowAddModal(false);
            resetForm();
          }}
          loading={uploading}
        />
      )}

      {/* Edit Card Modal */}
      {showEditModal && editingCard && (
        <CardModal
          title="Edit Message Template"
          formData={formData}
          imageFile={imageFile}
          onFormDataChange={setFormData}
          onImageChange={handleImageChange}
          onSubmit={handleEditCard}
          onClose={() => {
            setShowEditModal(false);
            setEditingCard(null);
            resetForm();
          }}
          isEdit={true}
          loading={uploading}
        />
      )}
    </div>
  );
}

// Modal Component
interface CardModalProps {
  title: string;
  formData: { title: string; image: string; isActive: boolean };
  imageFile: File | null;
  onFormDataChange: (data: any) => void;
  onImageChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSubmit: (e: React.FormEvent) => void;
  onClose: () => void;
  isEdit?: boolean;
  loading?: boolean;
}

function CardModal({
  title,
  formData,
  imageFile,
  onFormDataChange,
  onImageChange,
  onSubmit,
  onClose,
  isEdit = false,
  loading = false,
}: CardModalProps) {
  return (
    <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto shadow-xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            disabled={loading}
          >
            <svg
              className="w-5 h-5 text-gray-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <form onSubmit={onSubmit}>
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Template Title *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) =>
                onFormDataChange({ ...formData, title: e.target.value })
              }
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-black transition-colors"
              required
              disabled={loading}
              placeholder="Enter a descriptive title..."
            />
          </div>

          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Template Image {!isEdit && "(Optional)"}
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-xl p-4 transition-colors hover:border-amber-400">
              <input
                type="file"
                accept="image/*"
                onChange={onImageChange}
                className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-amber-50 file:text-amber-700 hover:file:bg-amber-100"
                disabled={loading}
              />
              <p className="text-xs text-gray-500 mt-2">
                PNG, JPG, GIF up to 5MB
              </p>
            </div>

            {formData.image && (
              <div className="mt-4">
                <p className="text-sm font-medium text-gray-700 mb-2">
                  Image Preview:
                </p>
                <div className="relative h-48 bg-gray-100 rounded-xl overflow-hidden border border-gray-200">
                  <img
                    src={formData.image}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            )}
          </div>

          <div className="mb-8">
            <label className="flex items-center space-x-3 p-3 bg-gray-50 rounded-xl border border-gray-200">
              <input
                type="checkbox"
                checked={formData.isActive}
                onChange={(e) =>
                  onFormDataChange({ ...formData, isActive: e.target.checked })
                }
                className="w-5 h-5 text-amber-600 rounded focus:ring-amber-500"
                disabled={loading}
              />
              <div>
                <span className="text-sm font-semibold text-gray-700">
                  Active Template
                </span>
                <p className="text-xs text-gray-500 mt-1">
                  When active, this template will be available for use
                </p>
              </div>
            </label>
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors font-medium disabled:opacity-50"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-3 bg-amber-600 text-white rounded-xl hover:bg-amber-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              disabled={loading}
            >
              {loading && (
                <svg
                  className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
              )}
              {isEdit ? "Update Template" : "Create Template"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
