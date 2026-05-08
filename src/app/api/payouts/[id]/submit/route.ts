import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import { Payout } from "@/lib/models/payout";
import { PayoutAudit } from "@/lib/models/payout-audit";
import { authenticate, authorize } from "@/lib/auth";
import {
  successResponse,
  errorResponse,
  unauthorizedResponse,
  forbiddenResponse,
  notFoundResponse,
} from "@/lib/api-response";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = authorize(req, ["OPS"]);
    if (!user) {
      const authed = authenticate(req);
      if (!authed) return unauthorizedResponse();
      return forbiddenResponse("Only OPS users can submit payouts");
    }

    await connectDB();

    const payout = await Payout.findById(params.id);
    if (!payout) return notFoundResponse("Payout not found");

    if (payout.status !== "Draft") {
      return errorResponse(
        `Cannot submit payout. Current status is "${payout.status}". Only Draft payouts can be submitted.`,
        400
      );
    }

    payout.status = "Submitted";
    await payout.save();

    await PayoutAudit.create({
      payout_id: payout._id,
      action: "SUBMITTED",
      performed_by: user.userId,
    });

    return successResponse(payout);
  } catch (error) {
    console.error("Submit payout error:", error);
    return errorResponse("Internal server error", 500);
  }
}
