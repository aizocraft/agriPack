import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Product from '@/models/Product';
import User from '@/models/User';

// @desc    Get all products
// @route   GET /api/products
export async function GET(request) {
  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const category = searchParams.get('category');
    const farmer = searchParams.get('farmer');
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 10;
    
    let query = { isActive: true };
    
    // Search functionality
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { category: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Category filter
    if (category) {
      query.category = category;
    }
    
    // Farmer filter (for farmer dashboard)
    if (farmer) {
      query.farmer = farmer;
      // Remove isActive filter for farmer dashboard to show all products
      delete query.isActive;
    }
    
    const products = await Product.find(query)
      .populate('farmer', 'name email')
      .limit(limit)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });
    
    const count = await Product.countDocuments(query);
    
    const response = NextResponse.json({
      products,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      totalProducts: count
    });
    
    // Add cache headers for faster reloads (cache for 2 minutes)
    response.headers.set('Cache-Control', 'public, s-maxage=120, stale-while-revalidate=300');
    
    return response;
  } catch (error) {
    return NextResponse.json(
      { message: error.message },
      { status: 500 }
    );
  }
}

// @desc    Create a product
// @route   POST /api/products
export async function POST(request) {
  try {
    await dbConnect();
    const body = await request.json();
    
    const product = await Product.create(body);
    const createdProduct = await product.populate('farmer', 'name email');
    
    return NextResponse.json(createdProduct, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { message: error.message },
      { status: 500 }
    );
  }
}
