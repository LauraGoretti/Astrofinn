import React, { useState, useEffect, useMemo } from 'react';
import { GameMode } from '../../types';
import { 
  Users, 
  Play, 
  RotateCw, 
  ArrowRight, 
  CheckCircle2, 
  AlertCircle,
  Calendar,
  Info,
  ChevronRight,
  Rotate3d,
  Move,
  Sun,
  Globe
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import TiltOrbitVisuals from './TiltOrbitVisuals';

enum GamePhase {
  WARMUP = 'warmup',
  PHASE1 = 'phase1', // Sun & Earth - No motion
  PHASE2 = 'phase2', // Rotation - No tilt
  PHASE3 = 'phase3', // Tilt + Rotation
  PHASE4 = 'phase4', // Orbit Simulator
  FINISHED = 'finished'
}

interface OrbitCommandProps {
  mode: GameMode;
}

const OrbitCommand: React.FC<OrbitCommandProps> = ({ mode }) => {
  const [phase, setPhase] = useState<GamePhase>(GamePhase.WARMUP);
  const [feedback, setFeedback] = useState<{ message: string; type: 'success' | 'error' | 'info' | null }>({ message: '', type: null });
  const [orbitDate, setOrbitDate] = useState<Date>(new Date(2024, 5, 21)); // Default to Summer Solstice
  const [phase4Task, setPhase4Task] = useState<'spring' | 'winter' | 'summer'>('spring');
  const [completedTasks, setCompletedTasks] = useState<string[]>([]);

  const handleChoice = (choice: string) => {
    switch (phase) {
      case GamePhase.PHASE1:
        if (choice === 'rotation') {
          setFeedback({ 
            message: "Yes! Rotation creates day and night. Click the Rotation button again to activate Earth’s daily routine!", 
            type: 'success' 
          });
          setTimeout(() => {
            setPhase(GamePhase.PHASE2);
            setFeedback({ message: '', type: null });
          }, 3000);
        } else if (choice === 'move_sun') {
          setFeedback({ 
            message: "Interesting idea! But in space, the Sun doesn’t move like a flashlight in your hand. Try another option.", 
            type: 'error' 
          });
        } else {
          setFeedback({ 
            message: "If nothing moves, nothing changes! We would not get day and night. Try another option.", 
            type: 'error' 
          });
        }
        break;

      case GamePhase.PHASE2:
        if (choice === 'tilt') {
          setFeedback({ 
            message: "Click on the Tilt button and restore our beloved summer again!", 
            type: 'success' 
          });
          setTimeout(() => {
            setPhase(GamePhase.PHASE3);
            setFeedback({ message: '', type: null });
          }, 3000);
        } else if (choice === 'closer') {
          setFeedback({ 
            message: "Good thought! But Earth’s distance to the Sun changes only a little during the year. That is not the main reason for long summer days in Finland. Try another option.", 
            type: 'error' 
          });
        } else {
          setFeedback({ 
            message: "If we turn off the Sun, everything is dark and cold… forever. That doesn’t sound like Finnish summer! Try another option.", 
            type: 'error' 
          });
        }
        break;

      case GamePhase.PHASE3:
        if (choice === 'revolution') {
          setFeedback({ 
            message: "Exactly! The Earth orbits (revolves) around the Sun. Click the Revolution button to start the orbit simulator!", 
            type: 'success' 
          });
          setTimeout(() => {
            setPhase(GamePhase.PHASE4);
            setFeedback({ message: '', type: null });
          }, 3000);
        } else if (choice === 'spin_faster') {
          setFeedback({ 
            message: "Spinning faster gives us shorter days and nights, but it doesn’t change which hemisphere points toward the Sun. Try another option.", 
            type: 'error' 
          });
        } else {
          setFeedback({ 
            message: "Changing the Sun’s temperature would affect the whole solar system. Seasons on Earth come from Earth’s movements, not from the Sun cooling down or heating up. Try another option.", 
            type: 'error' 
          });
        }
        break;
    }
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const [year, month, day] = e.target.value.split('-').map(Number);
    const newDate = new Date(year, month - 1, day);
    setOrbitDate(newDate);

    // Check tasks
    const m = newDate.getMonth();
    if (phase4Task === 'spring' && (m === 2 || m === 3)) {
      if (!completedTasks.includes('spring')) setCompletedTasks([...completedTasks, 'spring']);
    } else if (phase4Task === 'winter' && (m === 11 || m === 0)) {
      if (!completedTasks.includes('winter')) setCompletedTasks([...completedTasks, 'winter']);
    } else if (phase4Task === 'summer' && (m === 5 || m === 6)) {
      if (!completedTasks.includes('summer')) setCompletedTasks([...completedTasks, 'summer']);
    }
  };

  const dayLength = useMemo(() => {
    // Very simplified day length calculation for Oulu (65N)
    const dayOfYear = Math.floor((orbitDate.getTime() - new Date(orbitDate.getFullYear(), 0, 0).getTime()) / 86400000);
    const phi = 65 * Math.PI / 180;
    const delta = 23.45 * Math.PI / 180 * Math.sin(2 * Math.PI * (284 + dayOfYear) / 365);
    const cosH = -Math.tan(phi) * Math.tan(delta);
    
    if (cosH <= -1) return 24;
    if (cosH >= 1) return 0;
    
    const H = Math.acos(cosH);
    return (2 * H * 24) / (2 * Math.PI);
  }, [orbitDate]);

  const renderWarmup = () => (
    <div className="max-w-2xl mx-auto space-y-8 py-12">
      <div className="text-center space-y-4">
        <h2 className="text-3xl font-bold text-white">Step 1 – Talk about seasons, light, and darkness</h2>
        <p className="text-gray-400">Turn to your classmates and share your thoughts.</p>
      </div>

      <div className="grid gap-6">
        <div className="glass-panel p-6 rounded-2xl border-l-4 border-neon-pink">
          <h3 className="font-bold text-lg mb-2 flex items-center">
            <Users className="mr-2 text-neon-pink" size={20} />
            What’s your favorite season?
          </h3>
          <p className="text-gray-300">“What’s your favorite season? How does it look like?” (snow, rain, green trees, flowers, etc.)</p>
        </div>

        <div className="glass-panel p-6 rounded-2xl border-l-4 border-neon-blue">
          <h3 className="font-bold text-lg mb-2 flex items-center">
            <Calendar className="mr-2 text-neon-blue" size={20} />
            Daylight and your birthday
          </h3>
          <p className="text-gray-300">“How long is the daylight during your birthday every year? What about the temperature?”</p>
        </div>

        <div className="glass-panel p-6 rounded-2xl border-l-4 border-neon-purple">
          <h3 className="font-bold text-lg mb-2 flex items-center">
            <Info className="mr-2 text-neon-purple" size={20} />
            Explaining dark winters and bright summers
          </h3>
          <p className="text-gray-300">“Can you imagine an explanation about why winters are dark and cold and summers are hot and bright?”</p>
        </div>
      </div>

      <div className="bg-space-800/50 p-6 rounded-2xl border border-white/5 text-center">
        <p className="text-gray-300 italic mb-6">
          “Good group discussion! Now let’s find out the reasons behind your ideas and all the topics you discussed. Time to start the exploration mission!”
        </p>
        
        <div className="flex items-center justify-center gap-4 mb-8">
          <img 
            src="https://raw.githubusercontent.com/LauraGoretti/Astrofinn/main/icons/astronaut.png" 
            alt="Astronaut" 
            className="w-12 h-12"
            referrerPolicy="no-referrer"
          />
          <div className="bg-white text-space-900 p-3 rounded-2xl rounded-bl-none text-sm font-medium relative">
            “Winter and summer feel so different… but the Sun is the same star. Let’s uncover what the Earth is doing!”
          </div>
        </div>

        <button 
          onClick={() => setPhase(GamePhase.PHASE1)}
          className="btn-primary px-8 py-4 text-lg group"
        >
          Start Exploration Mission
          <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" />
        </button>
      </div>
    </div>
  );

  const renderPhaseContent = () => {
    switch (phase) {
      case GamePhase.PHASE1:
        return {
          title: "From Flashlight & Ball to Sun & Earth",
          text: "Remember the magic flashlight and the ball from the last mission? Now we replace the flashlight with the Sun and the ball with the Earth.",
          questions: [
            "Remember how the flashlight influenced the ball? Now let’s think about the Earth!",
            "What areas do you think will be hotter, just like the magic flashlight made the ball warm up?",
            "Where do you think it would be colder?"
          ],
          prompt: "Well, but now let’s think about our reality. Is it always bright all the time on Earth?",
          question: "Which movement creates day and night on Earth?",
          options: [
            { id: 'move_sun', label: 'Move the Sun side to side' },
            { id: 'stop', label: 'Stop all movement' },
            { id: 'rotation', label: 'Rotation – spin the Earth around its axis' }
          ]
        };
      case GamePhase.PHASE2:
        return {
          title: "Rotation Without Tilt",
          text: "Now we have day and night! The Earth is spinning around its axis.",
          questions: [
            "Now we have day and night! But there’s something weird…",
            "In this model, the North Pole and South Pole are completely aligned straight up and down.",
            "Look at Finland. In this spinning Earth, can you see how Finland is dark for half of the day and bright for the other half?",
            "Is it like reality? Think about your summers here. How long are your days in summer?"
          ],
          prompt: "Something is wrong with this ‘perfect’ spinning Earth. How can we fix it?",
          question: "What should we do to make the model more like real Earth, where summer days in Finland are much longer?",
          options: [
            { id: 'closer', label: 'Move the Earth closer to the Sun' },
            { id: 'tilt', label: 'Tilt the Earth’s axis' },
            { id: 'off', label: 'Turn off the Sun' }
          ]
        };
      case GamePhase.PHASE3:
        return {
          title: "Tilt + Rotation",
          text: "Nice! Now we have summer in the northern hemisphere. The North Pole is tilted towards the Sun.",
          questions: [
            "Nice! Now we have summer! But… hmmm, what’s wrong now?",
            "Is it always warm summer in Finland? What about skiing season? And kaamos?",
            "Look at the South Pole. What’s going on there? It looks like it’s always night there…"
          ],
          prompt: "Does Finland have summer forever in real life? Does Antarctica stay in night forever?",
          question: "What movement is missing in our model so that places on Earth don’t stay in eternal summer or eternal winter?",
          options: [
            { id: 'spin_faster', label: 'Rotation – spin faster' },
            { id: 'revolution', label: 'Revolution – move Earth around the Sun' },
            { id: 'colder', label: 'Make the Sun colder' }
          ]
        };
      default:
        return null;
    }
  };

  const phaseContent = renderPhaseContent();

  if (phase === GamePhase.WARMUP) return renderWarmup();

  if (phase === GamePhase.FINISHED) {
    return (
      <div className="max-w-2xl mx-auto py-12 text-center space-y-8">
        <div className="inline-flex p-4 bg-green-500/20 rounded-full">
          <CheckCircle2 className="text-green-500 w-16 h-16" />
        </div>
        <h2 className="text-4xl font-bold text-white">Mission Accomplished!</h2>
        
        <div className="glass-panel p-8 rounded-2xl space-y-4 text-left">
          <p className="text-gray-300 text-lg">You have now:</p>
          <ul className="space-y-3">
            <li className="flex items-center text-white">
              <CheckCircle2 className="text-green-500 mr-3" size={20} />
              Used rotation to create day and night.
            </li>
            <li className="flex items-center text-white">
              <CheckCircle2 className="text-green-500 mr-3" size={20} />
              Used tilt to create longer and shorter days in different places.
            </li>
            <li className="flex items-center text-white">
              <CheckCircle2 className="text-green-500 mr-3" size={20} />
              Used revolution to see how seasons change around the year.
            </li>
          </ul>
        </div>

        <div className="flex items-center justify-center gap-4">
          <img 
            src="https://raw.githubusercontent.com/LauraGoretti/Astrofinn/main/icons/astronaut.png" 
            alt="Astronaut" 
            className="w-16 h-16"
            referrerPolicy="no-referrer"
          />
          <div className="bg-white text-space-900 p-4 rounded-2xl rounded-bl-none font-bold shadow-xl">
            “Great job, space explorer! Now let’s see all this happening in the whole solar system. Are you ready?”
          </div>
        </div>

        <button 
          onClick={() => window.location.reload()}
          className="btn-primary px-12 py-4 text-xl"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row h-full w-full gap-6">
      {/* Simulation View */}
      <div className="flex-1 relative flex flex-col min-h-[400px]">
        <TiltOrbitVisuals 
          phase={phase === GamePhase.PHASE4 ? 'phase4' : 'phase1'} 
          isRotating={phase !== GamePhase.PHASE1}
          isTilted={phase === GamePhase.PHASE3 || phase === GamePhase.PHASE4}
          isRevolving={phase === GamePhase.PHASE4}
          orbitDate={orbitDate}
        />
        
        {/* Phase Info Overlay */}
        <div className="absolute top-4 left-4 p-4 glass-panel rounded-xl border-l-4 border-neon-blue max-w-md pointer-events-none">
          <h3 className="text-lg font-bold text-white mb-2">{phaseContent?.title || "Orbit Simulator"}</h3>
          <p className="text-sm text-gray-300 leading-relaxed">{phaseContent?.text || "Perfect! Welcome to the orbit simulator according to the dates."}</p>
        </div>

        {/* Feedback Overlay */}
        <AnimatePresence>
          {feedback.type && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className={`absolute bottom-4 left-1/2 -translate-x-1/2 p-4 rounded-xl shadow-2xl border flex items-center gap-3 max-w-lg z-50 ${
                feedback.type === 'success' ? 'bg-green-900/90 border-green-500 text-green-100' :
                feedback.type === 'error' ? 'bg-red-900/90 border-red-500 text-red-100' :
                'bg-blue-900/90 border-blue-500 text-blue-100'
              }`}
            >
              {feedback.type === 'success' ? <CheckCircle2 size={24} /> : <AlertCircle size={24} />}
              <p className="font-medium">{feedback.message}</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Sidebar Controls/Tasks */}
      <div className="w-full lg:w-[450px] shrink-0 flex flex-col gap-4 overflow-y-auto max-h-full pb-6">
        {phase !== GamePhase.PHASE4 ? (
          <div className="space-y-4">
            <div className="bg-space-800/80 p-6 rounded-xl border border-white/10 space-y-4">
              <h4 className="font-bold text-neon-purple uppercase tracking-widest text-xs">Scaffolding Questions</h4>
              <div className="space-y-3">
                {phaseContent?.questions.map((q, i) => (
                  <div key={i} className="flex gap-3 text-sm text-gray-300 bg-black/30 p-3 rounded-lg border-l-2 border-neon-purple">
                    <Info size={16} className="shrink-0 mt-0.5 text-neon-purple" />
                    <p>{q}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="glass-panel p-6 rounded-xl border border-neon-blue space-y-6">
              <div className="space-y-2">
                <p className="text-neon-blue font-bold text-sm uppercase tracking-wider">Current Challenge</p>
                <p className="text-white text-lg font-medium">{phaseContent?.prompt}</p>
              </div>

              <div className="space-y-3">
                <p className="text-gray-400 text-sm font-mono">{phaseContent?.question}</p>
                <div className="grid gap-2">
                  {phaseContent?.options.map((opt) => (
                    <button
                      key={opt.id}
                      onClick={() => handleChoice(opt.id)}
                      className="w-full p-4 text-left rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-neon-blue transition-all group flex items-center justify-between"
                    >
                      <span className="text-gray-200 group-hover:text-white">{opt.label}</span>
                      <ChevronRight size={18} className="text-gray-500 group-hover:text-neon-blue group-hover:translate-x-1 transition-all" />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="glass-panel p-6 rounded-xl border border-neon-blue space-y-6">
              <div className="flex items-center gap-3">
                <Calendar className="text-neon-blue" />
                <h3 className="text-xl font-bold">Orbit Simulator</h3>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs text-gray-500 uppercase mb-2">Select Date</label>
                  <div className="flex gap-2 mb-3 overflow-x-auto pb-2">
                    {[
                      { label: 'Spring', date: new Date(2024, 2, 21) },
                      { label: 'Summer', date: new Date(2024, 5, 21) },
                      { label: 'Autumn', date: new Date(2024, 8, 21) },
                      { label: 'Winter', date: new Date(2024, 11, 21) },
                    ].map((s) => (
                      <button
                        key={s.label}
                        onClick={() => {
                          setOrbitDate(s.date);
                          // Trigger task checks manually since handleDateChange won't be called
                          const m = s.date.getMonth();
                          if (phase4Task === 'spring' && (m === 2 || m === 3)) {
                            if (!completedTasks.includes('spring')) setCompletedTasks([...completedTasks, 'spring']);
                          } else if (phase4Task === 'winter' && (m === 11 || m === 0)) {
                            if (!completedTasks.includes('winter')) setCompletedTasks([...completedTasks, 'winter']);
                          } else if (phase4Task === 'summer' && (m === 5 || m === 6)) {
                            if (!completedTasks.includes('summer')) setCompletedTasks([...completedTasks, 'summer']);
                          }
                        }}
                        className="px-3 py-1 rounded-full bg-white/5 border border-white/10 hover:bg-neon-blue/20 hover:border-neon-blue text-xs transition-all whitespace-nowrap"
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>
                  <input 
                    type="date" 
                    value={orbitDate.toISOString().split('T')[0]}
                    onChange={handleDateChange}
                    className="w-full bg-space-900 border border-white/10 rounded-lg p-3 text-white focus:border-neon-blue outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-black/40 p-4 rounded-xl border border-white/5 text-center">
                    <p className="text-xs text-gray-500 uppercase mb-1">Daylight (Oulu)</p>
                    <p className="text-2xl font-bold text-yellow-400">{dayLength.toFixed(1)}h</p>
                  </div>
                  <div className="bg-black/40 p-4 rounded-xl border border-white/5 text-center">
                    <p className="text-xs text-gray-500 uppercase mb-1">Night (Oulu)</p>
                    <p className="text-2xl font-bold text-blue-400">{(24 - dayLength).toFixed(1)}h</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-space-800/80 p-6 rounded-xl border border-white/10 space-y-6">
              <h4 className="font-bold text-white flex items-center gap-2">
                <Play size={18} className="text-neon-green" />
                Mission Tasks
              </h4>

              <div className="space-y-4">
                <div className={`p-4 rounded-xl border transition-all ${phase4Task === 'spring' ? 'bg-neon-blue/10 border-neon-blue' : 'bg-black/20 border-white/5'}`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-sm">Task 1: Find Spring</span>
                    {completedTasks.includes('spring') && <CheckCircle2 className="text-green-500" size={18} />}
                  </div>
                  <p className="text-xs text-gray-400 mb-3">“Can you find spring in Finland? Choose a date in spring (March/April).”</p>
                  {completedTasks.includes('spring') ? (
                    <div className="space-y-2 text-xs text-gray-300">
                      <p>✅ Daytime and nighttime in Oulu are getting closer to equal.</p>
                      <button onClick={() => setPhase4Task('winter')} className="text-neon-blue hover:underline">Next Task →</button>
                    </div>
                  ) : (
                    <button onClick={() => setPhase4Task('spring')} className="text-xs text-neon-blue hover:underline">Active Task</button>
                  )}
                </div>

                <div className={`p-4 rounded-xl border transition-all ${phase4Task === 'winter' ? 'bg-neon-blue/10 border-neon-blue' : 'bg-black/20 border-white/5'}`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-sm">Task 2: Find Winter</span>
                    {completedTasks.includes('winter') && <CheckCircle2 className="text-green-500" size={18} />}
                  </div>
                  <p className="text-xs text-gray-400 mb-3">“Now, find winter in Finland. Choose a date in winter (Dec/Jan).”</p>
                  {completedTasks.includes('winter') ? (
                    <div className="space-y-2 text-xs text-gray-300">
                      <p>✅ Daytime is very short. Nights are very long.</p>
                      <button onClick={() => setPhase4Task('summer')} className="text-neon-blue hover:underline">Next Task →</button>
                    </div>
                  ) : (
                    <button onClick={() => setPhase4Task('winter')} className="text-xs text-neon-blue hover:underline">Switch to Task</button>
                  )}
                </div>

                <div className={`p-4 rounded-xl border transition-all ${phase4Task === 'summer' ? 'bg-neon-blue/10 border-neon-blue' : 'bg-black/20 border-white/5'}`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-sm">Task 3: Find Summer</span>
                    {completedTasks.includes('summer') && <CheckCircle2 className="text-green-500" size={18} />}
                  </div>
                  <p className="text-xs text-gray-400 mb-3">“Now find summer in Finland. Choose a date in summer (June/July).”</p>
                  {completedTasks.includes('summer') ? (
                    <div className="space-y-2 text-xs text-gray-300">
                      <p>✅ Daytime is very long. Nights are very short.</p>
                      <button 
                        onClick={() => setPhase(GamePhase.FINISHED)} 
                        className="w-full mt-2 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg font-bold transition-colors"
                      >
                        Complete Mission
                      </button>
                    </div>
                  ) : (
                    <button onClick={() => setPhase4Task('summer')} className="text-xs text-neon-blue hover:underline">Switch to Task</button>
                  )}
                </div>
              </div>
            </div>

            {completedTasks.length > 0 && (
              <div className="bg-white p-4 rounded-xl flex gap-3 shadow-xl">
                <img 
                  src="https://raw.githubusercontent.com/LauraGoretti/Astrofinn/main/icons/astronaut.png" 
                  alt="Astronaut" 
                  className="w-10 h-10"
                  referrerPolicy="no-referrer"
                />
                <p className="text-space-900 text-xs font-medium">
                  “Great observation! Seasons are not caused mainly by how far the Earth is from the Sun, but by the tilt of Earth’s axis.”
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default OrbitCommand;
