import React, { useState } from 'react';
import { CheckCircle2, Circle, ArrowRight, Play, Users, PenTool, Rocket } from 'lucide-react';
import { motion } from 'motion/react';

interface SolarSystemActivitiesProps {
  onComplete: () => void;
}

enum ActivityPhase {
  INTRO_1,
  ACTIVITY_1,
  INTRO_2,
  ACTIVITY_2
}

export const SolarSystemActivities: React.FC<SolarSystemActivitiesProps> = ({ onComplete }) => {
  const [phase, setPhase] = useState<ActivityPhase>(ActivityPhase.INTRO_1);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);

  const toggleStep = (step: number) => {
    if (completedSteps.includes(step)) {
      setCompletedSteps(completedSteps.filter(s => s !== step));
    } else {
      setCompletedSteps([...completedSteps, step]);
    }
  };

  const renderAstronautBubble = (text: string) => (
    <div className="flex items-start space-x-4 bg-space-800/90 p-6 rounded-2xl border border-neon-blue/30 animate-fade-in max-w-2xl mx-auto">
      <img 
        src="https://raw.githubusercontent.com/LauraGoretti/Astrofinn/main/icons/astronaut.png" 
        alt="Astronaut" 
        className="w-16 h-16 shrink-0 drop-shadow-[0_0_10px_rgba(0,255,255,0.5)]"
        referrerPolicy="no-referrer"
      />
      <p className="text-gray-200 text-lg leading-relaxed font-medium">"{text}"</p>
    </div>
  );

  return (
    <div className="w-full h-full min-h-[600px] flex flex-col items-center justify-center p-8 bg-space-900 relative overflow-y-auto">
      {/* Background elements */}
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-30 pointer-events-none"></div>
      <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-neon-blue/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-neon-pink/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="z-10 w-full max-w-4xl">
        {phase === ActivityPhase.INTRO_1 && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8 flex flex-col items-center"
          >
            {renderAstronautBubble("Hello explorer! You made it far! Let's just review what you've learned regarding Earth, Moon, and Sun movements (in this app and in your classroom). For this you will play a fun game in groups of 4 people.")}
            
            <button 
              onClick={() => setPhase(ActivityPhase.ACTIVITY_1)}
              className="mt-8 px-8 py-4 bg-neon-blue/20 hover:bg-neon-blue/30 border border-neon-blue text-white rounded-full font-bold text-xl flex items-center transition-all hover:scale-105 hover:shadow-[0_0_20px_rgba(0,255,255,0.4)]"
            >
              <Play className="mr-3" /> Start Activity 1: The Astros Dance
            </button>
          </motion.div>
        )}

        {phase === ActivityPhase.ACTIVITY_1 && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-panel p-8 rounded-2xl border border-neon-blue/30"
          >
            <h2 className="text-3xl font-bold text-white mb-6 flex items-center">
              <Users className="mr-3 text-neon-blue" /> The Astros Dance
            </h2>
            <p className="text-gray-300 mb-8 text-lg">Work in groups of 4. Complete each step below and check it off when done!</p>
            
            <div className="space-y-4 mb-8">
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
                  <p className="text-lg leading-relaxed">{step}</p>
                </div>
              ))}
            </div>

            <div className="flex justify-end">
              <button 
                onClick={() => {
                  setPhase(ActivityPhase.INTRO_2);
                  setCompletedSteps([]);
                }}
                disabled={completedSteps.length < 4}
                className={`px-6 py-3 rounded-full font-bold flex items-center transition-all ${
                  completedSteps.length >= 4 
                    ? 'bg-neon-pink text-white hover:bg-pink-600 hover:shadow-[0_0_15px_rgba(255,20,147,0.5)]' 
                    : 'bg-gray-700 text-gray-400 cursor-not-allowed'
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
            {renderAstronautBubble("You guys rocked astro-dancing! Now let's keep the art alive and create something a bit crazy that will warm you up for this Exploration Mission of the Solar System View.")}
            
            <button 
              onClick={() => setPhase(ActivityPhase.ACTIVITY_2)}
              className="mt-8 px-8 py-4 bg-neon-pink/20 hover:bg-neon-pink/30 border border-neon-pink text-white rounded-full font-bold text-xl flex items-center transition-all hover:scale-105 hover:shadow-[0_0_20px_rgba(255,20,147,0.4)]"
            >
              <PenTool className="mr-3" /> Start Activity 2
            </button>
          </motion.div>
        )}

        {phase === ActivityPhase.ACTIVITY_2 && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-panel p-8 rounded-2xl border border-neon-pink/30"
          >
            <h2 className="text-3xl font-bold text-white mb-6 flex items-center">
              <PenTool className="mr-3 text-neon-pink" /> Activity 2
            </h2>
            
            <div className="bg-white/5 p-6 rounded-xl border border-white/10 mb-8 space-y-4">
              <p className="text-lg text-gray-200">
                In pairs, groups, or working alone at home, choose a writing style (song, rap, poem, little story, etc) to express the correct order of all the planets of the Solar System! Follow your teacher's instructions on how and when to present your masterpiece. Then once you are ready, dive into the Solar System to see all planets and its features in the Exploration Mission
              </p>
            </div>

            <div className="flex justify-center mt-12">
              <button 
                onClick={onComplete}
                className="px-8 py-4 bg-gradient-to-r from-neon-blue to-neon-pink text-white rounded-full font-bold text-xl flex items-center transition-all hover:scale-105 hover:shadow-[0_0_30px_rgba(255,255,255,0.3)]"
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
