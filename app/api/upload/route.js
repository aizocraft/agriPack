import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

// Helper function to get user from token
async function getUserFromToken(request) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '');
  if (!token) return null;

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'agripack_secret_key');
    return decoded.id;
  } catch (error) {
    return null;
  }
}

// @desc    Upload image
// @route   POST /api/upload
export async function POST(request) {
  try {
    const userId = await getUserFromToken(request);
    
    if (!userId) {
      return NextResponse.json(
        { message: 'Not authorized' },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('image');

    if (!file) {
      return NextResponse.json(
        { message: 'No file uploaded' },
        { status: 400 }
      );
    }

    // Convert file to base64
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64 = buffer.toString('base64');
    const mimeType = file.type;
    
    // Create data URL
    const dataUrl = `data:${mimeType};base64,${base64}`;

    return NextResponse.json({ 
      imageUrl: dataUrl,
      message: 'Image uploaded successfully'
    }, { status: 201 });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { message: error.message },
      { status: 500 }
    );
  }
}
