import dotenv from "dotenv";
dotenv.config();

function required(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Ympäristömuuttuja ${name} puuttuu. Katso server/.env.example.`);
  }
  return value;
}

export const config = {
  databaseUrl: required("DATABASE_URL"),
  jwtSecret: required("JWT_SECRET"),
  port: Number(process.env.PORT) || 3001,
  cookieSecure: process.env.COOKIE_SECURE === "true",
  isProduction: process.env.NODE_ENV === "production",
  admin: {
    username: process.env.ADMIN_USERNAME || "allu",
    password: process.env.ADMIN_PASSWORD || "vaihda-tama",
    displayName: process.env.ADMIN_DISPLAY_NAME || "Allu",
  },
};
