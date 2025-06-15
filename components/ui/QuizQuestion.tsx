import React, { useState } from 'react';

// Define types for question and options
export interface QuizOption {
  id: string;
  text: string;
}

export interface QuizQuestionProps {
  questionText: string;
  options: QuizOption[];
  correctAnswerId: string;
  onAnswerSelected: (isCorrect: boolean, selectedOptionId: string) => void;
  questionNumber?: number; // Optional question number
}

const QuizQuestion: React.FC<QuizQuestionProps> = ({
  questionText,
  options,
  correctAnswerId,
  onAnswerSelected,
  questionNumber,
}) => {
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);

  const handleOptionClick = (optionId: string) => {
    if (isAnswered) return; // Prevent changing answer after submission

    setSelectedOptionId(optionId);
    setIsAnswered(true);
    onAnswerSelected(optionId === correctAnswerId, optionId);
  };

  const getOptionClasses = (optionId: string) => {
    if (!isAnswered) {
      return 'bg-white dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600'; // Default state
    }
    if (optionId === correctAnswerId) {
      return 'bg-green-100 dark:bg-green-700 border-green-500 dark:border-green-400 text-green-700 dark:text-green-200'; // Correct answer
    }
    if (optionId === selectedOptionId) {
      return 'bg-red-100 dark:bg-red-700 border-red-500 dark:border-red-400 text-red-700 dark:text-red-200'; // Incorrectly selected answer
    }
    return 'bg-white dark:bg-slate-700 opacity-75'; // Not selected, after answer
  };

  return (
    <div className="py-6 px-4 my-6 bg-slate-50 dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700">
      <h3 className="text-xl sm:text-2xl font-semibold text-slate-800 dark:text-slate-100 mb-5">
        {questionNumber && <span className="text-primary dark:text-primary-light font-bold me-2">{questionNumber}.</span>}
        {questionText}
      </h3>
      <div className="space-y-3">
        {options.map((option) => (
          <button
            key={option.id}
            onClick={() => handleOptionClick(option.id)}
            disabled={isAnswered}
            className={`w-full text-right p-4 rounded-lg border-2 transition-all duration-200 ease-in-out
                        focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-primary-light
                        ${getOptionClasses(option.id)}
                        ${isAnswered ? 'cursor-not-allowed' : 'cursor-pointer'}`}
          >
            <span className="font-medium text-slate-700 dark:text-slate-200">{option.text}</span>
          </button>
        ))}
      </div>
      {isAnswered && selectedOptionId && (
        <div className={`mt-4 p-3 rounded-md text-sm font-medium
          ${selectedOptionId === correctAnswerId ?
            'bg-green-50 dark:bg-green-900/50 text-green-700 dark:text-green-300' :
            'bg-red-50 dark:bg-red-900/50 text-red-700 dark:text-red-300'}`}>
          {selectedOptionId === correctAnswerId ? 'תשובה נכונה!' : 'תשובה לא נכונה.'}
        </div>
      )}
    </div>
  );
};

export default QuizQuestion;
