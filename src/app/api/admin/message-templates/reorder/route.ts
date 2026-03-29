// import { NextRequest, NextResponse } from "next/server";
// import { connectToDatabase } from "@/lib/mongodb";
// import MessageTemplate from "@/models/MessageTemplate"; // Your Mongoose model

// export async function PUT(request: NextRequest) {
//   try {
//     await connectToDatabase();
//     const body = await request.json();
//     const { reorderedIds } = body;

//     if (!reorderedIds || !Array.isArray(reorderedIds)) {
//       return NextResponse.json({ error: 'Invalid reorderedIds' }, { status: 400 });
//     }

//     console.log('🔄 Reordering templates:', reorderedIds);

//     // Loop karke displayOrder update karo
//     const updatePromises = reorderedIds.map((id: string, index: number) =>
//       MessageTemplate.findByIdAndUpdate(id, { displayOrder: index + 1 })
//     );

//     await Promise.all(updatePromises);

//     console.log('✅ Templates reordered successfully');
//     return NextResponse.json({ success: true });
//   } catch (error: any) {
//     console.error('❌ Error reordering templates:', error);
//     return NextResponse.json(
//       { error: 'Failed to reorder templates: ' + error.message },
//       { status: 500 }
//     );
//   }
// }
 

// PUT /api/admin/message-templates/reorder
import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import MessageTemplate from "@/models/MessageTemplate";

export async function PUT(req: NextRequest) {
  try {
    await connectToDatabase();
    const { reorderedIds } = await req.json();

    for (let i = 0; i < reorderedIds.length; i++) {
      await MessageTemplate.updateOne(
        { _id: reorderedIds[i] },
        { $set: { displayOrder: i + 1 } }
      );
    }

    return NextResponse.json({ message: "Order updated successfully" });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to update order" }, { status: 500 });
  }
}
