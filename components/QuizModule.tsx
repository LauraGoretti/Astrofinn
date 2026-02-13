import React, { useState, useEffect } from 'react';
import { QuizQuestion } from '../types';
import { generateQuizQuestions } from '../services/geminiService';
import { CheckCircle, XCircle, Brain, Loader2, ArrowRight } from 'lucide-react';

interface QuizModuleProps {
  topic: string;
  onComplete?: () => void;
}

const QuizModule: React.FC<QuizModuleProps> = ({ topic, onComplete }) => {
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [loading, setLoading] = useState(true);
  const [score, setScore] = useState(0);

  useEffect(() => {
    let mounted = true;
    const fetchQuestions = async () => {
      setLoading(true);
      const data = await generateQuizQuestions(topic);
      if (mounted) {
        setQuestions(data);
        setLoading(false);
      }
    };
    fetchQuestions();
    return () => { mounted = false; };
  }, [topic]);

  const handleOptionClick = (index: number) => {
    if (isAnswered) return;
    setSelectedOption(index);
    setIsAnswered(true);
    if (index === questions[currentIndex].correctAnswerIndex) {
      setScore(s => s + 1);
    }
  };

  const nextQuestion = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setSelectedOption(null);
      setIsAnswered(false);
    } else {
      if (onComplete) onComplete();
      // Reset for endless play or handle completion
      setCurrentIndex(0);
      setSelectedOption(null);
      setIsAnswered(false);
      setScore(0);
      setLoading(true);
      // Refetch for fresh questions
      generateQuizQuestions(topic).then(data => {
        setQuestions(data);
        setLoading(false);
      });
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 h-64 glass-panel rounded-xl">
        <Loader2 className="w-8 h-8 text-neon-blue animate-spin mb-4" />
        <p className="text-neon-blue font-mono text-sm tracking-wider">GENERATING CHALLENGES...</p>
      </div>
    );
  }

  if (questions.length === 0) return <div>Failed to load quiz.</div>;

  const currentQ = questions[currentIndex];

  return (
    <div className="w-full max-w-2xl mx-auto glass-panel p-6 md:p-8 rounded-2xl relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 right-0 p-4 opacity-10">
        <Brain size={100} />
      </div>

      <div className="relative z-10">
        <div className="flex justify-between items-center mb-6 border-b border-white/10 pb-4">
          <h3 className="text-xl font-bold text-neon-purple tracking-widest uppercase">
            Challenge {currentIndex + 1}/{questions.length}
          </h3>
          <span className="font-mono text-sm text-gray-400">Score: {score}</span>
        </div>

        <h2 className="text-xl md:text-2xl font-bold mb-8 text-white leading-relaxed">
          {currentQ.question}
        </h2>

        <div className="space-y-4">
          {currentQ.options.map((option, idx) => {
            let btnClass = "w-full text-left p-4 rounded-lg border transition-all duration-300 transform ";
            
            if (isAnswered) {
              if (idx === currentQ.correctAnswerIndex) {
                btnClass += "bg-green-500/20 border-green-500 text-green-100";
              } else if (idx === selectedOption) {
                btnClass += "bg-red-500/20 border-red-500 text-red-100";
              } else {
                btnClass += "border-white/10 text-gray-500 opacity-50";
              }
            } else {
              btnClass += "bg-space-700/50 border-white/10 hover:border-neon-blue hover:bg-space-700 hover:scale-[1.01]";
            }

            return (
              <button
                key={idx}
                onClick={() => handleOptionClick(idx)}
                disabled={isAnswered}
                className={btnClass}
              >
                <div className="flex items-center justify-between">
                  <span>{option}</span>
                  {isAnswered && idx === currentQ.correctAnswerIndex && <CheckCircle className="text-green-500" size={20} />}
                  {isAnswered && idx === selectedOption && idx !== currentQ.correctAnswerIndex && <XCircle className="text-red-500" size={20} />}
                </div>
              </button>
            );
          })}
        </div>

        {isAnswered && (
          <div className="mt-6 p-4 rounded-lg bg-white/5 border border-white/10 animate-fade-in">
            <p className="text-sm text-neon-blue font-bold mb-1">DATA ANALYSIS:</p>
            <p className="text-gray-300 text-sm leading-relaxed">{currentQ.explanation}</p>
            <button 
              onClick={nextQuestion}
              className="mt-4 flex items-center space-x-2 bg-neon-blue hover:bg-neon-blue/80 text-space-900 font-bold py-2 px-6 rounded-full transition-colors"
            >
              <span>Next Challenge</span>
              <ArrowRight size={18} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default QuizModule;
