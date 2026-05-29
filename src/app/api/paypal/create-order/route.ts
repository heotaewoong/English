import { NextRequest, NextResponse } from "next/server";

// PayPal Sandbox / Live API base URL
const PAYPAL_BASE_URL =
  process.env.PAYPAL_MODE === "live"
    ? "https://api-m.paypal.com"
    : "https://api-m.sandbox.paypal.com";

async function getPayPalAccessToken(): Promise<string> {
  const clientId = process.env.PAYPAL_CLIENT_ID;
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error("PayPal credentials not configured");
  }

  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString(
    "base64"
  );

  const response = await fetch(`${PAYPAL_BASE_URL}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${credentials}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(`PayPal auth failed: ${JSON.stringify(data)}`);
  }
  return data.access_token;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { planId, planName, price, billing } = body;

    if (!planId || !price) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const accessToken = await getPayPalAccessToken();

    const baseUrl =
      process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

    // Create a PayPal order
    const orderPayload = {
      intent: "CAPTURE",
      purchase_units: [
        {
          reference_id: `neuroeng-${planId}-${Date.now()}`,
          description: `NeuroEng ${planName} Plan — ${billing === "yearly" ? "Annual" : "Monthly"} Subscription`,
          amount: {
            currency_code: "USD",
            value: price.toFixed(2),
            breakdown: {
              item_total: {
                currency_code: "USD",
                value: price.toFixed(2),
              },
            },
          },
          items: [
            {
              name: `NeuroEng ${planName}`,
              description: `${billing === "yearly" ? "Annual" : "Monthly"} English learning subscription`,
              quantity: "1",
              unit_amount: {
                currency_code: "USD",
                value: price.toFixed(2),
              },
              category: "DIGITAL_GOODS",
            },
          ],
        },
      ],
      application_context: {
        brand_name: "NeuroEng",
        landing_page: "BILLING",
        shipping_preference: "NO_SHIPPING",
        user_action: "PAY_NOW",
        return_url: `${baseUrl}/api/paypal/capture?plan=${planId}&billing=${billing}`,
        cancel_url: `${baseUrl}/pricing?cancelled=true`,
      },
    };

    const orderResponse = await fetch(`${PAYPAL_BASE_URL}/v2/checkout/orders`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(orderPayload),
    });

    const orderData = await orderResponse.json();

    if (!orderResponse.ok) {
      console.error("PayPal order creation failed:", orderData);
      return NextResponse.json(
        { error: "Failed to create PayPal order", details: orderData },
        { status: 500 }
      );
    }

    // Find the approve link
    const approveLink = orderData.links?.find(
      (link: { rel: string; href: string }) => link.rel === "approve"
    );

    return NextResponse.json({
      orderId: orderData.id,
      approveUrl: approveLink?.href,
      status: orderData.status,
    });
  } catch (error) {
    console.error("PayPal order error:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
