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
    const { 
      orderItems, 
      shippingAddress, 
      paymentMethod, 
      itemsPrice, 
      taxPrice, 
      shippingPrice, 
      totalPrice, 
      phoneNumber 
    } = body;

    if (!orderItems || orderItems.length === 0) {
      return NextResponse.json(
        { message: 'No order items' },
        { status: 400 }
      );
    }

    const userId = await getUserFromToken(request);

    // 1. Build the order data object
    // We cast to Number to ensure Mongoose validation passes
    const orderData = {
      orderItems: orderItems.map(item => ({
        ...item,
        price: Number(item.price),
        qty: Number(item.qty)
      })),
      shippingAddress,
      paymentMethod,
      itemsPrice: Number(itemsPrice),
      taxPrice: Number(taxPrice),
      shippingPrice: Number(shippingPrice),
      totalPrice: Number(totalPrice),
      status: 'pending'
    };

    // 2. ONLY add user if they are logged in. 
    // This fixes the "user: Path user is required" error.
    if (userId) {
      orderData.user = userId;
    }

    const order = new Order(orderData);

    // 3. Handle M-Pesa STK Push
    if (paymentMethod === 'mpesa' && phoneNumber) {
      try {
        // Sanitize phone number (converts 07... or +254... to 254...)
        const formattedPhone = phoneNumber.replace(/\D/g, '').replace(/^0/, '254').replace(/^\+/, '');
        
        const mpesaResponse = await stkPush(
          formattedPhone,
          Math.round(totalPrice), // Safaricom requires integers
          `ORDER_${Date.now()}`,
          'AgriPack Payment'
        );
        
        if (mpesaResponse && mpesaResponse.ResponseCode === '0') {
          order.mpesaCheckoutRequestID = mpesaResponse.CheckoutRequestID;
        }
      } catch (mpesaError) {
        // We log but don't crash the whole order if M-Pesa fails to trigger
        console.error('M-Pesa Service Error:', mpesaError.message);
      }
    }

    const createdOrder = await order.save();

    // 4. Update product stock (Optimized loop)
    for (const item of orderItems) {
      await Product.findByIdAndUpdate(item.product, {
        $inc: { stock: -item.qty }
      });
    }

    return NextResponse.json(createdOrder, { status: 201 });
  } catch (error) {
    console.error("SERVER_ORDER_ERROR:", error);
    return NextResponse.json(
      { message: error.message },
      { status: 500 }
    );
  }
}

// @desc    Get orders - for buyers or farmers
// @route   GET /api/orders
export async function GET(request) {
  try {
    await dbConnect();
    const userId = await getUserFromToken(request);
    
    if (!userId) {
      return NextResponse.json({ message: 'Not authorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');

    let orders;

    if (type === 'farmer') {
      const farmerProducts = await Product.find({ farmer: userId }).select('_id');
      const productIds = farmerProducts.map(p => p._id);

      orders = await Order.find({ 
        'orderItems.product': { $in: productIds }
      })
        .populate('user', 'name email phone')
        .populate('orderItems.product', 'name image farmer')
        .sort({ createdAt: -1 });

      orders = orders.map(order => {
        const orderObj = order.toObject();
        const farmerOrderItems = orderObj.orderItems.filter(
          item => item.product?.farmer?.toString() === userId
        );
        return {
          ...orderObj,
          orderItems: farmerOrderItems,
          farmerTotal: farmerOrderItems.reduce((sum, item) => sum + (item.price * item.qty), 0)
        };
      });
    } else {
      orders = await Order.find({ user: userId })
        .populate('orderItems.product', 'name image')
        .sort({ createdAt: -1 });
    }

    return NextResponse.json({ orders });
  } catch (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}