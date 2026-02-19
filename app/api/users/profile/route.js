import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import dbConnect from '@/lib/db';
import User from '@/models/User';

// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'agripack_secret_key', {
    expiresIn: '30d'
  });
};

// Helper function to get user from token
async function getUserFromToken(request) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '');
  if (!token) return null;

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'agripack_secret_key');
    const user = await User.findById(decoded.id).select('-password');
    return user;
  } catch (error) {
    return null;
  }
}

// @desc    Get user profile
// @route   GET /api/users/profile
export async function GET(request) {
  try {
    await dbConnect();
    const user = await getUserFromToken(request);
    
    if (!user) {
      return NextResponse.json(
        { message: 'Not authorized' },
        { status: 401 }
      );
    }

    return NextResponse.json(user);
  } catch (error) {
    return NextResponse.json(
      { message: error.message },
      { status: 500 }
    );
  }
}

// @desc    Update user profile
// @route   PUT /api/users/profile
export async function PUT(request) {
  try {
    await dbConnect();
    const user = await getUserFromToken(request);
    
    if (!user) {
      return NextResponse.json(
        { message: 'Not authorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    
    const updatedUser = await User.findByIdAndUpdate(
      user._id,
      { $set: body },
      { new: true, runValidators: true }
    ).select('-password');

    return NextResponse.json(updatedUser);
  } catch (error) {
    return NextResponse.json(
      { message: error.message },
      { status: 500 }
    );
  }
}
