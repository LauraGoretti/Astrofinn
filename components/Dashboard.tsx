import React from 'react';
import { ActivityConfig, ActivityId } from '../types';
import { Globe, Sun, Moon, CloudSun, ThermometerSun } from 'lucide-react';

interface DashboardProps {
  onSelectActivity: (id: ActivityId) => void;
}

const activities: ActivityConfig[] = [
  {
    id: ActivityId.ORBIT_REVOLUTION,
    title: "Orbit & Revolution",
    description: "Simulate Earth's journey around the Sun.",
    iconName: "Globe",
    color: "from-blue-500 to-cyan-400"
  },
  {
    id: ActivityId.SEASONS,
    title: "Seasons & Tilt",
    description: "Why is it winter in Finland when it's summer in Chile?",
    iconName: "ThermometerSun",
    color: "from-orange-500 to-red-500"
  },
  {
    id: ActivityId.KAAMOS_MIDNIGHT,
    title: "Kaamos & Midnight Sun",
    description: "Explore the magic of the Arctic Circle light.",
    iconName: "Moon",
    color: "from-purple-500 to-pink-500"
  },
  {
    id: ActivityId.SHADOWS,
    title: "Shadow Lab",
    description: "Investigate how sun height affects shadows.",
    iconName: "CloudSun",
    color: "from-green-400 to-emerald-600"
  },
  {
    id: ActivityId.SUNLIGHT_INTENSITY,
    title: "Sunlight Intensity",
    description: "Direct hits vs Glancing blows. The power of angles.",
    iconName: "Sun",
    color: "from-yellow-400 to-orange-300"
  }
];

const IconMap: Record<string, React.FC<any>> = {
  Globe, Sun, Moon, CloudSun, ThermometerSun
};

const Dashboard: React.FC<DashboardProps> = ({ onSelectActivity }) => {
  return (
    <div className="max-w-6xl mx-auto py-12 px-4">
      <div className="text-center mb-16 space-y-4">
        <h1 className="text-5xl md:text-7xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-white to-purple-400 animate-float">
          ASTROFINN
        </h1>
        <p className="text-gray-400 text-lg md:text-xl font-light tracking-wide">
          Interactive Space Lab for Earth Science
        </p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {activities.map((act) => {
          const Icon = IconMap[act.iconName];
          return (
            <button
              key={act.id}
              onClick={() => onSelectActivity(act.id)}
              className="group relative h-64 rounded-2xl overflow-hidden glass-panel hover:border-white/40 transition-all duration-500 text-left p-6 flex flex-col justify-between hover:scale-[1.02]"
            >
              {/* Gradient Background on Hover */}
              <div className={`absolute inset-0 bg-gradient-to-br ${act.color} opacity-0 group-hover:opacity-10 transition-opacity duration-500`}></div>
              
              <div className={`p-3 rounded-full bg-gradient-to-br ${act.color} w-fit shadow-lg shadow-black/50 group-hover:shadow-${act.color}/50 transition-shadow`}>
                <Icon className="text-white w-8 h-8" />
              </div>

              <div>
                <h3 className="text-2xl font-bold text-white mb-2 group-hover:text-cyan-200 transition-colors">{act.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed group-hover:text-gray-200">{act.description}</p>
              </div>

              <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity transform translate-x-4 group-hover:translate-x-0 text-cyan-400">
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
