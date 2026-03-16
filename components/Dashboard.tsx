import React from 'react';
import { ActivityConfig, ActivityId } from '../types';
import { Globe, Sun, ThermometerSun, Snowflake, Orbit, Ruler } from 'lucide-react';

interface DashboardProps {
  onSelectActivity: (id: ActivityId) => void;
}

interface DashboardActivity extends ActivityConfig {
  shadowClass: string;
}

const activities: DashboardActivity[] = [
  {
    // Tile 1
    id: ActivityId.LIGHT_INCIDENCE,
    title: "Light Incidence and Heat",
    description: "Exploring Light, Shadows, and warmth",
    iconName: "ThermometerSun",
    color: "from-purple-500 to-pink-500",
    shadowClass: "group-hover:drop-shadow-[0_0_20px_rgba(236,72,153,0.8)]" // pink
  },
  {
    // Tile 2
    id: ActivityId.SEASONS,
    title: "Tilt and Orbit Consequences",
    description: "Exploring the reason behind seasons on Earth",
    iconName: "Orbit",
    color: "from-orange-500 to-red-500",
    shadowClass: "group-hover:drop-shadow-[0_0_20px_rgba(249,115,22,0.8)]" // orange
  },
  {
    // Tile 3
    id: ActivityId.ORBIT_REVOLUTION,
    title: "Solar System View",
    description: "Exploring all planets and their movements",
    iconName: "Globe",
    color: "from-blue-500 to-cyan-400",
    shadowClass: "group-hover:drop-shadow-[0_0_20px_rgba(6,182,212,0.8)]" // cyan
  },
  {
    // Tile 4
    id: ActivityId.SUNLIGHT_INTENSITY,
    title: "Real Sizes and Distances",
    description: "Discovering how vast space truly is",
    iconName: "Ruler",
    color: "from-yellow-400 to-orange-300",
    shadowClass: "group-hover:drop-shadow-[0_0_20px_rgba(250,204,21,0.8)]" // yellow
  }
];

const IconMap: Record<string, React.FC<any>> = {
  Globe, Sun, ThermometerSun, Snowflake, Orbit, Ruler
};

const Dashboard: React.FC<DashboardProps> = ({ onSelectActivity }) => {
  return (
    <div className="max-w-6xl mx-auto py-12 px-4">
      <div className="text-center mb-16 space-y-4 flex flex-col items-center">
        <h1 className="text-5xl md:text-7xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-white to-purple-400 flex items-center justify-center font-orbitron">
          ASTROFINN
          <img 
            src="https://raw.githubusercontent.com/LauraGoretti/Astrofinn/main/icons/astronaut.png" 
            alt="Astronaut" 
            className="w-16 h-16 md:w-20 md:h-20 ml-4 drop-shadow-[0_0_15px_rgba(0,255,255,0.5)]"
            referrerPolicy="no-referrer"
          />
        </h1>
      </div>

      <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
        {activities.map((act) => {
          const Icon = IconMap[act.iconName];
          return (
            <button
              key={act.id}
              onClick={() => onSelectActivity(act.id)}
              className="group relative h-64 rounded-2xl overflow-hidden glass-panel hover:border-white/40 transition-all duration-500 text-center p-6 flex flex-col items-center justify-center hover:scale-[1.02]"
            >
              {/* Gradient Background on Hover */}
              <div className={`absolute inset-0 bg-gradient-to-br ${act.color} opacity-0 group-hover:opacity-10 transition-opacity duration-500`}></div>

              <div className="mb-4 transform group-hover:scale-110 transition-transform duration-500 z-10">
                <Icon className={`w-16 h-16 text-white/80 group-hover:text-white transition-all duration-500 drop-shadow-[0_0_10px_rgba(255,255,255,0.1)] ${act.shadowClass}`} />
              </div>

              <div className="z-10">
                <h3 className="text-2xl font-bold text-white mb-2 group-hover:text-cyan-200 transition-colors">{act.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed group-hover:text-gray-200">{act.description}</p>
              </div>

              <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity transform translate-x-4 group-hover:translate-x-0 text-cyan-400 z-10">
                ➔
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default Dashboard;
