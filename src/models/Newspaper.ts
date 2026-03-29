import mongoose, { Schema, Document } from 'mongoose';

export interface INewspaper extends Document {
    title: string;
    content: string;
    imageUrl: string;
    imageWidth: number;
    imageHeight: number;
    isActive: boolean;
    displayOrder: number;
    createdAt: Date;
    updatedAt: Date;
}

const NewspaperSchema: Schema = new Schema(
    {
        title: { type: String, required: true },
        content: { type: String, required: true },
        imageUrl: { type: String, required: true },
        imageWidth: { type: Number, default: 661 },
        imageHeight: { type: Number, default: 441 },
        isActive: { type: Boolean, default: true },
        displayOrder: { type: Number, default: 0 },
    },
    { timestamps: true }
);

// Force schema refresh in development
if (process.env.NODE_ENV === 'development') {
    delete mongoose.models.Newspaper;
}

export default mongoose.models.Newspaper || mongoose.model<INewspaper>('Newspaper', NewspaperSchema);
