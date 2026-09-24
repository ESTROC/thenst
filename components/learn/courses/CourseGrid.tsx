"use client";

import { motion } from "framer-motion";
import { Course } from "@/lib/learn/types";
import { CourseCard } from "./CourseCard";

export function CourseGrid({ courses }: { courses: Course[] }) {
  return (
    <motion.div initial="hidden" whileInView="show" viewport={{ once: true, margin: "-80px" }} variants={{ show: { transition: { staggerChildren: 0.05 } } }} className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {courses.map((c) => (<CourseCard key={c.id} course={c} />))}
    </motion.div>
  );
}
