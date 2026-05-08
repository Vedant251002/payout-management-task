import mongoose, { Schema, Document, Types } from "mongoose";

export type AuditAction = "CREATED" | "SUBMITTED" | "APPROVED" | "REJECTED";

export interface IPayoutAudit extends Document {
  payout_id: Types.ObjectId;
  action: AuditAction;
  performed_by: Types.ObjectId;
  performed_at: Date;
}

const PayoutAuditSchema = new Schema<IPayoutAudit>({
  payout_id: { type: Schema.Types.ObjectId, ref: "Payout", required: true, index: true },
  action: { type: String, required: true, enum: ["CREATED", "SUBMITTED", "APPROVED", "REJECTED"] },
  performed_by: { type: Schema.Types.ObjectId, ref: "User", required: true },
  performed_at: { type: Date, default: Date.now },
});

export const PayoutAudit =
  mongoose.models.PayoutAudit || mongoose.model<IPayoutAudit>("PayoutAudit", PayoutAuditSchema);
