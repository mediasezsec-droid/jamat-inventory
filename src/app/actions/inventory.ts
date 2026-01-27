"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { getCurrentRole } from "@/lib/rbac-server";
import { redirect } from "next/navigation";

// Helper to check permissions
async function checkManagePermission() {
  const role = await getCurrentRole();
  if (role !== "ADMIN" && role !== "MANAGER") {
    throw new Error("Unauthorized");
  }
}

export async function addItem(data: {
  name: string;
  category: string;
  totalQuantity: number;
  unit: string;
}) {
  try {
    await checkManagePermission();

    const item = await prisma.inventoryItem.create({
      data: {
        name: data.name,
        category: data.category,
        totalQuantity: data.totalQuantity,
        availableQuantity: data.totalQuantity, // Initially all available
        unit: data.unit,
      },
    });

    revalidatePath("/inventory");
    return { success: true, item };
  } catch (error) {
    console.error("Failed to add item:", error);
    return { success: false, error: "Failed to add item" };
  }
}

export async function deleteItem(id: string) {
  try {
    await checkManagePermission();

    // Check for existing usages if needed, or cascading delete handled by DB
    // For now, simple delete
    await prisma.inventoryItem.delete({
      where: { id },
    });

    revalidatePath("/inventory");
    return { success: true };
  } catch (error) {
    console.error("Failed to delete item:", error);
    return { success: false, error: "Failed to delete item" };
  }
}

export async function bulkImportItems(
  items: {
    name: string;
    category: string;
    totalQuantity: number;
    unit: string;
  }[],
) {
  try {
    await checkManagePermission();

    // Transaction for bulk insert
    await prisma.$transaction(
      items.map((item) =>
        prisma.inventoryItem.create({
          data: {
            name: item.name,
            category: item.category,
            totalQuantity: item.totalQuantity,
            availableQuantity: item.totalQuantity,
            unit: item.unit,
          },
        }),
      ),
    );

    revalidatePath("/inventory");
    return { success: true };
  } catch (error) {
    console.error("Failed to bulk import:", error);
    return { success: false, error: "Failed to bulk import" };
  }
}
