import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyOtpCode } from "@/app/lib/otpService";
import { OtpType } from "@prisma/client";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  try {
    const { email, otp, newPassword } = await req.json();

    if (!email || !otp || !newPassword) {
      return NextResponse.json(
        { error: "Email, reset code, and new password are required" },
        { status: 400 }
      );
    }

    if (newPassword.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters long" },
        { status: 400 }
      );
    }

    const cleanEmail = email.toLowerCase().trim();

    // Verify OTP for password reset
    const result = await verifyOtpCode({
      email: cleanEmail,
      otp: otp.trim(),
      type: OtpType.PASSWORD_RESET,
    });

    if (!result.success) {
      return NextResponse.json(
        {
          error: result.error || "Invalid or expired reset code",
          attemptsRemaining: result.attemptsRemaining,
        },
        { status: 400 }
      );
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update user password and ensure isEmailVerified is true
    await prisma.user.update({
      where: { email: cleanEmail },
      data: {
        password: hashedPassword,
        isEmailVerified: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Password reset successfully! You can now sign in with your new password.",
    });
  } catch (error) {
    console.error("Reset password error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred while resetting password" },
      { status: 500 }
    );
  }
}
