'use client';

import React from 'react';
import { useLanguage } from '@/lib/language-context';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Globe } from 'lucide-react';

export function LanguageSwitcher() {
  const { language, setLanguage, t } = useLanguage();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-white/10 transition-colors"
          title={t('common.language')}
          aria-label={t('common.language')}
        >
          <Globe className="w-4 h-4 text-white" />
          <span className="text-sm font-medium text-white uppercase">{language}</span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="rounded-lg shadow-2xl border border-gray-100 mt-2">
        <DropdownMenuItem
          onClick={() => setLanguage('en')}
          className={`cursor-pointer ${language === 'en' ? 'bg-gray-100' : ''}`}
        >
          <span className="text-sm font-medium">{t('common.english')}</span>
          {language === 'en' && <span className="ml-auto text-xs font-bold text-green-600">✓</span>}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setLanguage('am')}
          className={`cursor-pointer ${language === 'am' ? 'bg-gray-100' : ''}`}
        >
          <span className="text-sm font-medium">{t('common.amharic')}</span>
          {language === 'am' && <span className="ml-auto text-xs font-bold text-green-600">✓</span>}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
