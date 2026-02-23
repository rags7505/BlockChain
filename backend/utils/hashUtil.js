import crypto from "crypto";

export const hashBuffer = (buffer) => {
  if (!buffer || !Buffer.isBuffer(buffer)) {
    throw new Error("Invalid buffer passed to hashBuffer");
  }

  return crypto
    .createHash("sha256")
    .update(buffer)
    .digest("hex");
};
