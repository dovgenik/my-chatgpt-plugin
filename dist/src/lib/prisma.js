//src\lib\prisma.ts
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client.js";
const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
    throw new Error("DATABASE_URL is not configured");
}
const adapter = new PrismaPg({
    connectionString,
});
export const prisma = new PrismaClient({
    adapter,
    log: [
        { emit: "event", level: "query" },
        { emit: "event", level: "error" },
        { emit: "event", level: "warn" },
    ],
});
prisma.$on("query", (event) => {
    console.error("SQL:", event.query);
    console.error("Parameters:", event.params);
    console.error("Duration:", event.duration, "ms");
});
prisma.$on("error", (event) => {
    console.error("Prisma error:", event.message);
});
prisma.$on("warn", (event) => {
    console.error("Prisma warning:", event.message);
});
