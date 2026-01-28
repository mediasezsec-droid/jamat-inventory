import { prisma } from "./src/lib/db";

async function main() {
  const event = await prisma.event.findFirst({
    orderBy: { createdAt: "desc" },
  });
  console.log("Latest Event Data:");
  console.log(JSON.stringify(event, null, 2));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
