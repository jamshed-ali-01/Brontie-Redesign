import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import MessageTemplate from '@/models/MessageTemplate';
import Counter from '@/models/Counter';

// Counter se next template ID get karna - TRANSACTION mein
async function getNextTemplateId() {
  const session = await MessageTemplate.startSession();
  session.startTransaction();
  
  try {
    console.log('🔄 Getting next ID from counter...');
    
    // Atomic operation with transaction
    const counter = await Counter.findOneAndUpdate(
      { _id: 'templateId' },
      { $inc: { sequence_value: 1 } },
      { 
        upsert: true,
        new: true,
        session: session // Transaction mein include karo
      }
    );
    
    console.log('✅ Counter returned ID:', counter.sequence_value);
    
    await session.commitTransaction();
    return counter.sequence_value;
    
  } catch (error) {
    await session.abortTransaction();
    console.error('❌ Error in getNextTemplateId:', error);
    
    // Fallback without counter
    const lastTemplate = await MessageTemplate.findOne().sort({ templateId: -1 });
    const fallbackId = lastTemplate ? lastTemplate.templateId + 1 : 1;
    
    console.log('🔄 Using fallback ID:', fallbackId);
    return fallbackId;
  } finally {
    session.endSession();
  }
}

export async function GET() {
  try {
    await connectToDatabase();
    const templates = await MessageTemplate.find({}).sort({ displayOrder: 1 });
    return NextResponse.json(templates);
  } catch (error) {
    console.error('Error fetching message templates:', error);
    return NextResponse.json(
      { error: 'Failed to fetch message templates' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  let body: any;
  try {
    await connectToDatabase();
    body = await request.json();
    
    console.log('📝 Creating new template...');
    
    // Counter se next ID lo
    const nextTemplateId = await getNextTemplateId();
    
    console.log('🎯 Final next template ID:', nextTemplateId);
    
    // Template create karo
    const template = new MessageTemplate({
      templateId: nextTemplateId,
      title: body.title,
      image: body.image || '',
      isActive: body.isActive !== undefined ? body.isActive : true,
    });
    
    await template.save();
    
    console.log('✅ Successfully created template with ID:', template.templateId);
    
    return NextResponse.json(template, { status: 201 });
    
  } catch (error: any) {
    console.error('❌ Error creating message template:', error);
    
    if (error.code === 11000) {
      // Agar duplicate ID error aaye, to manual ID generate karo
      console.log('🔄 Duplicate ID detected, using manual ID...');
      
      const lastTemplate = await MessageTemplate.findOne().sort({ templateId: -1 });
      const manualId = lastTemplate ? lastTemplate.templateId + 1 : 1;
      
      const retryTemplate = new MessageTemplate({
        templateId: manualId,
        title: body.title,
        image: body.image || '',
        isActive: body.isActive !== undefined ? body.isActive : true,
      });
      
      await retryTemplate.save();
      return NextResponse.json(retryTemplate, { status: 201 });
    }
    
    return NextResponse.json(
      { error: 'Failed to create message template: ' + error.message },
      { status: 500 }
    );
  }
}