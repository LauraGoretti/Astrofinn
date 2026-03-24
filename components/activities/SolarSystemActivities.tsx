import React, { useState } from 'react';
import { CheckCircle2, Circle, ArrowRight, Play, Users, PenTool, Rocket } from 'lucide-react';
import { motion } from 'motion/react';

interface SolarSystemActivitiesProps {
  onComplete: () => void;
  setBackIntercept?: (intercept: { handler: () => boolean } | null) => void;
}

enum ActivityPhase {
  INTRO_1,
  ACTIVITY_1,
  INTRO_2,
  ACTIVITY_2
}

export const SolarSystemActivities: React.FC<SolarSystemActivitiesProps> = ({ onComplete, setBackIntercept }) => {
  const [phase, setPhase] = useState<ActivityPhase>(ActivityPhase.INTRO_1);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);

  React.useEffect(() => {
    if (setBackIntercept) {
      setBackIntercept({
        handler: () => {
          if (phase === ActivityPhase.ACTIVITY_2) {
            setPhase(ActivityPhase.INTRO_2);
            return true;
          }
          if (phase === ActivityPhase.INTRO_2) {
            setPhase(ActivityPhase.ACTIVITY_1);
            return true;
          }
          if (phase === ActivityPhase.ACTIVITY_1) {
            setPhase(ActivityPhase.INTRO_1);
            return true;
          }
          return false;
        }
      });
    }
    return () => {
      if (setBackIntercept) setBackIntercept(null);
    };
  }, [phase, setBackIntercept]);

  const toggleStep = (step: number) => {
    if (completedSteps.includes(step)) {
      setCompletedSteps(completedSteps.filter(s => s !== step));
    } else {
      setCompletedSteps([...completedSteps, step]);
    }
  };

  const renderAstronautBubble = (text: string) => (
    <div className="astronaut-box animate-fade-in w-full max-w-7xl mx-auto">
      <img 
        src="https://raw.githubusercontent.com/LauraGoretti/Astrofinn/main/icons/astronaut.png" 
        alt="Astronaut" 
        className="w-16 h-16 shrink-0 drop-shadow-[0_0_10px_rgba(0,255,255,0.5)]"
        referrerPolicy="no-referrer"
      />
      <p className="text-gray-200 text-base leading-relaxed font-medium whitespace-pre-wrap">{text}</p>
    </div>
  );

  return (
    <div className="w-full h-full flex flex-col items-center justify-center p-4 bg-space-900 relative overflow-y-auto scrollbar-hide">
      {/* Background elements */}
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-30 pointer-events-none"></div>
      <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-neon-blue/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-neon-pink/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="z-10 w-full max-w-7xl">
        {phase === ActivityPhase.INTRO_1 && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8 flex flex-col items-center"
          >
            {renderAstronautBubble("Hello explorer!\n\nYou made it far! Let's just review what you've learned regarding Earth, Moon, and Sun movements (in this app and in your classroom).\n\nFor this you will play a fun game in groups of 4 people.")}
            
            <button 
              onClick={() => setPhase(ActivityPhase.ACTIVITY_1)}
              className="mt-8 btn-primary px-8 py-3 text-xl font-bold"
            >
              <Play className="mr-3" /> Start Activity 1: The Astros Dance
            </button>
          </motion.div>
        )}

        {phase === ActivityPhase.ACTIVITY_1 && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-panel w-full"
          >
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center justify-center">
              <Users className="mr-3 text-neon-blue" /> The Astros Dance
              <img 
                src="https://raw.githubusercontent.com/LauraGoretti/Astrofinn/main/icons/astronaut.png" 
                alt="Astronaut" 
                className="w-8 h-8 ml-3 drop-shadow-[0_0_8px_rgba(0,255,255,0.4)]"
                referrerPolicy="no-referrer"
              />
            </h2>
            <p className="text-gray-300 mb-6 text-center text-base leading-relaxed">Work in groups of 4. Complete each step and check it off!</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
              {[
                "1 - Open any AI of your choice and ask it to randomly assign the roles of Commander, Sun, Earth, and Moon to each one of your group members (do not enter your full name, just first name to protect your privacy).",
                "2 - Commander, prompt AI to suggest random combinations of location and its season, and moon phase (e.g. Summer in Finland with full moon, Spring in Brazil with new moon...). Don't show the others the result yet.",
                "3 - Now the Commander must tell the combination that was generated and the other players must dance into the right places!",
                "4- Repeat the process again to switch roles as many times as you wish!"
              ].map((step, index) => (
                <div 
                  key={index}
                  onClick={() => toggleStep(index)}
                  className={`p-4 rounded-xl border cursor-pointer transition-all flex items-start ${
                    completedSteps.includes(index) 
                      ? 'bg-green-900/20 border-green-500/50 text-gray-200' 
                      : 'bg-white/5 border-white/10 hover:bg-white/10 text-gray-300'
                  }`}
                >
                  <div className="mr-4 mt-1 shrink-0">
                    {completedSteps.includes(index) ? (
                      <CheckCircle2 className="text-green-400" size={24} />
                    ) : (
                      <Circle className="text-gray-500" size={24} />
                    )}
                  </div>
                  <p className="text-base leading-relaxed">{step}</p>
                </div>
              ))}
            </div>

            <div className="flex justify-center">
              <button 
                onClick={() => {
                  setPhase(ActivityPhase.INTRO_2);
                  setCompletedSteps([]);
                }}
                disabled={completedSteps.length < 4}
                className={`px-8 py-3 text-xl font-bold ${
                  completedSteps.length >= 4 
                    ? 'btn-primary' 
                    : 'bg-gray-700 text-gray-400 cursor-not-allowed rounded-full'
                }`}
              >
                Go to Activity 2 <ArrowRight className="ml-2" />
              </button>
            </div>
          </motion.div>
        )}

        {phase === ActivityPhase.INTRO_2 && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8 flex flex-col items-center"
          >
            {renderAstronautBubble("You guys rocked astro-dancing!\n\nNow let's keep the art alive and create something a bit crazy that will warm you up for this Exploration Mission of the Solar System View.")}
            
            <button 
              onClick={() => setPhase(ActivityPhase.ACTIVITY_2)}
              className="mt-8 btn-primary px-8 py-3 text-xl font-bold"
            >
              <PenTool className="mr-3" /> Start Activity 2
            </button>
          </motion.div>
        )}

        {phase === ActivityPhase.ACTIVITY_2 && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-panel w-full"
          >
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center justify-center">
              <PenTool className="mr-3 text-neon-pink" /> Activity 2
            </h2>
            
            <div className="bg-white/5 p-6 rounded-xl border border-white/10 mb-6">
              <p className="text-base leading-relaxed text-gray-200 text-center whitespace-pre-wrap">
                {"In pairs, groups, or working alone at home, choose a writing style (song, rap, poem, little story, etc) to express the correct order of all the planets of the Solar System!\n\nFollow your teacher's instructions on how and when to present your masterpiece.\n\nThen once you are ready, dive into the Solar System to see all planets and its features in the Exploration Mission."}
              </p>
            </div>

            <div className="flex justify-center">
              <button 
                onClick={onComplete}
                className="btn-primary px-8 py-3 text-xl font-bold"
              >
                <Rocket className="mr-3" /> Start Exploration Mission
              </button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};
