import { useState } from 'react';
import { 
  X, Edit2, Share, ChevronRight, Play, Pause, Database, 
  Calendar, Layout, Image as ImageIcon, Sparkles, Wand2
} from 'lucide-react';
import type { Profile } from '../../types';
import { Avatar } from '../common/Avatar';

interface ChatSettingsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  character: Profile;
  user: any;
  isVoiceEnabled: boolean;
  onToggleVoice: () => void;
  onSelectPersona: () => void;
}

export function ChatSettingsDrawer({ 
  isOpen, 
  onClose, 
  character, 
  user,
  isVoiceEnabled,
  onToggleVoice,
  onSelectPersona
}: ChatSettingsDrawerProps) {
  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/60 z-40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      
      {/* Drawer */}
      <div className="fixed bottom-0 inset-x-0 md:inset-y-0 md:right-0 md:left-auto md:w-96 bg-warm-950 z-50 rounded-t-3xl md:rounded-t-none md:rounded-l-3xl shadow-2xl border-t md:border-l md:border-t-0 border-warm-800 flex flex-col transition-transform transform translate-y-0 text-warm-50 h-[85vh] md:h-screen">
        
        {/* Mobile Pull Tab */}
        <div className="md:hidden w-full flex justify-center py-3">
          <div className="w-12 h-1.5 bg-warm-800 rounded-full" />
        </div>

        {/* Content Container */}
        <div className="flex-1 overflow-y-auto px-6 pb-8 custom-scrollbar">
          
          {/* Header Info */}
          <div className="flex items-center justify-between mb-8 pt-4 md:pt-8">
            <div className="flex items-center gap-4">
              <Avatar emoji={character.avatar_emoji} photoUrl={character.photo_url} size="lg" />
              <div>
                <h2 className="font-bold text-xl">{character.display_name}</h2>
                <p className="text-warm-400 text-sm">by @{character.username}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button className="w-10 h-10 rounded-full bg-warm-900 flex items-center justify-center hover:bg-warm-800 transition-colors">
                <Edit2 size={18} />
              </button>
              <button className="w-10 h-10 rounded-full bg-warm-900 flex items-center justify-center hover:bg-warm-800 transition-colors">
                <Share size={18} />
              </button>
              <button onClick={onClose} className="w-10 h-10 rounded-full bg-warm-900 flex items-center justify-center hover:bg-warm-800 transition-colors">
                <ChevronRight size={20} className="md:rotate-0 rotate-90" />
              </button>
            </div>
          </div>

          {/* Grid Layout */}
          <div className="grid grid-cols-3 gap-3">
            
            {/* Memory - 1x1 */}
            <div className="col-span-1 aspect-square bg-warm-900 rounded-2xl p-4 flex flex-col justify-between hover:bg-warm-800 transition-colors cursor-pointer group overflow-hidden relative">
              <span className="font-bold text-sm z-10">Memory</span>
              <Database size={32} className="text-warm-600 group-hover:text-warm-400 transition-colors z-10 absolute bottom-[-5px] right-[-5px]" />
              {/* Fake visual bar chart in background to match C.AI */}
              <div className="absolute bottom-0 inset-x-2 h-1/2 flex items-end justify-between gap-1 opacity-50">
                <div className="w-full bg-warm-700 h-1/3 rounded-t-sm" />
                <div className="w-full bg-warm-600 h-2/3 rounded-t-sm" />
                <div className="w-full bg-warm-500 h-full rounded-t-sm" />
              </div>
            </div>

            {/* History - 1x1 */}
            <div className="col-span-1 aspect-square bg-warm-900 rounded-2xl p-4 flex flex-col justify-between hover:bg-warm-800 transition-colors cursor-pointer group relative overflow-hidden">
              <span className="font-bold text-sm z-10">History</span>
              <div className="flex gap-1 absolute bottom-4 left-4 z-10">
                <div className="w-8 h-10 bg-warm-800 rounded-lg flex flex-col items-center justify-center text-[10px] opacity-60"><span className="text-[8px]">Jul</span><span>18</span></div>
                <div className="w-8 h-10 bg-warm-700 rounded-lg flex flex-col items-center justify-center text-[10px] opacity-80"><span className="text-[8px]">Jul</span><span>19</span></div>
                <div className="w-8 h-10 bg-white text-black rounded-lg flex flex-col items-center justify-center text-[10px] font-bold shadow-lg"><span className="text-[8px]">Jul</span><span>20</span></div>
              </div>
            </div>

            {/* Voice - 1x1 */}
            <div 
              onClick={onToggleVoice}
              className={`col-span-1 aspect-square rounded-2xl p-4 flex flex-col items-center justify-center transition-all cursor-pointer ${
                isVoiceEnabled 
                  ? 'bg-gradient-to-br from-primary-600 to-accent-600 shadow-lg shadow-primary-500/20' 
                  : 'bg-warm-900 hover:bg-warm-800'
              }`}
            >
              <span className="font-bold text-sm absolute top-4 left-4">Voice</span>
              <div className={`w-14 h-14 rounded-full flex items-center justify-center mt-4 transition-all ${
                isVoiceEnabled ? 'bg-white text-primary-600 scale-110' : 'bg-warm-800 text-warm-300'
              }`}>
                {isVoiceEnabled ? <Pause size={24} className="fill-current" /> : <Play size={24} className="fill-current ml-1" />}
              </div>
            </div>

            {/* Layout - 1x1 */}
            <div className="col-span-1 aspect-square bg-warm-900 rounded-2xl p-4 flex flex-col justify-between hover:bg-warm-800 transition-colors cursor-pointer relative overflow-hidden group">
              <span className="font-bold text-sm z-10">Layout</span>
              <div className="absolute bottom-4 left-4 right-4 flex flex-col gap-2 opacity-50 group-hover:opacity-100 transition-opacity">
                <div className="h-2 w-3/4 bg-warm-700 rounded-full" />
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 bg-warm-600 rounded-full flex-shrink-0" />
                  <div className="h-2 w-1/2 bg-warm-700 rounded-full" />
                </div>
              </div>
            </div>

            {/* Wallpaper - 1x1 */}
            <div className="col-span-1 aspect-square bg-warm-900 rounded-2xl p-4 flex flex-col items-center justify-center hover:bg-warm-800 transition-colors cursor-pointer text-warm-600 relative group">
              <span className="font-bold text-sm text-warm-50 absolute top-4 left-4">Wallpaper</span>
              <ImageIcon size={40} strokeWidth={1} className="mt-4 group-hover:scale-110 transition-transform" />
              <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm">
                  <span className="text-xl">+</span>
                </div>
              </div>
            </div>

            {/* Chat style - 1x1 */}
            <div className="col-span-1 aspect-square bg-warm-900 rounded-2xl p-4 flex flex-col justify-between hover:bg-warm-800 transition-colors cursor-pointer relative overflow-hidden group">
              <span className="font-bold text-sm z-10">Chat style</span>
              <Wand2 size={40} className="absolute bottom-2 right-2 text-primary-500 opacity-50 group-hover:opacity-100 group-hover:scale-110 group-hover:rotate-12 transition-all" />
              {/* Prism aesthetic representation */}
              <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-tr from-transparent via-primary-500/10 to-accent-500/20 transform -skew-y-12" />
            </div>

            {/* Persona - 1x1 */}
            <div 
              onClick={onSelectPersona}
              className="col-span-1 aspect-square bg-warm-900 rounded-2xl p-4 flex flex-col items-center justify-center hover:bg-warm-800 transition-colors cursor-pointer relative group"
            >
              <span className="font-bold text-sm absolute top-4 left-4">Persona</span>
              <div className="mt-4 border-2 border-primary-500 rounded-full p-0.5 group-hover:scale-105 transition-transform shadow-lg shadow-primary-500/20">
                <Avatar emoji={null} photoUrl={user?.photo_url} size="lg" />
              </div>
            </div>

            {/* Imagine - 1x1 */}
            <div className="col-span-1 aspect-square bg-warm-900 rounded-2xl p-4 flex flex-col items-center justify-center hover:bg-warm-800 transition-colors cursor-pointer text-warm-400 group">
              <span className="font-bold text-sm text-warm-50 absolute top-4 left-4">Imagine</span>
              <Sparkles size={40} className="mt-4 group-hover:text-yellow-400 group-hover:scale-110 transition-all" />
            </div>

          </div>
        </div>
      </div>
    </>
  );
}
