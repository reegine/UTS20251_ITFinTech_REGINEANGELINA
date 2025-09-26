import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema(
  {
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: true,
    },
    payment_id: {
      type: String,
      required: true,
      unique: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      required: true,
      enum: ["IDR", "PHP", "USD"],
    },
    status: {
      type: String,
      enum: ["pending", "success", "failed", "expired", "refunded"],
      default: "pending",
    },
    payment_method: {
      type: String,
      enum: [
        "credit_card",
        "bank_transfer",
        "ewallet",
        "virtual_account",
        "qr_code",
        "invoice",
        "gopay",
        "ovo",
        "dana",
      ],
      required: true,
    },
    xendit_invoice_id: String,
    xendit_response: mongoose.Schema.Types.Mixed,
    payment_url: String,
    expiry_date: Date,
    paid_at: Date,
    external_id: String, 
  },
  {
    timestamps: true,
  }
);

paymentSchema.index({ payment_id: 1 });
paymentSchema.index({ order: 1 });
paymentSchema.index({ status: 1, created_at: -1 });
paymentSchema.index({ expiry_date: 1 }, { expireAfterSeconds: 0 });

export default mongoose.models.Payment ||
  mongoose.model("Payment", paymentSchema);
