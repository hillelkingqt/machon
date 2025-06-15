import React, { useState } from 'react';
import QuizQuestion, { QuizQuestionProps as IndividualQuizQuestionProps, QuizOption } from './QuizQuestion'; // Assuming QuizQuestion is in the same directory
import Button from './Button'; // Assuming a reusable Button component exists
import { CheckCircle, XCircle, Percent } from 'lucide-react'; // Icons for feedback

// Define the structure for a question within the QuizSection
export interface SectionQuizQuestion extends Omit<IndividualQuizQuestionProps, 'onAnswerSelected' | 'questionNumber'> {
  id: string; // Each question in the section needs a unique ID
}

export interface QuizSectionProps {
  title?: string;
  questions: SectionQuizQuestion[];
}

const QuizSection: React.FC<QuizSectionProps> = ({ title, questions }) => {
  const [answers, setAnswers] = useState<Record<string, { selectedOptionId: string; isCorrect: boolean }>>({});
  const [submitted, setSubmitted] = useState(false);

  const handleAnswerSelected = (questionId: string, isCorrect: boolean, selectedOptionId: string) => {
    setAnswers((prevAnswers) => ({
      ...prevAnswers,
      [questionId]: { selectedOptionId, isCorrect },
    }));
  };

  const handleSubmitQuiz = () => {
    // Check if all questions have been attempted (optional, could allow partial submission)
    // For now, we allow submission even if not all questions are answered.
    // The QuizQuestion component itself handles showing feedback immediately upon selection.
    // This submit button is more for a "final" tally if we want to hide individual feedback until the end,
    // but the current QuizQuestion shows feedback immediately.
    // So, this button might be more for "See My Score" if questions are many.

    setSubmitted(true); // Mark the quiz section as submitted to display the score.
  };

  const calculateScore = () => {
    const answeredCorrectly = Object.values(answers).filter(answer => answer.isCorrect).length;
    const totalQuestions = questions.length;
    return totalQuestions > 0 ? (answeredCorrectly / totalQuestions) * 100 : 0;
  };

  const score = calculateScore();

  return (
    <div className="my-10 p-6 bg-white dark:bg-secondary-dark rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700">
      {title && (
        <h2 className="text-2xl sm:text-3xl font-bold text-primary dark:text-primary-light mb-8 text-center">
          {title}
        </h2>
      )}
      <div className="space-y-8">
        {questions.map((question, index) => (
          <QuizQuestion
            key={question.id}
            {...question}
            questionNumber={index + 1}
            onAnswerSelected={(isCorrect, selectedOptionId) =>
              handleAnswerSelected(question.id, isCorrect, selectedOptionId)
            }
          />
        ))}
      </div>

      {/*
        The current QuizQuestion component shows feedback immediately.
        If we want a summary score reveal, we can use the 'submitted' state.
        For now, let's always show the score if there are questions.
      */}
      {questions.length > 0 && (
        <div className="mt-10 pt-6 border-t border-slate-300 dark:border-slate-600">
          <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-100 mb-4 text-center">סיכום ביצועים:</h3>
          <div className="flex flex-col items-center text-center p-6 bg-slate-50 dark:bg-slate-800 rounded-lg shadow-md">
            <div className={`flex items-center justify-center w-20 h-20 rounded-full mb-4 ${score >= 70 ? 'bg-green-100 dark:bg-green-700' : score >= 40 ? 'bg-yellow-100 dark:bg-yellow-600' : 'bg-red-100 dark:bg-red-700'}`}>
              {score >= 70 ? <CheckCircle size={40} className="text-green-500 dark:text-green-300" /> : score >= 40 ? <Percent size={40} className="text-yellow-500 dark:text-yellow-300" /> : <XCircle size={40} className="text-red-500 dark:text-red-300" />}
            </div>
            <p className="text-3xl font-bold text-slate-700 dark:text-slate-200">
              {score.toFixed(0)}%
            </p>
            <p className="text-slate-600 dark:text-slate-400">
              ({Object.values(answers).filter(a => a.isCorrect).length} מתוך {questions.length} תשובות נכונות)
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuizSection;
