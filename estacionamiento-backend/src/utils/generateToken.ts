import jwt from "jsonwebtoken";

export function generateToken(payload: object) {
  const secret = process.env.JWT_SECRET || "supersecretkey";
  return jwt.sign(payload, secret, { expiresIn: "1d" });
}
