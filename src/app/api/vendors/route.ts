import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import { Vendor } from "@/lib/models/vendor";
import { authenticate } from "@/lib/auth";
import {
  successResponse,
  errorResponse,
  validationError,
  unauthorizedResponse,
} from "@/lib/api-response";

export async function GET(req: NextRequest) {
  try {
    const user = authenticate(req);
    if (!user) return unauthorizedResponse();

    await connectDB();
    const vendors = await Vendor.find({ is_active: true }).sort({ name: 1 });
    return successResponse(vendors);
  } catch (error) {
    console.error("Get vendors error:", error);
    return errorResponse("Internal server error", 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = authenticate(req);
    if (!user) return unauthorizedResponse();

    const body = await req.json();
    const { name, upi_id, bank_account, ifsc } = body;

    // Validation
    const errors: Record<string, string> = {};
    if (!name || !name.trim()) errors.name = "Vendor name is required";
    if (upi_id && typeof upi_id !== "string") errors.upi_id = "UPI ID must be a string";
    if (bank_account && typeof bank_account !== "string")
      errors.bank_account = "Bank account must be a string";
    if (ifsc && typeof ifsc !== "string") errors.ifsc = "IFSC must be a string";
    if (Object.keys(errors).length > 0) return validationError(errors);

    await connectDB();

    const vendor = await Vendor.create({
      name: name.trim(),
      upi_id: upi_id?.trim() || null,
      bank_account: bank_account?.trim() || null,
      ifsc: ifsc?.trim() || null,
    });

    return successResponse(vendor, 201);
  } catch (error) {
    console.error("Create vendor error:", error);
    return errorResponse("Internal server error", 500);
  }
}
