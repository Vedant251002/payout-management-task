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
  validationError,
} from "@/lib/api-response";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = authorize(req, ["FINANCE"]);
    if (!user) {
      const authed = authenticate(req);
      if (!authed) return unauthorizedResponse();
      return forbiddenResponse("Only FINANCE users can reject payouts");
    }

    const body = await req.json();
    const { reason } = body;

    if (!reason || !reason.trim()) {
      return validationError({ reason: "Rejection reason is mandatory" });
    }

    await connectDB();

    const payout = await Payout.findById(params.id);
    if (!payout) return notFoundResponse("Payout not found");

    if (payout.status !== "Submitted") {
      return errorResponse(
        `Cannot reject payout. Current status is "${payout.status}". Only Submitted payouts can be rejected.`,
        400
      );
    }

    payout.status = "Rejected";
    payout.decision_reason = reason.trim();
    await payout.save();

    await PayoutAudit.create({
      payout_id: payout._id,
      action: "REJECTED",
      performed_by: user.userId,
    });

    return successResponse(payout);
  } catch (error) {
    console.error("Reject payout error:", error);
    return errorResponse("Internal server error", 500);
  }
}
