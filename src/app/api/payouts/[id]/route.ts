import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import { Payout } from "@/lib/models/payout";
import { PayoutAudit } from "@/lib/models/payout-audit";
import "@/lib/models/user";
import "@/lib/models/vendor";
import { authenticate } from "@/lib/auth";
import { successResponse, errorResponse, unauthorizedResponse, notFoundResponse } from "@/lib/api-response";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = authenticate(req);
    if (!user) return unauthorizedResponse();

    await connectDB();

    const payout = await Payout.findById(params.id)
      .populate("vendor_id", "name upi_id bank_account ifsc")
      .populate("created_by", "name email");

    if (!payout) return notFoundResponse("Payout not found");

    const audits = await PayoutAudit.find({ payout_id: params.id })
      .populate("performed_by", "name email role")
      .sort({ performed_at: 1 });

    return successResponse({ payout, audits });
  } catch (error) {
    console.error("Get payout error:", error);
    return errorResponse("Internal server error", 500);
  }
}
