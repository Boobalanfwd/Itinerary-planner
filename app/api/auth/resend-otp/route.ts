import { NextRequest, NextResponse } from "next/server";
import { resendOtp } from "@/app/lib/otpService";
import { OtpType } from "@prisma/client";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email } = body;

    // Validation
    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    // Resend OTP
    const result = await resendOtp({
      email,
      type: OtpType.EMAIL_VERIFICATION,
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json(
      {
        success: true,
        message: "Verification code sent! Please check your email.",
        expiresAt: result.expiresAt,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Resend OTP error:", error);
    return NextResponse.json(
      { error: "An error occurred while resending the code" },
      { status: 500 }
    );
  }
}
