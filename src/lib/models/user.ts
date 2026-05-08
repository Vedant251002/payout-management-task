import mongoose, { Schema, Document } from "mongoose";

export type UserRole = "OPS" | "FINANCE";

export interface IUser extends Document {
  email: string;
  password: string;
  role: UserRole;
  name: string;
}

const UserSchema = new Schema<IUser>(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    role: { type: String, required: true, enum: ["OPS", "FINANCE"] },
    name: { type: String, required: true, trim: true },
  },
  { timestamps: true }
);

export const User = mongoose.models.User || mongoose.model<IUser>("User", UserSchema);
