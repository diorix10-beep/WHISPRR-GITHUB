import fs from 'fs';
import path from 'path';

const filePath = path.resolve('src/pages/LandingPage.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Replace imports
const targetImports = [
  "import { useState } from 'react';",
  "import { useNavigate } from 'react-router-dom';",
  "import { ",
  "  Rocket, Calendar, GitCommit, Heart, Sparkles, MessageSquare, ",
  "  CheckCircle, Clock, Eye, AlertCircle, ArrowRight, Shield, Globe, ",
  "  Smile, Send, ChevronRight, PenTool, BookOpen, Bug, Award, Users, Info,",
  "  ExternalLink, Megaphone, FlaskConical, Lightbulb, HelpCircle, Lock, Map, FileText",
  "} from 'lucide-react';"
].join('\n');

const replacementImports = [
  "import { useState, useEffect } from 'react';",
  "import { useNavigate } from 'react-router-dom';",
  "import { ",
  "  Rocket, Calendar, GitCommit, Heart, Sparkles, MessageSquare, ",
  "  CheckCircle, Clock, Eye, AlertCircle, ArrowRight, Shield, Globe, ",
  "  Smile, Send, ChevronRight, PenTool, BookOpen, Bug, Award, Users, Info,",
  "  ExternalLink, Megaphone, FlaskConical, Lightbulb, HelpCircle, Lock, Map, FileText,",
  "  Twitter, Instagram, Github, Youtube, Linkedin, Music2, MessageCircle",
  "} from 'lucide-react';"
].join('\n');

if (!content.includes(targetImports)) {
  console.error("❌ Target imports not found!");
} else {
  content = content.replace(targetImports, replacementImports);
}

// 2. Replace LandingPage decl
const targetDecl = [
  "export default function LandingPage() {",
  "  const navigate = useNavigate();",
  "  const { showToast } = useToast();",
  "  const [activeSection, setActiveSection] = useState<LandingSection>('home');",
  "  const [activeBlogCategory, setActiveBlogCategory] = useState<string>('All');"
].join('\n');

const replacementDecl = [
  "const ICON_MAP: Record<string, any> = {",
  "  Globe,",
  "  MessageSquare,",
  "  Twitter,",
  "  Instagram,",
  "  Github,",
  "  Send,",
  "  Youtube,",
  "  Linkedin,",
  "  TikTok: Music2,",
  "  Bluesky: MessageCircle,",
  "  Reddit: HelpCircle",
  "};",
  "",
  "export default function LandingPage() {",
  "  const navigate = useNavigate();",
  "  const { showToast } = useToast();",
  "  const [activeSection, setActiveSection] = useState<LandingSection>('home');",
  "  const [activeBlogCategory, setActiveBlogCategory] = useState<string>('All');",
  "",
  "  // Connected socials state loaded from database",
  "  const [socialPlatforms, setSocialPlatforms] = useState<any[]>([",
  "    { id: 'website', name: 'Website', icon: 'Globe', url: 'https://whisprr.xyz', status: 'available', description: 'The official web platform to share whispers.' },",
  "    { id: 'discord', name: 'Discord', icon: 'MessageSquare', url: 'https://discord.gg/WHISPRRHQ', status: 'available', description: 'Join our official community, share feedback, and chat.' },",
  "    { id: 'x', name: 'X (Twitter)', icon: 'Twitter', url: 'https://x.com/WHISPRRHQ', status: 'available', description: 'Stay updated with every release and strategic update.' },",
  "    { id: 'instagram', name: 'Instagram', icon: 'Instagram', url: 'https://instagram.com/whisprr', status: 'coming_soon', description: 'Behind-the-scenes and visual updates from the team.' },",
  "    { id: 'threads', name: 'Threads', icon: 'Send', url: 'https://threads.net/@whisprr', status: 'coming_soon', description: 'Community discussions and quick updates.' },",
  "    { id: 'github', name: 'GitHub', icon: 'Github', url: 'https://github.com/diorix10-beep/WHISPRR-GITHUB', status: 'available', description: 'Explore our open-source code and development loops.' }",
  "  ]);",
  "",
  "  useEffect(() => {",
  "    async function loadPlatforms() {",
  "      try {",
  "        const { data } = await supabase",
  "          .from('system_settings')",
  "          .select('value')",
  "          .eq('key', 'ecosystem_platforms')",
  "          .maybeSingle();",
  "",
  "        if (data && data.value) {",
  "          setSocialPlatforms(data.value);",
  "        }",
  "      } catch (err) {",
  "        console.error('Failed to load ecosystem platforms:', err);",
  "      }",
  "    }",
  "    loadPlatforms();",
  "  }, []);"
].join('\n');

if (!content.includes(targetDecl)) {
  console.error("❌ Target LandingPage declaration not found!");
} else {
  content = content.replace(targetDecl, replacementDecl);
}

// 3. Replace Discord card
const targetDiscord = [
  "             {/* Primary: Discord */}",
  "             <div className=\"public-card p-8 rounded-3xl relative overflow-hidden\">",
  "                <div className=\"absolute inset-0 bg-gradient-to-br from-[#5865F2]/10 to-transparent pointer-events-none\" />",
  "                <div className=\"relative flex flex-col md:flex-row items-center gap-8\">",
  "                   <div className=\"w-20 h-20 bg-[#5865F2] rounded-2xl flex items-center justify-center shrink-0 shadow-lg\">",
  "                      <svg viewBox=\"0 0 24 24\" className=\"w-10 h-10 text-white\" fill=\"currentColor\">",
  "                         <path d=\"M20.317 4.369a19.791 19.791 0 00-4.885-1.515.074.074 0 00-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 00-5.487 0 12.64 12.64 0 00-.617-1.25.077.077 0 00-.079-.037A19.736 19.736 0 003.677 4.369a.07.07 0 00-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 00.031.057 19.9 19.9 0 005.993 3.03.078.078 0 00.084-.028c.462-.63.874-1.295 1.227-1.994a.076.076 0 00-.041-.106 13.107 13.107 0 01-1.872-.892.077.077 0 01-.008-.128 10.2 10.2 0 00.372-.292.074.074 0 01.077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 01.078.01c.12.098.246.198.373.292a.077.077 0 01-.006.127 12.299 12.299 0 01-1.873.892.077.077 0 00-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 00.084.028 19.839 19.839 0 006.002-3.03.077.077 0 00.032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 00-.031-.03z\" />",
  "                      </svg>",
  "                   </div>",
  "                   <div className=\"flex-1 text-center md:text-left space-y-2\">",
  "                      <div className=\"flex items-center justify-center md:justify-start gap-2\">",
  "                         <h3 className=\"font-serif text-2xl font-bold text-warm-50\">Official Discord Community</h3>",
  "                         <span className=\"text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full bg-emerald-950/60 text-emerald-450 border border-emerald-500/25 flex items-center gap-1.5 animate-pulse-slow\">",
  "                           <span className=\"w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping\" />",
  "                           Live & Active",
  "                         </span>",
  "                      </div>",
  "                      <p className=\"text-sm text-warm-400 leading-relaxed max-w-lg\">",
  "                         Meet other members, receive development updates, join beta testing, report bugs,",
  "                         suggest features, participate in events, and talk directly with the team.",
  "                      </p>",
  "                      <div className=\"flex flex-wrap items-center justify-center md:justify-start gap-3 pt-2 text-[10px] text-warm-500\">",
  "                         <span>📢 Announcements</span>",
  "                         <span>🧪 Beta Testing</span>",
  "                         <span>🐛 Bug Reports</span>",
  "                         <span>💡 Feature Requests</span>",
  "                         <span>🌍 Country Spaces</span>",
  "                         <span>🎉 Events</span>",
  "                      </div>",
  "                   </div>",
  "                   <a",
  "                     href={import.meta.env.VITE_DISCORD_INVITE_URL || \"https://discord.gg/WHISPRRHQ\"}",
  "                     target=\"_blank\"",
  "                     rel=\"noopener noreferrer\"",
  "                     className=\"bg-[#5865F2] hover:bg-[#4752C4] text-white font-bold py-3 px-8 rounded-2xl text-sm flex items-center gap-2 transition-all shadow-md shrink-0\"",
  "                   >",
  "                     Join Discord <ExternalLink size={14} />",
  "                   </a>",
  "                </div>",
  "             </div>"
].join('\n');

const replacementDiscord = [
  "             {/* Official Social Channels Grid */}",
  "             <div className=\"space-y-6\">",
  "                <h3 className=\"font-serif text-xl font-bold text-warm-900 dark:text-warm-100 border-b border-warm-200/50 dark:border-warm-800/40 pb-2\">Ecosystem Gateways</h3>",
  "                <div className=\"grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5\">",
  "                   {socialPlatforms.map((platform, idx) => {",
  "                      const IconComponent = ICON_MAP[platform.icon] || Globe;",
  "                      const isAvailable = platform.status === 'available';",
  "                      return (",
  "                         <div key={idx} className=\"public-card p-6 flex flex-col justify-between space-y-4 hover:scale-[1.01] transition-all relative overflow-hidden border border-warm-200/10 dark:border-warm-800/10\">",
  "                            <div className=\"flex items-center justify-between\">",
  "                               <div className=\"p-3 bg-warm-200/40 dark:bg-warm-850/40 rounded-xl text-primary-500 dark:text-primary-400\">",
  "                                  <IconComponent size={24} />",
  "                                </div>",
  "                               <span className={`text-[9px] font-bold uppercase px-2.5 py-0.75 rounded-full ${",
  "                                  isAvailable",
  "                                    ? 'bg-emerald-100/80 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-450 border border-emerald-500/25'",
  "                                    : 'bg-amber-100/80 dark:bg-amber-950/60 text-amber-700 dark:text-amber-450 border border-amber-500/25'",
  "                               }`}>",
  "                                  {isAvailable ? 'Available' : 'Coming Soon'}",
  "                               </span>",
  "                            </div>",
  "                            <div>",
  "                               <h4 className=\"font-serif font-bold text-lg text-warm-900 dark:text-warm-100 mb-1\">{platform.name}</h4>",
  "                               <p className=\"text-xs text-warm-600 dark:text-warm-400 leading-relaxed\">{platform.description || `Connect with us on ${platform.name}.`}</p>",
  "                            </div>",
  "                            <a",
  "                              href={isAvailable ? platform.url : undefined}",
  "                              target=\"_blank\"",
  "                              rel=\"noopener noreferrer\"",
  "                              onClick={(e) => { if (!isAvailable) e.preventDefault(); }}",
  "                              className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all text-center ${",
  "                                isAvailable",
  "                                  ? 'bg-primary-500 hover:bg-primary-600 text-white shadow-md'",
  "                                  : 'bg-warm-200/50 dark:bg-warm-900/40 text-warm-400 dark:text-warm-650 border border-warm-300/20 dark:border-warm-800/20 cursor-not-allowed'",
  "                              }`}",
  "                            >",
  "                              {isAvailable ? 'Connect' : 'Coming Soon'} <ExternalLink size={12} />",
  "                            </a>",
  "                         </div>",
  "                      );",
  "                   })}",
  "                </div>",
  "             </div>",
  "",
  "             <h3 className=\"font-serif text-xl font-bold text-warm-900 dark:text-warm-100 border-b border-warm-200/50 dark:border-warm-800/40 pb-2 pt-6\">Community Resources</h3>"
].join('\n');

if (!content.includes(targetDiscord)) {
  console.error("❌ Target Discord card not found!");
} else {
  content = content.replace(targetDiscord, replacementDiscord);
}

// 4. Replace footer
const targetFooter = [
  "      {/* Premium Footer */}",
  "      <footer className=\"bg-warm-100 dark:bg-warm-950 border-t border-warm-200/50 dark:border-warm-800/40 py-10 mt-16 flex-shrink-0\">",
  "        <div className=\"max-w-6xl mx-auto px-6 grid grid-cols-1 sm:grid-cols-3 gap-8 items-center text-center sm:text-left text-xs text-warm-500\">",
  "           <div>",
  "              <div className=\"flex items-center justify-center sm:justify-start gap-2 mb-2\">",
  "                 <Logo size={24} />",
  "                 <span className=\"font-serif font-bold text-sm text-warm-900 dark:text-warm-100\">WHISPRR</span>",
  "              </div>",
  "              <p className=\"text-[10px] text-warm-450 dark:text-warm-505\">Where connections feel real. Built in public since 2026.</p>",
  "           </div>",
  "           ",
  "           <div className=\"flex justify-center gap-4 text-warm-500 font-semibold select-none\">",
  "              <button onClick={() => navigate('/privacy')} className=\"hover:text-warm-700 dark:hover:text-warm-300\">Privacy Policy</button>",
  "              <button onClick={() => navigate('/terms')} className=\"hover:text-warm-700 dark:hover:text-warm-300\">Terms of Use</button>",
  "              <button onClick={() => navigate('/trust')} className=\"hover:text-warm-700 dark:hover:text-warm-300\">Trust Guidelines</button>",
  "           </div>",
  " ",
  "           <div className=\"sm:text-right text-[10px] space-y-1\">",
  "              <p>© 2026 WHISPRR. All rights reserved.</p>",
  "              <p>Independent & Community Built.</p>",
  "           </div>",
  "        </div>",
  "      </footer>"
].join('\n');

const replacementFooter = [
  "      {/* Premium Footer */}",
  "      <footer className=\"bg-warm-100 dark:bg-warm-950 border-t border-warm-200/50 dark:border-warm-800/40 py-10 mt-16 flex-shrink-0\">",
  "         <div className=\"max-w-6xl mx-auto px-6 grid grid-cols-1 sm:grid-cols-3 gap-8 items-center text-center sm:text-left text-xs text-warm-500\">",
  "            <div className=\"space-y-3\">",
  "               <div className=\"flex items-center justify-center sm:justify-start gap-2\">",
  "                  <Logo size={24} />",
  "                  <span className=\"font-serif font-bold text-sm text-warm-900 dark:text-warm-100\">WHISPRR</span>",
  "               </div>",
  "               <p className=\"text-[10px] text-warm-450 dark:text-warm-505\">Where connections feel real. Built in public since 2026.</p>",
  "               ",
  "               {/* Dynamic socials with recognizable icons */}",
  "               <div className=\"flex items-center justify-center sm:justify-start gap-3.5 text-warm-400 dark:text-warm-500\">",
  "                 {socialPlatforms.filter(p => p.status === 'available').map((platform, idx) => {",
  "                   const IconComponent = ICON_MAP[platform.icon] || Globe;",
  "                   return (",
  "                     <a",
  "                       key={idx}",
  "                       href={platform.url}",
  "                       target=\"_blank\"",
  "                       rel=\"noopener noreferrer\"",
  "                       className=\"hover:text-primary-500 transition-colors\"",
  "                       title={platform.name}",
  "                     >",
  "                       <IconComponent size={14} />",
  "                     </a>",
  "                   );",
  "                 })}",
  "               </div>",
  "            </div>",
  "            ",
  "            <div className=\"flex justify-center gap-4 text-warm-500 font-semibold select-none\">",
  "               <button onClick={() => navigate('/privacy')} className=\"hover:text-warm-700 dark:hover:text-warm-300\">Privacy Policy</button>",
  "               <button onClick={() => navigate('/terms')} className=\"hover:text-warm-700 dark:hover:text-warm-300\">Terms of Use</button>",
  "               <button onClick={() => navigate('/trust')} className=\"hover:text-warm-700 dark:hover:text-warm-300\">Trust Guidelines</button>",
  "            </div>",
  " ",
  "            <div className=\"sm:text-right text-[10px] space-y-1\">",
  "               <p>© 2026 WHISPRR. All rights reserved.</p>",
  "               <p>Independent & Community Built.</p>",
  "            </div>",
  "         </div>",
  "      </footer>"
].join('\n');

if (!content.includes(targetFooter)) {
  console.error("❌ Target footer not found!");
} else {
  content = content.replace(targetFooter, replacementFooter);
}

fs.writeFileSync(filePath, content, 'utf8');
console.log("✅ LandingPage.tsx updated successfully!");
