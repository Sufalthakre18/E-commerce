import crypto from "crypto";

export function verifyRazorpayWebhookSignature(body: any, signature: string, secret: string): boolean {
  const digest = crypto
    .createHmac("sha256", secret)
    .update(body)
    .digest("hex");

  return digest === signature;
}
