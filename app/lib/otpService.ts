import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";
import { sendOtpEmail } from "./emailService";
import { OtpType } from "@prisma/client";

/**
 * OTP Service
 * Handles OTP generation, validation, and verification
 */

const OTP_LENGTH = 6;
const OTP_EXPIRY_MINUTES = 10;
const MAX_ATTEMPTS = 3;

/**
 * Generate a random OTP code
 */
export function generateOtp(): string {
  const digits = "0123456789";
  let otp = "";
  for (let i = 0; i < OTP_LENGTH; i++) {
    otp += digits[Math.floor(Math.random() * digits.length)];
  }
  return otp;
}

/**
 * Hash OTP before storing in database
 */
export async function hashOtp(otp: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(otp, salt);
}

/**
 * Verify OTP against hashed version
 */
export async function verifyOtp(
  otp: string,
  hashedOtp: string
): Promise<boolean> {
  return bcrypt.compare(otp, hashedOtp);
}

interface CreateOtpParams {
  email: string;
  userId?: string;
  type: OtpType;
}

/**
 * Create and send OTP for email verification
 */
export async function createAndSendOtp({
  email,
  userId,
  type,
}: CreateOtpParams) {
  try {
    // Generate OTP
    const otp = generateOtp();
    const hashedOtp = await hashOtp(otp);

    // Calculate expiry time
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + OTP_EXPIRY_MINUTES);

    // Delete any existing unverified OTPs for this email
    await prisma.otpVerification.deleteMany({
      where: {
        email,
        isVerified: false,
      },
    });

    // Create new OTP record
    const otpRecord = await prisma.otpVerification.create({
      data: {
        userId,
        email,
        otp: hashedOtp,
        type,
        expiresAt,
      },
    });

    // Send OTP via email
    const emailResult = await sendOtpEmail({
      to: email,
      otp,
    });

    if (!emailResult.success) {
      if (process.env.NODE_ENV === "development" || !process.env.SMTP_USER) {
        console.warn(
          `\n🔑 [DEV MODE OTP] Email sending failed or SMTP unconfigured. Verification code for ${email}: >>> ${otp} <<<\n`
        );
        return {
          success: true,
          otpId: otpRecord.id,
          expiresAt,
        };
      }
      throw new Error("Failed to send OTP email");
    }

    return {
      success: true,
      otpId: otpRecord.id,
      expiresAt,
    };
  } catch (error) {
    console.error("Error creating and sending OTP:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

interface VerifyOtpParams {
  email: string;
  otp: string;
  type: OtpType;
}

/**
 * Verify OTP code
 */
export async function verifyOtpCode({ email, otp, type }: VerifyOtpParams) {
  try {
    // Find the most recent OTP for this email
    const otpRecord = await prisma.otpVerification.findFirst({
      where: {
        email,
        type,
        isVerified: false,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    if (!otpRecord) {
      return {
        success: false,
        error: "No OTP found for this email",
      };
    }

    // Check if OTP has expired
    if (new Date() > otpRecord.expiresAt) {
      return {
        success: false,
        error: "OTP has expired. Please request a new one.",
      };
    }

    // Check if max attempts exceeded
    if (otpRecord.attempts >= MAX_ATTEMPTS) {
      return {
        success: false,
        error:
          "Maximum verification attempts exceeded. Please request a new OTP.",
      };
    }

    // Verify OTP
    const isValid = await verifyOtp(otp, otpRecord.otp);

    if (!isValid) {
      // Increment attempts
      await prisma.otpVerification.update({
        where: { id: otpRecord.id },
        data: {
          attempts: otpRecord.attempts + 1,
        },
      });

      return {
        success: false,
        error: "Invalid OTP code",
        attemptsRemaining: MAX_ATTEMPTS - (otpRecord.attempts + 1),
      };
    }

    // Mark OTP as verified
    await prisma.otpVerification.update({
      where: { id: otpRecord.id },
      data: {
        isVerified: true,
      },
    });

    // If user exists, mark email as verified
    if (otpRecord.userId) {
      await prisma.user.update({
        where: { id: otpRecord.userId },
        data: {
          isEmailVerified: true,
          emailVerified: new Date(),
        },
      });
    }

    return {
      success: true,
      userId: otpRecord.userId,
    };
  } catch (error) {
    console.error("Error verifying OTP:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Clean up expired OTPs (run periodically)
 */
export async function cleanupExpiredOtps() {
  try {
    const result = await prisma.otpVerification.deleteMany({
      where: {
        expiresAt: {
          lt: new Date(),
        },
      },
    });

    console.log(`Cleaned up ${result.count} expired OTPs`);
    return result.count;
  } catch (error) {
    console.error("Error cleaning up expired OTPs:", error);
    return 0;
  }
}

/**
 * Resend OTP
 */
export async function resendOtp({
  email,
  type,
}: {
  email: string;
  type: OtpType;
}) {
  try {
    // Check if there's a recent OTP (within last minute) to prevent spam
    const recentOtp = await prisma.otpVerification.findFirst({
      where: {
        email,
        type,
        createdAt: {
          gte: new Date(Date.now() - 60000), // Last 1 minute
        },
      },
    });

    if (recentOtp) {
      return {
        success: false,
        error: "Please wait before requesting a new OTP",
      };
    }

    // Create and send new OTP
    return createAndSendOtp({ email, type });
  } catch (error) {
    console.error("Error resending OTP:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
