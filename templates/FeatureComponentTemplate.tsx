import React, { useState } from 'react';

/**
 * FEATURE COMPONENT TEMPLATE
 * 
 * Use this template to build UI/Logic extensions for the game engine.
 * It is completely independent and can be dropped into App.tsx or components/.
 * 
 * You can inject props from the main project state directly.
 */

// Define props for integrating with the main Project state
interface FeatureExtensionProps {
   project: any;
   updateProject: (updates: Partial<any>) => void;
   onClose: () => void;
}

export const FeatureExtensionTemplate: React.FC<FeatureExtensionProps> = ({ project, updateProject, onClose }) => {
   const [localState, setLocalState] = useState<string>('');

   const handleSave = () => {
       // example state mutation
       // updateProject({ ... });
       onClose();
   }

   return (
       <div className="fixed inset-0 z-[5000] bg-black/80 flex items-center justify-center p-4">
           <div className="bg-neutral-900 border border-neutral-700 rounded-lg p-6 max-w-md w-full shadow-2xl">
               <h2 className="text-xl font-bold text-white mb-4">Custom Feature Extension</h2>
               
               <p className="text-sm text-neutral-400 mb-6">
                   This is an independent React component template. Add independent features using this structure.
               </p>

               <div className="mb-4">
                   <label className="block text-xs text-neutral-500 mb-1">Feature Setting</label>
                   <input 
                      type="text" 
                      value={localState}
                      onChange={(e) => setLocalState(e.target.value)}
                      className="w-full bg-neutral-950 border border-neutral-800 rounded px-3 py-2 text-sm text-white" 
                   />
               </div>

               <div className="flex justify-end gap-3 mt-6">
                   <button 
                       onClick={onClose}
                       className="px-4 py-2 hover:bg-neutral-800 text-neutral-300 rounded"
                   >
                       Cancel
                   </button>
                   <button 
                       onClick={handleSave}
                       className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded"
                   >
                       Save & Apply
                   </button>
               </div>
           </div>
       </div>
   );
}
