import { arrayRemove, arrayUnion, doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

// Session cache so a grid of CourseCards reads the user doc once, not per card.
// toggleBookmark keeps it in sync.
const cache = new Map<string, Promise<string[]>>();

async function fetchBookmarks(uid: string): Promise<string[]> {
  try {
    const snap = await getDoc(doc(db, "users", uid));
    const raw = snap.exists() ? snap.data().bookmarks : undefined;
    return Array.isArray(raw) ? raw.filter((s): s is string => typeof s === "string") : [];
  } catch {
    return [];
  }
}

export function getBookmarks(uid: string): Promise<string[]> {
  let pending = cache.get(uid);
  if (!pending) {
    pending = fetchBookmarks(uid);
    cache.set(uid, pending);
  }
  return pending;
}

/** Toggles a slug in users/{uid}.bookmarks. Resolves to the new state. */
export async function toggleBookmark(uid: string, slug: string): Promise<boolean> {
  const current = await getBookmarks(uid);
  const has = current.includes(slug);
  await setDoc(
    doc(db, "users", uid),
    { bookmarks: has ? arrayRemove(slug) : arrayUnion(slug) },
    { merge: true },
  );
  const next = has ? current.filter((s) => s !== slug) : [...current, slug];
  cache.set(uid, Promise.resolve(next));
  return !has;
}
