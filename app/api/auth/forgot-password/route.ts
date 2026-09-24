import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createAndSendOtp } from "@/app/lib/otpService";
import { OtpType } from "@prisma/client";

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email || typeof email !== "string") {
      return NextResponse.json(
        { error: "Valid email is required" },
        { status: 400 }
      );
    }

    const cleanEmail = email.toLowerCase().trim();

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { email: cleanEmail },
    });

    if (!user) {
      // Return 200 anyway to prevent user enumeration attacks
      return NextResponse.json({
        success: true,
        message: "If that email is registered, a password reset code has been sent.",
      });
    }

    // Generate and send password reset OTP
    const otpResult = await createAndSendOtp({
      email: cleanEmail,
      userId: user.id,
      type: OtpType.PASSWORD_RESET,
    });

    if (!otpResult.success) {
      return NextResponse.json(
        { error: "Failed to send reset code. Please try again later." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "If that email is registered, a password reset code has been sent.",
    });
  } catch (error) {
    console.error("Forgot password error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
