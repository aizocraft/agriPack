import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import dbConnect from '@/lib/db';
import Product from '@/models/Product';

// @desc    Get single product
// @route   GET /api/products/:id
export async function GET(request, { params }) {
  try {
    await dbConnect();
    
    const awaitedParams = await params;
    const id = awaitedParams.id?.trim(); 
    
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { message: 'Invalid product ID format', received: id },
        { status: 400 }
      );
    }
    
    const product = await Product.findById(id).populate('farmer', 'name email phone');
    
    if (!product) {
      return NextResponse.json(
        { message: 'Product not found', productId: id },
        { status: 404 }
      );
    }

    return NextResponse.json(product);
  } catch (error) {
    console.error('Error fetching product:', error);
    return NextResponse.json(
      { message: error.message },
      { status: 500 }
    );
  }
}

// @desc    Update a product
// @route   PUT /api/products/:id
export async function PUT(request, { params }) {
  try {
    await dbConnect();
    const awaitedParams = await params;
    const id = awaitedParams.id;
    const body = await request.json();
    
    const product = await Product.findByIdAndUpdate(
      id,
      { $set: body },
      { new: true, runValidators: true }
    );

    if (!product) {
      return NextResponse.json({ message: 'Product not found' }, { status: 404 });
    }

    return NextResponse.json(product);
  } catch (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

// @desc    Delete a product
// @route   DELETE /api/products/:id
export async function DELETE(request, { params }) {
  try {
    await dbConnect();
    const awaitedParams = await params;
    const id = awaitedParams.id;
    
    const product = await Product.findByIdAndDelete(id);
    
    if (!product) {
      return NextResponse.json({ message: 'Product not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Product removed' });
  } catch (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}