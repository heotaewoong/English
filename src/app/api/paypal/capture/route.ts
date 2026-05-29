import { NextRequest, NextResponse } from "next/server";

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

  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

  const response = await fetch(`${PAYPAL_BASE_URL}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${credentials}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });

  const data = await response.json();
  return data.access_token;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token");
  const planId = searchParams.get("plan") || "pro";
  const billing = searchParams.get("billing") || "monthly";
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

  if (!token) {
    return NextResponse.redirect(`${baseUrl}/pricing?error=missing_token`);
  }

  try {
    const accessToken = await getPayPalAccessToken();

    // Capture the payment
    const captureResponse = await fetch(
      `${PAYPAL_BASE_URL}/v2/checkout/orders/${token}/capture`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      }
    );

    const captureData = await captureResponse.json();

    if (!captureResponse.ok || captureData.status !== "COMPLETED") {
      console.error("Capture failed:", captureData);
      return NextResponse.redirect(`${baseUrl}/pricing?error=payment_failed`);
    }

    // Payment successful - redirect to dashboard with success message
    // In production: save subscription to Firebase here
    const payerId = captureData.payer?.payer_id || "";
    const amount =
      captureData.purchase_units?.[0]?.payments?.captures?.[0]?.amount?.value || "";

    return NextResponse.redirect(
      `${baseUrl}/dashboard?upgraded=true&plan=${planId}&billing=${billing}&amount=${amount}&payer=${payerId}`
    );
  } catch (error) {
    console.error("Capture error:", error);
    return NextResponse.redirect(`${baseUrl}/pricing?error=server_error`);
  }
}
