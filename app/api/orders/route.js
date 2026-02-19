import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import dbConnect from '@/lib/db';
import Order from '@/models/Order';
import Product from '@/models/Product';
import { stkPush } from '@/lib/mpesa';

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

// @desc    Create new order
// @route   POST /api/orders
export async function POST(request) {
  try {
    await dbConnect();
    const body = await request.json();
    const { orderItems, shippingAddress, paymentMethod, itemsPrice, taxPrice, shippingPrice, totalPrice, phoneNumber } = body;

    if (!orderItems || orderItems.length === 0) {
      return NextResponse.json(
        { message: 'No order items' },
        { status: 400 }
      );
    }

    // Get user ID if authenticated
    const userId = await getUserFromToken(request);

    // Create order
    const order = new Order({
      user: userId || null,
      orderItems,
      shippingAddress,
      paymentMethod,
      itemsPrice,
      taxPrice,
      shippingPrice,
      totalPrice
    });

    // If M-Pesa payment, initiate STK Push
    if (paymentMethod === 'mpesa' && phoneNumber) {
      try {
        const mpesaResponse = await stkPush(
          phoneNumber,
          totalPrice,
          `ORDER_${Date.now()}`,
          'Payment for order'
        );
        
        if (mpesaResponse.ResponseCode === '0') {
          order.mpesaCheckoutRequestID = mpesaResponse.CheckoutRequestID;
        }
      } catch (mpesaError) {
        console.error('M-Pesa error:', mpesaError);
        // Continue with order creation even if M-Pesa fails
      }
    }

    const createdOrder = await order.save();

    // Update product stock
    for (const item of orderItems) {
      const product = await Product.findById(item.product);
      if (product) {
        product.stock = Math.max(0, product.stock - item.qty);
        await product.save();
      }
    }

    return NextResponse.json(createdOrder, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { message: error.message },
      { status: 500 }
    );
  }
}

// @desc    Get orders - for buyers (their orders) or farmers (orders for their products)
// @route   GET /api/orders
export async function GET(request) {
  try {
    await dbConnect();
    const userId = await getUserFromToken(request);
    
    if (!userId) {
      return NextResponse.json(
        { message: 'Not authorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type'); // 'farmer' or default (buyer)

    let orders;

    if (type === 'farmer') {
      // For farmers: Get orders containing their products
      // First, find all products owned by this farmer
      const farmerProducts = await Product.find({ farmer: userId }).select('_id');
      const productIds = farmerProducts.map(p => p._id);

      // Then find orders containing any of these products
      orders = await Order.find({ 
        'orderItems.product': { $in: productIds }
      })
        .populate('user', 'name email phone')
        .populate('orderItems.product', 'name image farmer')
        .sort({ createdAt: -1 });

      // Filter to only include items from farmer's products
      orders = orders.map(order => {
        const farmerOrderItems = order.orderItems.filter(
          item => item.product && item.product.farmer && item.product.farmer.toString() === userId
        );
        return {
          ...order.toObject(),
          orderItems: farmerOrderItems,
          // Calculate total for farmer's items only
          farmerTotal: farmerOrderItems.reduce((sum, item) => sum + (item.price * item.qty), 0)
        };
      });
    } else {
      // For buyers: Get their own orders
      orders = await Order.find({ user: userId })
        .populate('orderItems.product', 'name image')
        .sort({ createdAt: -1 });
    }

    return NextResponse.json({ orders });
  } catch (error) {
    return NextResponse.json(
      { message: error.message },
      { status: 500 }
    );
  }
}
