import ExamQuestions from "@/app/_components/_exams/ExamQuestions";

import { multipleChoiceQuestions } from "@/app/_data/fake_data";

export default function LabExamFiveQuestions() {
  return <ExamQuestions multipleChoiceQuestions={multipleChoiceQuestions} examNumber={5} examType="lab" />;
}
