import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Order from '@/models/Order';

// @desc    M-Pesa callback URL
// @route   POST /api/mpesa/callback
export async function POST(request) {
  try {
    await dbConnect();
    const body = await request.json();

    // Log the callback for debugging
    console.log('M-Pesa Callback:', JSON.stringify(body));

    // Get the callback result
    const callbackResult = body.Body?.stkCallback;
    
    if (!callbackResult) {
      return NextResponse.json({ message: 'Invalid callback' }, { status: 400 });
    }

    const { CheckoutRequestID, ResultCode, ResultDesc, CallbackMetadata } = callbackResult;

    // Find order by checkout request ID
    const order = await Order.findOne({ mpesaCheckoutRequestID: CheckoutRequestID });

    if (!order) {
      console.log('Order not found for CheckoutRequestID:', CheckoutRequestID);
      return NextResponse.json({ message: 'Order not found' }, { status: 404 });
    }

    if (ResultCode === 0) {
      // Successful payment
      // Extract payment details from callback metadata
      const metadata = CallbackMetadata?.Item || [];
      const amount = metadata.find(item => item.Name === 'Amount')?.Value;
      const mpesaReceiptNumber = metadata.find(item => item.Name === 'MpesaReceiptNumber')?.Value;
      const phoneNumber = metadata.find(item => item.Name === 'PhoneNumber')?.Value;

      order.isPaid = true;
      order.paidAt = new Date();
      order.paymentResult = {
        id: mpesaReceiptNumber,
        status: 'success',
        update_time: new Date().toISOString(),
        phoneNumber: phoneNumber,
        amount: amount
      };
      order.status = 'processing';
      
      await order.save();
      
      console.log('Payment successful for order:', order._id);
    } else {
      // Payment failed
      order.paymentResult = {
        id: CheckoutRequestID,
        status: 'failed',
        update_time: new Date().toISOString(),
        error: ResultDesc
      };
      
      await order.save();
      
      console.log('Payment failed for order:', order._id, ResultDesc);
    }

    return NextResponse.json({ message: 'Callback received' });
  } catch (error) {
    console.error('M-Pesa callback error:', error);
    return NextResponse.json(
      { message: error.message },
      { status: 500 }
    );
  }
}

// @desc    Health check for callback URL
// @route   GET /api/mpesa/callback
export async function GET() {
  return NextResponse.json({ status: 'ok', message: 'M-Pesa callback endpoint is running' });
}
