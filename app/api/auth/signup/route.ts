import { NextResponse } from "next/server";
import * as userService from "@/features/users/service";
import * as referralService from "@/features/referral/service";
import { UserValidationError } from "@/features/users/errors";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const user = await userService.registerUser(body);

    if (body.referralCode) {
      await referralService.redeemReferralCode(body.referralCode, user.id);
    }

    return NextResponse.json(user);
  } catch (err) {
    if (err instanceof UserValidationError) {
      return NextResponse.json(
        { message: err.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { message: "Error" },
      { status: 500 }
    );
  }
}
