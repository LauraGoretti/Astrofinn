import React from 'react';
import { useTranslation } from 'react-i18next';
import { Globe } from 'lucide-react';

interface Language {
  code: string;
  name: string;
  flag: string;
}

const languages: Language[] = [
  { code: 'en', name: 'English', flag: 'https://flagcdn.com/w80/gb.png' },
  { code: 'fi', name: 'Suomi', flag: 'https://flagcdn.com/w80/fi.png' },
  { code: 'sv', name: 'Svenska', flag: 'https://flagcdn.com/w80/se.png' },
  { code: 'pt-BR', name: 'Português (Brasil)', flag: 'https://flagcdn.com/w80/br.png' },
];

interface LanguageSelectorProps {
  onSelect: () => void;
}

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({ onSelect }) => {
  const { i18n, t } = useTranslation();

  const handleLanguageSelect = (code: string) => {
    i18n.changeLanguage(code);
    onSelect();
  };

  return (
    <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center p-6">
      <div className="max-w-2xl w-full space-y-8 text-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-20 h-20 bg-blue-500/20 rounded-full flex items-center justify-center border border-blue-500/50 shadow-[0_0_20px_rgba(59,130,246,0.3)]">
            <Globe className="w-10 h-10 text-blue-400" />
          </div>
          <h1 className="text-4xl font-bold text-white tracking-tight">
            AstroFinn
          </h1>
          <p className="text-gray-400 text-lg">
            {t('select_language')}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-8">
          {languages.map((lang) => (
            <button
              key={lang.code}
              onClick={() => handleLanguageSelect(lang.code)}
              className="group relative flex items-center space-x-4 p-4 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-blue-500/50 rounded-xl transition-all duration-300 text-left"
            >
              <div className="w-12 h-8 overflow-hidden rounded shadow-sm border border-white/10">
                <img
                  src={lang.flag}
                  alt={lang.name}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
              <span className="text-xl font-medium text-gray-200 group-hover:text-white transition-colors">
                {lang.name}
              </span>
              <div className="absolute right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.8)]" />
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
