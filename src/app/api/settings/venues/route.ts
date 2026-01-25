import { NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { auth } from "@/lib/auth";
import { v4 as uuidv4 } from "uuid";

// Helper to ensure all venues are objects
// If we find strings, we keep them as is in DB but return them as objects to FE?
// Or we just strictly handle the DB transition.
// Let's rely on the API to manage the array.

const MASTER_DOC = "masterData";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Strict Role Check for Settings
    const role = (session.user as any).role;
    if (role !== "ADMIN") {
      return NextResponse.json(
        { error: "Forbidden: Admins only" },
        { status: 403 },
      );
    }

    const doc = await db.collection("settings").doc(MASTER_DOC).get();
    const data = doc.exists ? doc.data() : {};
    let halls = data?.halls || [];

    // Normalization for Frontend
    // Convert strings to objects with stable IDs (hashes or just use name if unique)
    // To allow renaming, we really should have persistent IDs.
    // For legacy strings, we'll use the name as the ID.
    const normalizedHalls = halls.map((h: any) => {
      if (typeof h === "string") {
        return { id: h, name: h, isLegacy: true };
      }
      return h;
    });

    return NextResponse.json(normalizedHalls);
  } catch (error) {
    console.error("Venues GET Error:", error);
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

    const { name } = await req.json();
    if (!name?.trim())
      return NextResponse.json({ error: "Name is required" }, { status: 400 });

    const newItem = {
      id: uuidv4(),
      name: name.trim(),
      createdAt: new Date().toISOString(),
    };

    await db.runTransaction(async (t) => {
      const docRef = db.collection("settings").doc(MASTER_DOC);
      const doc = await t.get(docRef);
      const data = doc.exists ? doc.data() : {};
      const halls = data?.halls || [];

      t.set(docRef, { halls: [...halls, newItem] }, { merge: true });
    });

    return NextResponse.json(newItem);
  } catch (error) {
    console.error("Venues POST Error:", error);
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

    const { id, name } = await req.json();
    if (!id || !name?.trim())
      return NextResponse.json({ error: "Invalid data" }, { status: 400 });

    await db.runTransaction(async (t) => {
      const docRef = db.collection("settings").doc(MASTER_DOC);
      const doc = await t.get(docRef);
      const data = doc.exists ? doc.data() : {};
      let halls = data?.halls || [];

      const index = halls.findIndex(
        (h: any) =>
          (typeof h === "string" && h === id) ||
          (typeof h === "object" && h.id === id),
      );

      if (index === -1) throw new Error("Venue not found");

      // Replace with object
      // If it was string (legacy), we now convert to object with NEW name, keeping legacy ID (original name) or upgrading?
      // Upgrading: use the existing ID if it's an object, or generate new ID?
      // If legacy (id === name), we should definitely upgrade to a proper object now.

      const existing = halls[index];
      const isLegacy = typeof existing === "string";

      const updatedItem = {
        id: isLegacy ? uuidv4() : existing.id, // Generate real ID if legacy
        name: name.trim(),
        updatedAt: new Date().toISOString(),
      };

      halls[index] = updatedItem;

      t.update(docRef, { halls });
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Venues PUT Error:", error);
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
      const halls = data?.halls || [];

      const filteredHalls = halls.filter((h: any) =>
        typeof h === "string" ? h !== id : h.id !== id,
      );

      t.update(docRef, { halls: filteredHalls });
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Venues DELETE Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
