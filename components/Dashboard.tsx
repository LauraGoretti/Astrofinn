import React from 'react';
import { ActivityId } from '../types';
import { Globe, Sun, ThermometerSun, Snowflake, Orbit, Ruler } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface DashboardProps {
  onSelectActivity: (id: ActivityId) => void;
}

const IconMap: Record<string, React.FC<any>> = {
  Globe, Sun, ThermometerSun, Snowflake, Orbit, Ruler
};

const Dashboard: React.FC<DashboardProps> = ({ onSelectActivity }) => {
  const { t } = useTranslation();

  const activities = [
    {
      id: ActivityId.LIGHT_INCIDENCE,
      title: t('activities.light_incidence.title'),
      description: t('activities.light_incidence.desc'),
      iconName: "ThermometerSun",
      color: "from-purple-500 to-pink-500",
      shadowClass: "group-hover:drop-shadow-[0_0_20px_rgba(236,72,153,0.8)]"
    },
    {
      id: ActivityId.SEASONS,
      title: t('activities.tilt_orbit.title'),
      description: t('activities.tilt_orbit.desc'),
      iconName: "Orbit",
      color: "from-orange-500 to-red-500",
      shadowClass: "group-hover:drop-shadow-[0_0_20px_rgba(249,115,22,0.8)]"
    },
    {
      id: ActivityId.ORBIT_REVOLUTION,
      title: t('activities.solar_system.title'),
      description: t('activities.solar_system.desc'),
      iconName: "Globe",
      color: "from-blue-500 to-cyan-400",
      shadowClass: "group-hover:drop-shadow-[0_0_20px_rgba(6,182,212,0.8)]"
    },
    {
      id: ActivityId.SIZES_DISTANCES,
      title: t('activities.sizes_distances.title'),
      description: t('activities.sizes_distances.desc'),
      iconName: "Ruler",
      color: "from-yellow-400 to-orange-300",
      shadowClass: "group-hover:drop-shadow-[0_0_20px_rgba(250,204,21,0.8)]"
    }
  ];

  return (
    <div className="w-full py-12 px-4">
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
        <p className="text-gray-400 text-lg max-w-2xl mx-auto">
          {t('welcome_desc')}
        </p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 w-full">
        {activities.map((act) => {
          const Icon = IconMap[act.iconName];
          return (
            <button
              key={act.id}
              onClick={() => onSelectActivity(act.id)}
              className="group relative h-64 overflow-hidden glass-panel hover:border-white/40 transition-all duration-500 text-center flex flex-col items-center justify-center hover:scale-[1.02]"
            >
              {/* Gradient Background on Hover */}
              <div className={`absolute inset-0 bg-gradient-to-br ${act.color} opacity-0 group-hover:opacity-10 transition-opacity duration-500`}></div>

              <div className="mb-4 transform group-hover:scale-110 transition-transform duration-500 z-10">
                <Icon className={`w-16 h-16 text-white/80 group-hover:text-white transition-all duration-500 drop-shadow-[0_0_10px_rgba(255,255,255,0.1)] ${act.shadowClass}`} />
              </div>

              <div className="z-10">
                <h3 className="text-2xl font-bold text-white mb-2 group-hover:text-cyan-200 transition-colors">{act.title}</h3>
                <p className="text-gray-400 text-base leading-relaxed group-hover:text-gray-200">{act.description}</p>
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
