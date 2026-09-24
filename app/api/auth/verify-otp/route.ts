import { NextRequest, NextResponse } from "next/server";
import { verifyOtpCode } from "@/app/lib/otpService";
import { sendWelcomeEmail } from "@/app/lib/emailService";
import { OtpType } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, otp } = body;

    // Validation
    if (!email || !otp) {
      return NextResponse.json(
        { error: "Email and OTP are required" },
        { status: 400 }
      );
    }

    // Verify OTP
    const result = await verifyOtpCode({
      email,
      otp,
      type: OtpType.EMAIL_VERIFICATION,
    });

    if (!result.success) {
      return NextResponse.json(
        {
          error: result.error,
          attemptsRemaining: result.attemptsRemaining,
        },
        { status: 400 }
      );
    }

    // Get user details for welcome email
    const user = await prisma.user.findUnique({
      where: { email },
      select: { name: true, email: true },
    });

    // Send welcome email
    if (user) {
      await sendWelcomeEmail({
        to: user.email,
        name: user.name || "there",
      });
    }

    return NextResponse.json(
      {
        success: true,
        message: "Email verified successfully! You can now log in.",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("OTP verification error:", error);
    return NextResponse.json(
      { error: "An error occurred during verification" },
      { status: 500 }
    );
  }
}
