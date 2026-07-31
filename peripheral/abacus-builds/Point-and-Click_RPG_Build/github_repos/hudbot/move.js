const fs = require('fs');
let code = fs.readFileSync('App.tsx', 'utf-8');

const markerCutscene = "{/* Fullscreen Cutscene Player */}";
const markerEndMain = "</main>"; // No wait, main has a closing tag somewhere.

// Let's find the closing tag of the <div className="relative mx-auto my-auto ...">.
// It is at line 4753. Let's just find exactly that using a unique string.
// Right above Cutscene player, we have:
//                       </div>
//                     );
//                   })}
//               </div>
// 
//               {/* Fullscreen Cutscene Player */}

const splitStr = `                  })}
              </div>`;

const parts = code.split(splitStr);

// We want to move everything from {/* Fullscreen Cutscene Player */} down to just before </main>
// Wait! Let's find </main>.
const mainParts = code.split('</main>');

// The first part of mainParts contains the entire main content.
// Wait, this is error prone.
