import mongoose, { Schema, Document, Types } from "mongoose";

export type PayoutStatus = "Draft" | "Submitted" | "Approved" | "Rejected";
export type PayoutMode = "UPI" | "IMPS" | "NEFT";

export interface IPayout extends Document {
  vendor_id: Types.ObjectId;
  amount: number;
  mode: PayoutMode;
  note?: string;
  status: PayoutStatus;
  decision_reason?: string;
  created_by: Types.ObjectId;
  created_at: Date;
  updated_at: Date;
}

const PayoutSchema = new Schema<IPayout>(
  {
    vendor_id: { type: Schema.Types.ObjectId, ref: "Vendor", required: true },
    amount: { type: Number, required: true, min: [0.01, "Amount must be greater than 0"] },
    mode: { type: String, required: true, enum: ["UPI", "IMPS", "NEFT"] },
    note: { type: String, trim: true, default: null },
    status: {
      type: String,
      required: true,
      enum: ["Draft", "Submitted", "Approved", "Rejected"],
      default: "Draft",
    },
    decision_reason: { type: String, trim: true, default: null },
    created_by: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: { createdAt: "created_at", updatedAt: "updated_at" } }
);

export const Payout = mongoose.models.Payout || mongoose.model<IPayout>("Payout", PayoutSchema);
