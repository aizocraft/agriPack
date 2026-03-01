import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import dbConnect from '@/lib/db';
import Order from '@/models/Order';

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

// @desc    Get order by ID
// @route   GET /api/orders/:id
export async function GET(request, { params }) {
  try {
    await dbConnect();
    // Await params in Next.js 15+
    const { id } = await params;
    const order = await Order.findById(id)
      .populate('user', 'name email phone')
      .populate('orderItems.product', 'name image');

    if (!order) {
      return NextResponse.json(
        { message: 'Order not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(order);
  } catch (error) {
    return NextResponse.json(
      { message: error.message },
      { status: 500 }
    );
  }
}

// @desc    Update order status
// @route   PUT /api/orders/:id
export async function PUT(request, { params }) {
  try {
    await dbConnect();
    // Await params in Next.js 15+
    const { id } = await params;
    const body = await request.json();
    const { status, notes, isPaid } = body;

    const order = await Order.findById(id);

    if (!order) {
      return NextResponse.json(
        { message: 'Order not found' },
        { status: 404 }
      );
    }

    if (status) order.status = status;
    if (notes) order.notes = notes;
    if (isPaid !== undefined) {
      order.isPaid = isPaid;
      if (isPaid) order.paidAt = new Date();
    }
    if (status === 'delivered') {
      order.isDelivered = true;
      order.deliveredAt = new Date();
    }

    const updatedOrder = await order.save();
    return NextResponse.json(updatedOrder);
  } catch (error) {
    return NextResponse.json(
      { message: error.message },
      { status: 500 }
    );
  }
}

// @desc    Cancel order
// @route   DELETE /api/orders/:id
export async function DELETE(request, { params }) {
  try {
    await dbConnect();
    // Await params in Next.js 15+
    const { id } = await params;
    const order = await Order.findById(id);

    if (!order) {
      return NextResponse.json(
        { message: 'Order not found' },
        { status: 404 }
      );
    }

    if (order.status === 'delivered') {
      return NextResponse.json(
        { message: 'Cannot cancel delivered order' },
        { status: 400 }
      );
    }

    order.status = 'cancelled';
    await order.save();

    return NextResponse.json({ message: 'Order cancelled' });
  } catch (error) {
    return NextResponse.json(
      { message: error.message },
      { status: 500 }
    );
  }
}
