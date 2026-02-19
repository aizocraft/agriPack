import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Order from '@/models/Order';
import { stkPush, queryStkStatus } from '@/lib/mpesa';

// @desc    Initiate M-Pesa STK Push
// @route   POST /api/mpesa/stkpush
export async function POST(request) {
  try {
    await dbConnect();
    const body = await request.json();
    const { phoneNumber, amount, orderId } = body;

    if (!phoneNumber || !amount) {
      return NextResponse.json(
        { message: 'Phone number and amount are required' },
        { status: 400 }
      );
    }

    // Format phone number (remove +254 if present)
    const formattedPhone = phoneNumber.replace(/^254/, '').replace(/^\+?254/, '');
    const fullPhone = `254${formattedPhone}`;

    const accountReference = orderId || `ORDER_${Date.now()}`;
    
    const response = await stkPush(fullPhone, amount, accountReference, 'Payment for order');

    // If order ID provided, update order with checkout request ID
    if (orderId) {
      await Order.findByIdAndUpdate(orderId, {
        mpesaCheckoutRequestID: response.CheckoutRequestID
      });
    }

    return NextResponse.json(response);
  } catch (error) {
    return NextResponse.json(
      { message: error.message },
      { status: 500 }
    );
  }
}

// @desc    Query STK Push status
// @route   GET /api/mpesa/stkpush
export async function GET(request) {
  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const checkoutRequestID = searchParams.get('checkoutRequestID');

    if (!checkoutRequestID) {
      return NextResponse.json(
        { message: 'Checkout Request ID is required' },
        { status: 400 }
      );
    }

    const response = await queryStkStatus(checkoutRequestID);
    return NextResponse.json(response);
  } catch (error) {
    return NextResponse.json(
      { message: error.message },
      { status: 500 }
    );
  }
}
