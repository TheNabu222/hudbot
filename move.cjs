const fs = require('fs');

let code = fs.readFileSync('App.tsx', 'utf-8');

// The marker where we want to insert the closing </div>
const insertMarker = "{/* Global styles for animations injected by Tailwind or custom */}";

// We need to identify the exact </div> that closes the stage.
// It is physically right before `{/* Fullscreen Cutscene Player */}`.
// We can find:
//                       </div>
//                     );
//                   })}
//               </div>
// 
//               {/* Fullscreen Cutscene Player */}

const cutRegex = /([ \t]*)<\/div>\n[ \t]*\n([ \t]*{\/\* Fullscreen Cutscene Player \*\/})/;

const match = code.match(cutRegex);
if (match) {
    // Remove the </div> from here.
    code = code.replace(cutRegex, "$2");

    // Re-insert it right before the insertMarker, maintaining the indentation of the marker.
    const insertRegex = new RegExp(`([ \\t]*)(\\{/\\* Global styles for animations injected by Tailwind or custom \\*/\\})`);
    
    // We add the </div> with same indentation as the stage wrapper? The stage wrapper is at some indentation.
    // The main starts at 12 spaces usually. Stage wrapper is probably 14.
    // We'll just put `</div>\n` with the same indent as the marker.
    code = code.replace(insertRegex, "$1</div>\n\n$1$2");
    
    fs.writeFileSync('App.tsx', code);
    console.log("Moved closing </div> successfully.");
} else {
    console.log("Could not find the cut regex.");
}

