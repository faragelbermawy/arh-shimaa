import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { BrainCircuit, CheckCircle2, XCircle, ArrowRight, RotateCcw, Loader2, Info } from 'lucide-react';
// Fixed: Removed missing INITIAL_QUIZ import from constants
import { gemini } from '../services/geminiService';
import { UserProgress } from '../types';

const Quiz: React.FC = () => {
  const { moduleId } = useParams<{ moduleId: string }>();
  const navigate = useNavigate();
  const [questions, setQuestions] = useState<any[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isFinished, setIsFinished] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Fixed: Updated fetchQuiz to handle missing static quiz data
  useEffect(() => {
    const fetchQuiz = async () => {
      setIsLoading(true);
      try {
        const generated = await gemini.generateQuiz(moduleId || 'Infection Control');
        if (generated && Array.isArray(generated) && generated.length > 0) {
          setQuestions(generated);
        } else {
          throw new Error("Invalid generated quiz");
        }
      } catch (e) {
        // Fallback quiz in case of AI service unavailability
        setQuestions([
          {
            question: "What is the single most important practice for preventing the transmission of pathogens?",
            options: ["Hand Hygiene", "Wearing Gloves", "Using Antibiotics", "Closing Doors"],
            correctAnswer: 0,
            explanation: "Hand hygiene is considered the most effective way to prevent the spread of infections in healthcare settings."
          },
          {
            question: "According to WHO, when should hand hygiene be performed?",
            options: ["Only before touching a patient", "Only after touching a patient", "Before and after patient contact", "At least once per shift"],
            correctAnswer: 2,
            explanation: "The WHO 5 Moments require hand hygiene both before and after patient contact to protect both the patient and the environment."
          },
          {
            question: "What does MDRO stand for?",
            options: ["Most Dangerous Resistant Organisms", "Multi-Drug Resistant Organisms", "Medical Device Risk Observations", "Multiple Disease Related Outbreaks"],
            correctAnswer: 1,
            explanation: "MDRO stands for Multi-Drug Resistant Organisms, bacteria that have developed resistance to one or more classes of antimicrobial agents."
          }
        ]);
      } finally {
        setIsLoading(false);
      }
    };
    fetchQuiz();
  }, [moduleId]);

  const saveProgress = (finalScore: number) => {
    if (!moduleId) return;
    
    const saved = localStorage.getItem('mdro_user_progress');
    // Fix: Ensure all UserProgress fields are initialized correctly
    let progress: UserProgress = saved ? JSON.parse(saved) : {
      completedModules: [],
      quizScores: {},
      handWashStreak: 0,
      lastHandWash: '',
      totalHandWashes: 0,
      ppeDonningCount: 0,
      ppeDoffingCount: 0
    };

    // Update score if better than previous or doesn't exist
    const prevScore = progress.quizScores[moduleId] || 0;
    if (finalScore > prevScore) {
      progress.quizScores[moduleId] = finalScore;
    }

    // Mark as completed if passed (e.g., at least 60% correct)
    const passThreshold = Math.ceil(questions.length * 0.6);
    if (finalScore >= passThreshold && !progress.completedModules.includes(moduleId)) {
      progress.completedModules.push(moduleId);
    }

    localStorage.setItem('mdro_user_progress', JSON.stringify(progress));
  };

  const handleOptionSelect = (idx: number) => {
    if (selectedOption !== null) return;
    setSelectedOption(idx);
    const isCorrect = idx === questions[currentIdx].correctAnswer;
    if (isCorrect) {
      setScore(s => s + 1);
    }
  };

  const nextQuestion = () => {
    if (currentIdx + 1 < questions.length) {
      setCurrentIdx(currentIdx + 1);
      setSelectedOption(null);
    } else {
      setIsFinished(true);
      saveProgress(score); // Save progress when finished
    }
  };

  if (isLoading) return (
    <div className="h-96 flex flex-col items-center justify-center gap-4">
      <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
      <p className="text-slate-500 font-medium">Generating your personalized assessment...</p>
    </div>
  );

  if (isFinished) return (
    <div className="max-w-md mx-auto text-center space-y-8 py-12 animate-in zoom-in-95 duration-500">
      <div className="w-32 h-32 bg-emerald-100 rounded-full flex items-center justify-center mx-auto shadow-inner">
        <CheckCircle2 className="w-16 h-16 text-emerald-600" />
      </div>
      <div>
        <h2 className="text-3xl font-bold">Quiz Complete!</h2>
        <p className="text-slate-500 mt-2">You scored {score} out of {questions.length}</p>
      </div>
      <div className="p-6 bg-white rounded-3xl border border-slate-100 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-wider text-slate-400 mb-2">Expert Feedback</p>
        <p className="text-slate-700 italic">
          {score === questions.length 
            ? "Outstanding work! You have a firm grasp on these protocols." 
            : score >= questions.length * 0.6
              ? "Good effort. You've passed the module requirement!"
              : "Keep practicing. Review the explanations to strengthen your clinical knowledge."}
        </p>
      </div>
      <div className="flex gap-4">
        <button 
          onClick={() => navigate('/')} 
          className="flex-1 bg-slate-800 text-white py-4 rounded-2xl font-bold hover:bg-slate-900 transition-all"
        >
          Return to Dashboard
        </button>
        <button 
          onClick={() => {
            setIsFinished(false);
            setCurrentIdx(0);
            setScore(0);
            setSelectedOption(null);
          }}
          className="flex items-center justify-center gap-2 px-6 bg-slate-100 text-slate-600 rounded-2xl hover:bg-slate-200 transition-all"
        >
          <RotateCcw className="w-5 h-5" />
        </button>
      </div>
    </div>
  );

  const currentQ = questions[currentIdx];

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BrainCircuit className="text-blue-600 w-6 h-6" />
          <span className="font-bold">Module Knowledge Check</span>
        </div>
        <div className="text-sm text-slate-400 font-medium">
          Question {currentIdx + 1} of {questions.length}
        </div>
      </div>

      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
        <div 
          className="h-full bg-blue-600 transition-all duration-500" 
          style={{ width: `${((currentIdx + 1) / questions.length) * 100}%` }}
        />
      </div>

      <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100">
        <h3 className="text-xl font-bold mb-8">{currentQ.question}</h3>
        <div className="space-y-4">
          {currentQ.options.map((opt: string, idx: number) => {
            const isCorrect = idx === currentQ.correctAnswer;
            const isSelected = idx === selectedOption;
            let styles = "border-slate-100 bg-slate-50 hover:border-blue-200 hover:bg-blue-50/30";
            
            if (selectedOption !== null) {
              if (isCorrect) styles = "border-emerald-500 bg-emerald-50 text-emerald-700 font-bold ring-2 ring-emerald-500/20";
              else if (isSelected) styles = "border-red-500 bg-red-50 text-red-700 font-bold ring-2 ring-red-500/20";
              else styles = "border-slate-50 bg-slate-50 opacity-40";
            }

            return (
              <button
                key={idx}
                disabled={selectedOption !== null}
                onClick={() => handleOptionSelect(idx)}
                className={`w-full text-left p-5 rounded-2xl border-2 transition-all flex items-center justify-between group ${styles}`}
              >
                <span>{opt}</span>
                {selectedOption !== null && isCorrect && <CheckCircle2 className="w-5 h-5" />}
                {selectedOption !== null && isSelected && !isCorrect && <XCircle className="w-5 h-5" />}
              </button>
            );
          })}
        </div>

        {selectedOption !== null && (
          <div className="mt-8 p-6 bg-blue-50/50 rounded-2xl animate-in slide-in-from-top-2">
            <h4 className="font-bold text-blue-800 mb-1 flex items-center gap-2">
              <Info className="w-4 h-4" /> Why this is important:
            </h4>
            <p className="text-sm text-blue-700 leading-relaxed">{currentQ.explanation}</p>
            <button 
              onClick={nextQuestion}
              className="mt-6 w-full flex items-center justify-center gap-2 bg-blue-600 text-white py-4 rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-200"
            >
              Next Question <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Quiz;