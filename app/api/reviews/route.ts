import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/features/auth/auth-options";
import * as reviewService from "@/features/reviews/service";
import { ReviewValidationError } from "@/features/reviews/errors";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);

  const productId = searchParams.get("productId");

  if (!productId) {
    return NextResponse.json(
      { error: "productId is required" },
      { status: 400 }
    );
  }

  const reviews = await reviewService.getReviewsForProduct(productId);

  return NextResponse.json(reviews);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json(
      { error: "You must be logged in to leave a review" },
      { status: 401 }
    );
  }

  const body = await req.json();

  try {
    const review = await reviewService.submitReview({
      productId: body.productId,
      userId: session.user.id,
      rating: body.rating,
      comment: body.comment,
    });

    return NextResponse.json(review);
  } catch (error) {
    if (error instanceof ReviewValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    throw error;
  }
}
