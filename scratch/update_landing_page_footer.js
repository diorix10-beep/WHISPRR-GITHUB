import fs from 'fs';
import path from 'path';

const filePath = path.resolve('src/pages/LandingPage.tsx');
let content = fs.readFileSync(filePath, 'utf8');

const replacementFooter = `      {/* Premium Footer */}
      <footer className="bg-warm-100 dark:bg-warm-950 border-t border-warm-200/50 dark:border-warm-800/40 py-10 mt-16 flex-shrink-0">
         <div className="max-w-6xl mx-auto px-6 grid grid-cols-1 sm:grid-cols-3 gap-8 items-center text-center sm:text-left text-xs text-warm-500">
            <div className="space-y-3">
               <div className="flex items-center justify-center sm:justify-start gap-2">
                  <Logo size={24} />
                  <span className="font-serif font-bold text-sm text-warm-900 dark:text-warm-100">WHISPRR</span>
               </div>
               <p className="text-[10px] text-warm-450 dark:text-warm-505">Where connections feel real. Built in public since 2026.</p>
               
               {/* Dynamic socials with recognizable icons */}
               <div className="flex items-center justify-center sm:justify-start gap-3.5 text-warm-400 dark:text-warm-500">
                 {socialPlatforms.filter(p => p.status === 'available').map((platform, idx) => {
                   const IconComponent = ICON_MAP[platform.icon] || Globe;
                   return (
                     <a
                       key={idx}
                       href={platform.url}
                       target="_blank"
                       rel="noopener noreferrer"
                       className="hover:text-primary-500 transition-colors"
                       title={platform.name}
                     >
                       <IconComponent size={14} />
                     </a>
                   );
                 })}
               </div>
            </div>
            
            <div className="flex justify-center gap-4 text-warm-500 font-semibold select-none">
               <button onClick={() => navigate('/privacy')} className="hover:text-warm-700 dark:hover:text-warm-300">Privacy Policy</button>
               <button onClick={() => navigate('/terms')} className="hover:text-warm-700 dark:hover:text-warm-300">Terms of Use</button>
               <button onClick={() => navigate('/trust')} className="hover:text-warm-700 dark:hover:text-warm-300">Trust Guidelines</button>
            </div>
 
            <div className="sm:text-right text-[10px] space-y-1">
               <p>© 2026 WHISPRR. All rights reserved.</p>
               <p>Independent & Community Built.</p>
            </div>
         </div>
      </footer>`;

const footerRegex = /\/\* Premium Footer \*\/\}[\s\S]+?<\/footer>/;

if (!footerRegex.test(content)) {
  console.error("❌ Premium Footer block not found via regex!");
} else {
  content = content.replace(footerRegex, `/* Premium Footer */}\n${replacementFooter.replace('      {/* Premium Footer */}', '')}`);
  fs.writeFileSync(filePath, content, 'utf8');
  console.log("✅ Footer updated successfully via regex!");
}
