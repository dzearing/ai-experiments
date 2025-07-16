export interface Theme {
  id: string;
  name: string;
  description: string;
  styles: {
    // Layout
    sidebarBg: string;
    sidebarText: string;
    sidebarHover: string;
    sidebarActive: string;
    sidebarBorder: string;
    
    // Main content
    mainBg: string;
    contentBg: string;
    contentBorder: string;
    
    // Typography
    headingColor: string;
    textColor: string;
    mutedText: string;
    
    // Interactive elements
    primaryButton: string;
    primaryButtonHover: string;
    primaryButtonText: string;
    
    // Cards and surfaces
    cardBg: string;
    cardBorder: string;
    cardShadow: string;
    
    // Status colors
    successBg: string;
    successText: string;
    warningBg: string;
    warningText: string;
    
    // Additional styling
    borderRadius: string;
    fontFamily: string;
  };
}

export const themes: Theme[] = [
  {
    id: 'modern-minimal',
    name: 'Modern Minimal',
    description: 'Clean and minimalist with sharp edges and high contrast',
    styles: {
      sidebarBg: 'bg-slate-900',
      sidebarText: 'text-slate-100',
      sidebarHover: 'hover:bg-slate-800',
      sidebarActive: 'bg-slate-800 text-white',
      sidebarBorder: 'border-slate-800',
      mainBg: 'bg-white',
      contentBg: 'bg-white',
      contentBorder: 'border-slate-200',
      headingColor: 'text-slate-900',
      textColor: 'text-slate-700',
      mutedText: 'text-slate-500',
      primaryButton: 'bg-slate-900 border-slate-900',
      primaryButtonHover: 'hover:bg-slate-800',
      primaryButtonText: 'text-white',
      cardBg: 'bg-white',
      cardBorder: 'border-slate-200',
      cardShadow: 'shadow-sm',
      successBg: 'bg-green-50',
      successText: 'text-green-700',
      warningBg: 'bg-amber-50',
      warningText: 'text-amber-700',
      borderRadius: 'rounded-none',
      fontFamily: 'font-sans'
    }
  },
  {
    id: 'soft-gradient',
    name: 'Soft Gradient',
    description: 'Gentle gradients and rounded corners for a friendly feel',
    styles: {
      sidebarBg: 'bg-gradient-to-b from-purple-600 to-blue-600',
      sidebarText: 'text-white',
      sidebarHover: 'hover:bg-white/10',
      sidebarActive: 'bg-white/20 text-white',
      sidebarBorder: 'border-white/20',
      mainBg: 'bg-gradient-to-br from-blue-50 to-purple-50',
      contentBg: 'bg-white/80',
      contentBorder: 'border-purple-200',
      headingColor: 'text-purple-900',
      textColor: 'text-slate-700',
      mutedText: 'text-slate-500',
      primaryButton: 'bg-gradient-to-r from-purple-600 to-blue-600',
      primaryButtonHover: 'hover:from-purple-700 hover:to-blue-700',
      primaryButtonText: 'text-white',
      cardBg: 'bg-white/80',
      cardBorder: 'border-purple-200',
      cardShadow: 'shadow-lg shadow-purple-500/10',
      successBg: 'bg-green-100',
      successText: 'text-green-800',
      warningBg: 'bg-amber-100',
      warningText: 'text-amber-800',
      borderRadius: 'rounded-2xl',
      fontFamily: 'font-sans'
    }
  },
  {
    id: 'dark-mode-pro',
    name: 'Dark Mode Pro',
    description: 'Professional dark theme with blue accents',
    styles: {
      sidebarBg: 'bg-slate-950',
      sidebarText: 'text-slate-300',
      sidebarHover: 'hover:bg-slate-900',
      sidebarActive: 'bg-blue-600 text-white',
      sidebarBorder: 'border-slate-800',
      mainBg: 'bg-slate-900',
      contentBg: 'bg-slate-950',
      contentBorder: 'border-slate-800',
      headingColor: 'text-slate-100',
      textColor: 'text-slate-300',
      mutedText: 'text-slate-500',
      primaryButton: 'bg-blue-600 border-blue-600',
      primaryButtonHover: 'hover:bg-blue-700',
      primaryButtonText: 'text-white',
      cardBg: 'bg-slate-950',
      cardBorder: 'border-slate-800',
      cardShadow: 'shadow-xl shadow-black/50',
      successBg: 'bg-green-950',
      successText: 'text-green-400',
      warningBg: 'bg-amber-950',
      warningText: 'text-amber-400',
      borderRadius: 'rounded-lg',
      fontFamily: 'font-mono'
    }
  },
  {
    id: 'nature-inspired',
    name: 'Nature Inspired',
    description: 'Earthy tones and organic shapes',
    styles: {
      sidebarBg: 'bg-green-800',
      sidebarText: 'text-green-50',
      sidebarHover: 'hover:bg-green-700',
      sidebarActive: 'bg-green-600 text-white',
      sidebarBorder: 'border-green-700',
      mainBg: 'bg-stone-50',
      contentBg: 'bg-white',
      contentBorder: 'border-stone-300',
      headingColor: 'text-green-900',
      textColor: 'text-stone-700',
      mutedText: 'text-stone-500',
      primaryButton: 'bg-green-700 border-green-700',
      primaryButtonHover: 'hover:bg-green-800',
      primaryButtonText: 'text-white',
      cardBg: 'bg-white',
      cardBorder: 'border-stone-200',
      cardShadow: 'shadow-md shadow-green-500/10',
      successBg: 'bg-lime-50',
      successText: 'text-lime-700',
      warningBg: 'bg-orange-50',
      warningText: 'text-orange-700',
      borderRadius: 'rounded-xl',
      fontFamily: 'font-serif'
    }
  },
  {
    id: 'glassmorphism',
    name: 'Glassmorphism',
    description: 'Translucent surfaces with blur effects',
    styles: {
      sidebarBg: 'bg-white/10',
      sidebarText: 'text-slate-800',
      sidebarHover: 'hover:bg-white/20',
      sidebarActive: 'bg-white/30 text-slate-900',
      sidebarBorder: 'border-white/30',
      mainBg: 'bg-gradient-to-br from-cyan-400 via-blue-500 to-purple-600',
      contentBg: 'bg-white/10',
      contentBorder: 'border-white/30',
      headingColor: 'text-white',
      textColor: 'text-white/90',
      mutedText: 'text-white/70',
      primaryButton: 'bg-white/20 border-white/30',
      primaryButtonHover: 'hover:bg-white/30',
      primaryButtonText: 'text-white',
      cardBg: 'bg-white/10',
      cardBorder: 'border-white/30',
      cardShadow: 'shadow-2xl shadow-black/20',
      successBg: 'bg-green-500/20',
      successText: 'text-white',
      warningBg: 'bg-amber-500/20',
      warningText: 'text-white',
      borderRadius: 'rounded-2xl',
      fontFamily: 'font-sans'
    }
  },
  {
    id: 'retro-terminal',
    name: 'Retro Terminal',
    description: 'Classic terminal aesthetic with green phosphor glow',
    styles: {
      sidebarBg: 'bg-black',
      sidebarText: 'text-green-400',
      sidebarHover: 'hover:bg-green-900/30',
      sidebarActive: 'bg-green-900/50 text-green-300',
      sidebarBorder: 'border-green-700',
      mainBg: 'bg-black',
      contentBg: 'bg-gray-950',
      contentBorder: 'border-green-700',
      headingColor: 'text-green-400',
      textColor: 'text-green-500',
      mutedText: 'text-green-700',
      primaryButton: 'bg-green-700 border-green-400',
      primaryButtonHover: 'hover:bg-green-600',
      primaryButtonText: 'text-black',
      cardBg: 'bg-gray-950',
      cardBorder: 'border-green-700',
      cardShadow: 'shadow-[0_0_10px_rgba(34,197,94,0.5)]',
      successBg: 'bg-green-950',
      successText: 'text-green-400',
      warningBg: 'bg-yellow-950',
      warningText: 'text-yellow-400',
      borderRadius: 'rounded-none',
      fontFamily: 'font-mono'
    }
  },
  {
    id: 'pastel-dream',
    name: 'Pastel Dream',
    description: 'Soft pastel colors with playful vibes',
    styles: {
      sidebarBg: 'bg-pink-200',
      sidebarText: 'text-purple-800',
      sidebarHover: 'hover:bg-pink-300',
      sidebarActive: 'bg-purple-300 text-purple-900',
      sidebarBorder: 'border-pink-300',
      mainBg: 'bg-gradient-to-br from-pink-100 via-purple-100 to-blue-100',
      contentBg: 'bg-white/90',
      contentBorder: 'border-purple-200',
      headingColor: 'text-purple-800',
      textColor: 'text-purple-700',
      mutedText: 'text-purple-500',
      primaryButton: 'bg-purple-400 border-purple-400',
      primaryButtonHover: 'hover:bg-purple-500',
      primaryButtonText: 'text-white',
      cardBg: 'bg-white/90',
      cardBorder: 'border-purple-200',
      cardShadow: 'shadow-lg shadow-purple-200/50',
      successBg: 'bg-green-100',
      successText: 'text-green-700',
      warningBg: 'bg-yellow-100',
      warningText: 'text-yellow-700',
      borderRadius: 'rounded-3xl',
      fontFamily: 'font-sans'
    }
  },
  {
    id: 'corporate-blue',
    name: 'Corporate Blue',
    description: 'Professional and trustworthy business theme',
    styles: {
      sidebarBg: 'bg-blue-900',
      sidebarText: 'text-blue-100',
      sidebarHover: 'hover:bg-blue-800',
      sidebarActive: 'bg-blue-700 text-white',
      sidebarBorder: 'border-blue-800',
      mainBg: 'bg-gray-50',
      contentBg: 'bg-white',
      contentBorder: 'border-gray-300',
      headingColor: 'text-blue-900',
      textColor: 'text-gray-700',
      mutedText: 'text-gray-500',
      primaryButton: 'bg-blue-700 border-blue-700',
      primaryButtonHover: 'hover:bg-blue-800',
      primaryButtonText: 'text-white',
      cardBg: 'bg-white',
      cardBorder: 'border-gray-200',
      cardShadow: 'shadow-md',
      successBg: 'bg-green-50',
      successText: 'text-green-800',
      warningBg: 'bg-yellow-50',
      warningText: 'text-yellow-800',
      borderRadius: 'rounded-lg',
      fontFamily: 'font-sans'
    }
  },
  {
    id: 'cyberpunk-neon',
    name: 'Cyberpunk Neon',
    description: 'Futuristic neon colors with dark backgrounds',
    styles: {
      sidebarBg: 'bg-gray-950',
      sidebarText: 'text-pink-400',
      sidebarHover: 'hover:bg-pink-950/50',
      sidebarActive: 'bg-pink-600/30 text-pink-300',
      sidebarBorder: 'border-pink-600',
      mainBg: 'bg-gray-950',
      contentBg: 'bg-black',
      contentBorder: 'border-pink-600',
      headingColor: 'text-cyan-400',
      textColor: 'text-gray-300',
      mutedText: 'text-gray-600',
      primaryButton: 'bg-pink-600 border-pink-400',
      primaryButtonHover: 'hover:bg-pink-700',
      primaryButtonText: 'text-white',
      cardBg: 'bg-black',
      cardBorder: 'border-pink-600',
      cardShadow: 'shadow-[0_0_20px_rgba(236,72,153,0.5)]',
      successBg: 'bg-green-950',
      successText: 'text-green-400',
      warningBg: 'bg-yellow-950',
      warningText: 'text-yellow-400',
      borderRadius: 'rounded-sm',
      fontFamily: 'font-mono'
    }
  },
  {
    id: 'zen-minimal',
    name: 'Zen Minimal',
    description: 'Calm and peaceful with lots of whitespace',
    styles: {
      sidebarBg: 'bg-gray-100',
      sidebarText: 'text-gray-700',
      sidebarHover: 'hover:bg-gray-200',
      sidebarActive: 'bg-gray-300 text-gray-900',
      sidebarBorder: 'border-gray-200',
      mainBg: 'bg-white',
      contentBg: 'bg-gray-50',
      contentBorder: 'border-gray-200',
      headingColor: 'text-gray-900',
      textColor: 'text-gray-600',
      mutedText: 'text-gray-400',
      primaryButton: 'bg-gray-900 border-gray-900',
      primaryButtonHover: 'hover:bg-gray-800',
      primaryButtonText: 'text-white',
      cardBg: 'bg-white',
      cardBorder: 'border-gray-100',
      cardShadow: 'shadow-sm',
      successBg: 'bg-green-50',
      successText: 'text-green-600',
      warningBg: 'bg-amber-50',
      warningText: 'text-amber-600',
      borderRadius: 'rounded-md',
      fontFamily: 'font-sans'
    }
  }
];