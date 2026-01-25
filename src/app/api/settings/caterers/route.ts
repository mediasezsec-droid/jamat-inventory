import { NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { auth } from "@/lib/auth";
import { v4 as uuidv4 } from "uuid";

const MASTER_DOC = "masterData";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const doc = await db.collection("settings").doc(MASTER_DOC).get();
    const data = doc.exists ? doc.data() : {};
    const caterers = data?.caterers || [];

    // Normalize caterers (some might be strings, others objects)
    const normalized = caterers.map((c: any) => {
      if (typeof c === "string") {
        return { id: c, name: c, phone: "", isLegacy: true };
      }
      return {
        id: c.id || c.name, // Fallback ID
        name: c.name,
        phone: c.phone || "",
        ...c,
      };
    });

    return NextResponse.json(normalized);
  } catch (error) {
    console.error("Caterers GET Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    if ((session.user as any).role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { name, phone } = await req.json();
    if (!name?.trim())
      return NextResponse.json({ error: "Name is required" }, { status: 400 });

    const newItem = {
      id: uuidv4(),
      name: name.trim(),
      phone: phone?.trim() || "",
      createdAt: new Date().toISOString(),
    };

    await db.runTransaction(async (t) => {
      const docRef = db.collection("settings").doc(MASTER_DOC);
      const doc = await t.get(docRef);
      const data = doc.exists ? doc.data() : {};
      const caterers = data?.caterers || [];

      t.set(docRef, { caterers: [...caterers, newItem] }, { merge: true });
    });

    return NextResponse.json(newItem);
  } catch (error) {
    console.error("Caterers POST Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

export async function PUT(req: Request) {
  try {
    const session = await auth();
    if (!session?.user)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    if ((session.user as any).role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id, name, phone } = await req.json();
    if (!id || !name?.trim())
      return NextResponse.json({ error: "Invalid data" }, { status: 400 });

    await db.runTransaction(async (t) => {
      const docRef = db.collection("settings").doc(MASTER_DOC);
      const doc = await t.get(docRef);
      const data = doc.exists ? doc.data() : {};
      const caterers = data?.caterers || [];

      const index = caterers.findIndex(
        (c: any) =>
          (typeof c === "string" && c === id) ||
          (typeof c === "object" && (c.id === id || c.name === id)),
      );

      if (index === -1) throw new Error("Caterer not found");

      const existing = caterers[index];
      const isLegacy = typeof existing === "string";

      const updatedItem = {
        id: isLegacy ? uuidv4() : existing.id,
        name: name.trim(),
        phone: phone?.trim() || "", // Allow clearing phone
        updatedAt: new Date().toISOString(),
      };

      caterers[index] = updatedItem;

      t.update(docRef, { caterers });
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Caterers PUT Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error" },
      { status: 500 },
    );
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await auth();
    if (!session?.user)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    if ((session.user as any).role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await req.json();

    await db.runTransaction(async (t) => {
      const docRef = db.collection("settings").doc(MASTER_DOC);
      const doc = await t.get(docRef);
      const data = doc.exists ? doc.data() : {};
      const caterers = data?.caterers || [];

      const filtered = caterers.filter((c: any) =>
        typeof c === "string" ? c !== id : c.id !== id,
      );

      t.update(docRef, { caterers: filtered });
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Caterers DELETE Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
