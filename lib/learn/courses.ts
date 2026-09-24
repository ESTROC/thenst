import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Course, CourseDetail } from "@/lib/learn/types";

export async function getCourses(): Promise<Course[]> {
  const snap = await getDocs(collection(db, "courses"));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Course);
}

export async function getCourseDetail(slug: string): Promise<CourseDetail | null> {
  const q = query(collection(db, "courses"), where("slug", "==", slug));
  const snap = await getDocs(q);
  if (snap.empty) return null;
  return { id: snap.docs[0].id, ...snap.docs[0].data() } as CourseDetail;
}