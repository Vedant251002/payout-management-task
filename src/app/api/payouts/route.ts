import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import { Payout } from "@/lib/models/payout";
import { PayoutAudit } from "@/lib/models/payout-audit";
import { Vendor } from "@/lib/models/vendor";
import "@/lib/models/user";
import { authenticate, authorize } from "@/lib/auth";
import {
  successResponse,
  errorResponse,
  validationError,
  unauthorizedResponse,
  forbiddenResponse,
} from "@/lib/api-response";

export async function GET(req: NextRequest) {
  try {
    const user = authenticate(req);
    if (!user) return unauthorizedResponse();

    await connectDB();

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const vendor_id = searchParams.get("vendor_id");

    const filter: Record<string, unknown> = {};
    if (status) filter.status = status;
    if (vendor_id) filter.vendor_id = vendor_id;

    const payouts = await Payout.find(filter)
      .populate("vendor_id", "name")
      .populate("created_by", "name email")
      .sort({ created_at: -1 });

    return successResponse(payouts);
  } catch (error) {
    console.error("Get payouts error:", error);
    return errorResponse("Internal server error", 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = authorize(req, ["OPS"]);
    if (!user) {
      const authed = authenticate(req);
      if (!authed) return unauthorizedResponse();
      return forbiddenResponse("Only OPS users can create payouts");
    }

    const body = await req.json();
    const { vendor_id, amount, mode, note } = body;

    // Validation
    const errors: Record<string, string> = {};
    if (!vendor_id) errors.vendor_id = "Vendor is required";
    if (!amount || amount <= 0) errors.amount = "Amount must be greater than 0";
    if (!mode || !["UPI", "IMPS", "NEFT"].includes(mode))
      errors.mode = "Mode must be UPI, IMPS, or NEFT";
    if (Object.keys(errors).length > 0) return validationError(errors);

    await connectDB();

    // Verify vendor exists and is active
    const vendor = await Vendor.findById(vendor_id);
    if (!vendor || !vendor.is_active) {
      return errorResponse("Vendor not found or inactive", 404);
    }

    const payout = await Payout.create({
      vendor_id,
      amount,
      mode,
      note: note?.trim() || null,
      status: "Draft",
      created_by: user.userId,
    });

    // Create audit trail
    await PayoutAudit.create({
      payout_id: payout._id,
      action: "CREATED",
      performed_by: user.userId,
    });

    return successResponse(payout, 201);
  } catch (error) {
    console.error("Create payout error:", error);
    return errorResponse("Internal server error", 500);
  }
}
