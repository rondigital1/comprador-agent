import { prisma } from "@casero/database";

export async function getShoppingList(userId: string) {
  const items = await prisma.shoppingIntent.findMany({
    where: { userId, active: true },
    include: {
      deals: {
        where: { active: true },
        orderBy: [{ score: "desc" }, { priceMinor: "asc" }],
        take: 4,
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return items.sort((left, right) => {
    const leftScore = left.deals[0]?.score ?? -1;
    const rightScore = right.deals[0]?.score ?? -1;
    if (leftScore !== rightScore) return rightScore - leftScore;

    const leftActive = ["PENDING", "RUNNING"].includes(left.researchStatus);
    const rightActive = ["PENDING", "RUNNING"].includes(right.researchStatus);
    if (leftActive !== rightActive) return leftActive ? -1 : 1;
    return right.createdAt.getTime() - left.createdAt.getTime();
  });
}

export type ShoppingListItem = Awaited<
  ReturnType<typeof getShoppingList>
>[number];
