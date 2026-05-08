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
    const user = authorize(req, ["FINANCE"]);
    if (!user) {
      const authed = authenticate(req);
      if (!authed) return unauthorizedResponse();
      return forbiddenResponse("Only FINANCE users can approve payouts");
    }

    await connectDB();

    const payout = await Payout.findById(params.id);
    if (!payout) return notFoundResponse("Payout not found");

    if (payout.status !== "Submitted") {
      return errorResponse(
        `Cannot approve payout. Current status is "${payout.status}". Only Submitted payouts can be approved.`,
        400
      );
    }

    payout.status = "Approved";
    await payout.save();

    await PayoutAudit.create({
      payout_id: payout._id,
      action: "APPROVED",
      performed_by: user.userId,
    });

    return successResponse(payout);
  } catch (error) {
    console.error("Approve payout error:", error);
    return errorResponse("Internal server error", 500);
  }
}
