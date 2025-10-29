import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.create({
    data: {
      username: "admin",
      password: "123456",
      role: "ADMIN",
    },
  });

  console.log("Usuario creado:", user);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
