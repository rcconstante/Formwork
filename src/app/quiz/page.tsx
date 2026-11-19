import type { Metadata } from "next";
import QuizReviewer from "@/components/quiz-reviewer";

export const metadata: Metadata = { title: "Quiz reviewer" };

export default function QuizPage() {
  return <QuizReviewer />;
}

