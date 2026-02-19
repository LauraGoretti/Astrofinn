import React, { useState, useEffect } from 'react';
import { QuizQuestion } from '../types';
import { generateQuizQuestions } from '../services/geminiService';
import { CheckCircle, XCircle, Brain, Loader2, ArrowRight } from 'lucide-react';

interface QuizModuleProps {
  topic: string;
  onComplete?: () => void;
  className?: string;
}

const QuizModule: React.FC<QuizModuleProps> = ({ topic, onComplete, className }) => {
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
      <div className={`flex flex-col items-center justify-center p-8 min-h-[300px] glass-panel rounded-2xl transition-all duration-300 ${className}`}>
        <Loader2 className="w-8 h-8 text-neon-blue animate-spin mb-3" />
        <p className="text-neon-blue font-mono text-xs tracking-wider animate-pulse">GENERATING CHALLENGES...</p>
      </div>
    );
  }

  if (questions.length === 0) return <div>Failed to load quiz.</div>;

  const currentQ = questions[currentIndex];

  return (
    <div className={`w-full max-w-2xl mx-auto glass-panel p-6 rounded-2xl relative overflow-hidden flex flex-col justify-center transition-all duration-300 shadow-xl border border-white/10 ${className}`}>
      {/* Background Decor */}
      <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
        <Brain size={100} />
      </div>

      <div className="relative z-10 w-full max-h-full overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent">
        <div className="flex justify-between items-center mb-6 border-b border-white/10 pb-3">
          <h3 className="text-xs font-bold text-neon-purple tracking-widest uppercase">
            Challenge {currentIndex + 1}/{questions.length}
          </h3>
          <span className="font-mono text-xs text-gray-400">Score: {score}</span>
        </div>

        {/* Question - Matches Mission Briefing Header Style */}
        <h2 className="text-lg font-bold text-white mb-6 leading-relaxed">
          {currentQ.question}
        </h2>

        <div className="space-y-3">
          {currentQ.options.map((option, idx) => {
            let btnClass = "w-full text-left p-4 rounded-xl border transition-all duration-200 transform group ";
            
            if (isAnswered) {
              if (idx === currentQ.correctAnswerIndex) {
                btnClass += "bg-green-500/20 border-green-500/50 shadow-[0_0_15px_rgba(34,197,94,0.2)]";
              } else if (idx === selectedOption) {
                btnClass += "bg-red-500/20 border-red-500/50";
              } else {
                btnClass += "border-white/5 text-gray-600 opacity-50";
              }
            } else {
              btnClass += "bg-space-800/80 border-white/10 hover:border-neon-blue hover:bg-space-700 hover:scale-[1.01] hover:shadow-lg";
            }

            return (
              <button
                key={idx}
                onClick={() => handleOptionClick(idx)}
                disabled={isAnswered}
                className={btnClass}
              >
                <div className="flex items-center justify-between">
                  {/* Options - Matches Mission Briefing Body Style */}
                  <span className={`text-sm font-medium transition-colors leading-relaxed ${isAnswered ? (idx === currentQ.correctAnswerIndex ? 'text-green-100' : idx === selectedOption ? 'text-red-100' : '') : 'text-gray-300 group-hover:text-white'}`}>
                    {option}
                  </span>
                  {isAnswered && idx === currentQ.correctAnswerIndex && <CheckCircle className="text-green-400 shrink-0 ml-3" size={18} />}
                  {isAnswered && idx === selectedOption && idx !== currentQ.correctAnswerIndex && <XCircle className="text-red-400 shrink-0 ml-3" size={18} />}
                </div>
              </button>
            );
          })}
        </div>

        {isAnswered && (
          <div className="mt-6 p-4 rounded-xl bg-space-800/50 border border-neon-blue/20 animate-fade-in-up backdrop-blur-sm">
            <p className="text-xs text-neon-blue font-bold mb-2 tracking-wider uppercase">Scientific Explanation</p>
            <p className="text-gray-300 text-sm leading-relaxed">{currentQ.explanation}</p>
            <button 
              onClick={nextQuestion}
              className="mt-4 flex items-center space-x-2 bg-neon-blue hover:bg-cyan-400 text-space-900 font-bold py-2 px-6 rounded-full transition-all shadow-lg shadow-neon-blue/20 hover:shadow-neon-blue/40 w-full md:w-auto justify-center text-sm"
            >
              <span>Next Challenge</span>
              <ArrowRight size={16} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default QuizModule;