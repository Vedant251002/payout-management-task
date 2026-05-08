import mongoose, { Schema, Document } from "mongoose";

export interface IVendor extends Document {
  name: string;
  upi_id?: string;
  bank_account?: string;
  ifsc?: string;
  is_active: boolean;
}

const VendorSchema = new Schema<IVendor>(
  {
    name: { type: String, required: true, trim: true },
    upi_id: { type: String, trim: true, default: null },
    bank_account: { type: String, trim: true, default: null },
    ifsc: { type: String, trim: true, default: null },
    is_active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const Vendor = mongoose.models.Vendor || mongoose.model<IVendor>("Vendor", VendorSchema);
