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

// @desc    Auth user & get token
// @route   POST /api/users/login
export async function POST(request) {
  try {
    await dbConnect();
    const body = await request.json();
    const { email, phone, password } = body;

    // Support login with either email or phone number
    let user = null;
    if (email) {
      user = await User.findOne({ email: email.toLowerCase() });
    } else if (phone) {
      // Normalize phone number - remove spaces, dashes, and + prefix
      const normalizedPhone = phone.replace(/[\s\-\+]/g, '');
      user = await User.findOne({ phone: normalizedPhone });
    }

    if (user && (await user.matchPassword(password))) {
      return NextResponse.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        address: user.address,
        isAdmin: user.isAdmin,
        isFarmer: user.isFarmer,
        token: generateToken(user._id)
      });
    } else {
      return NextResponse.json(
        { message: 'Invalid email/phone or password' },
        { status: 401 }
      );
    }
  } catch (error) {
    return NextResponse.json(
      { message: error.message },
      { status: 500 }
    );
  }
}
