import { remember } from "@epic-web/remember";

import { PrismaClient } from "@prisma/client";
import { withPulse } from "@prisma/extension-pulse/node";

export const db = remember("db", () => {
    const client = new PrismaClient().$extends(withPulse({
        apiKey: process.env.PULSE_API_KEY!,
    }));
    return client;
});
