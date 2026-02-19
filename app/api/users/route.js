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

// @desc    Register new user
// @route   POST /api/users
export async function POST(request) {
  try {
    await dbConnect();
    const body = await request.json();
    const { name, email, password, phone, address, isFarmer } = body;

    const userExists = await User.findOne({ email });
    if (userExists) {
      return NextResponse.json(
        { message: 'User already exists' },
        { status: 400 }
      );
    }

    const user = await User.create({
      name,
      email,
      password,
      phone,
      address,
      isFarmer: isFarmer || false
    });

    if (user) {
      return NextResponse.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        address: user.address,
        isAdmin: user.isAdmin,
        isFarmer: user.isFarmer,
        token: generateToken(user._id)
      }, { status: 201 });
    }
  } catch (error) {
    return NextResponse.json(
      { message: error.message },
      { status: 500 }
    );
  }
}

// @desc    Get all users
// @route   GET /api/users
export async function GET(request) {
  try {
    await dbConnect();
    const users = await User.find({}).select('-password');
    return NextResponse.json(users);
  } catch (error) {
    return NextResponse.json(
      { message: error.message },
      { status: 500 }
    );
  }
}
