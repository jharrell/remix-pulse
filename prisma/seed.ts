import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// cleanup
await prisma.message.deleteMany();
await prisma.chat.deleteMany();
await prisma.user.deleteMany();

const users = await prisma.user.createManyAndReturn({
    data: [
        { name: "Alice" },
        { name: "Bob" },
    ],
});

const chat = await prisma.chat.create({
    data: {
        participants: {
            connect: users
        }
    }
});

console.log('Seeding complete.');