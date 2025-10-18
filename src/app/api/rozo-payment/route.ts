import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const paymentPayload = await request.json();

    const rozoUrl = process.env.ROZO_API_URL;
    const rozoKey = process.env.ROZO_API_KEY;

    if (!rozoUrl || !rozoKey) {
      return NextResponse.json(
        {
          code: "ROZO_PAYMENT_ERROR_ENV",
          message: "Missing ROZO API env variables",
        },
        { status: 500 },
      );
    }

    const rozoResponse = await fetch(`${rozoUrl}/payment-api`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${rozoKey}`,
      },
      body: JSON.stringify(paymentPayload),
    });

    if (!rozoResponse.ok) {
      return NextResponse.json(
        {
          code: "ROZO_PAYMENT_ERROR_API",
          message: `Rozo API request failed: ${rozoResponse.status} ${rozoResponse.statusText}`,
        },
        { status: rozoResponse.status },
      );
    }

    const data = await rozoResponse.json();

    return NextResponse.json({
      code: "ROZO_PAYMENT_SUCCESS",
      data,
    });
  } catch (error: unknown) {
    console.error("[ROZO PAYMENT API ERROR]", error);

    return NextResponse.json(
      {
        code: "ROZO_PAYMENT_ERROR_UNKNOWN",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
