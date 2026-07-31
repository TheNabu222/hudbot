'use client';
import React, { useCallback } from 'react';
import { useStudioStore } from '@/lib/store';
import { generateId } from '@/lib/id-utils';
import type { InventoryItem, CraftingRecipe } from '@/lib/types';
import { Plus, Trash2, Package, Beaker, ChefHat } from 'lucide-react';
import { toast } from 'sonner';

export default function ItemPanel() {
  const {
    project, selectedItemId, setSelectedItem,
    addItem, updateItem, deleteItem,
    addRecipe, updateRecipe, deleteRecipe,
  } = useStudioStore();

  const items = project?.items ?? [];
  const recipes = project?.recipes ?? [];
  const selected = items?.find?.((i: InventoryItem) => i?.id === selectedItemId) ?? null;

  const handleAddItem = useCallback(() => {
    const name = prompt('Item name:');
    if (name?.trim?.()) {
      addItem(name.trim());
      toast.success('Item added');
    }
  }, [addItem]);

  const handleAddRecipe = useCallback(() => {
    const name = prompt('Recipe name:');
    if (name?.trim?.()) {
      addRecipe(name.trim());
      toast.success('Recipe added');
    }
  }, [addRecipe]);

  return (
    <div className="h-full flex">
      {/* Item list */}
      <div className="w-64 bg-[#111128] border-r border-[#1f1f3f] overflow-y-auto shrink-0">
        <div className="p-2 border-b border-[#1f1f3f] flex items-center justify-between">
          <h3 className="text-[10px] font-bold text-gray-500 uppercase">Items ({items?.length ?? 0})</h3>
          <button onClick={handleAddItem} className="p-1 hover:bg-[#252550] rounded"><Plus size={12} className="text-gray-400" /></button>
        </div>
        {items?.map?.((item: InventoryItem) => (
          <button
            key={item?.id}
            onClick={() => setSelectedItem(item?.id ?? null)}
            className={`w-full px-3 py-2 text-left text-xs border-b border-[#1a1a2e] flex items-center gap-2 ${
              item?.id === selectedItemId ? 'bg-cyan-500/15 text-cyan-300' : 'hover:bg-[#1a1a3a] text-gray-400'
            }`}
          >
            <Package size={12} />
            <div className="truncate">
              <div className="truncate">{item?.name ?? 'Unknown'}</div>
              <div className="text-[9px] text-gray-600">{item?.category ?? 'normal'}</div>
            </div>
          </button>
        ))}

        {/* Recipe list */}
        <div className="p-2 border-t border-b border-[#1f1f3f] flex items-center justify-between mt-2">
          <h3 className="text-[10px] font-bold text-gray-500 uppercase">Recipes ({recipes?.length ?? 0})</h3>
          <button onClick={handleAddRecipe} className="p-1 hover:bg-[#252550] rounded"><Plus size={12} className="text-gray-400" /></button>
        </div>
        {recipes?.map?.((r: CraftingRecipe) => (
          <div key={r?.id} className="px-3 py-2 text-xs border-b border-[#1a1a2e] flex items-center justify-between text-gray-400">
            <div className="flex items-center gap-1.5 truncate">
              <ChefHat size={10} className="text-amber-400" />
              <span className="truncate">{r?.name ?? 'Recipe'}</span>
            </div>
            <button onClick={() => deleteRecipe(r?.id ?? '')} className="p-0.5 hover:bg-red-500/20 rounded"><Trash2 size={10} className="text-red-400" /></button>
          </div>
        ))}
      </div>

      {/* Item editor */}
      {selected ? (
        <div className="flex-1 overflow-y-auto p-4 space-y-4 max-w-2xl">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-gray-200 flex items-center gap-2">
              <Package size={16} className="text-cyan-400" /> {selected?.name ?? 'Item'}
            </h3>
            <button onClick={() => { deleteItem(selected?.id ?? ''); setSelectedItem(null); }} className="p-1.5 hover:bg-red-500/20 rounded text-red-400">
              <Trash2 size={14} />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <label className="block">
              <span className="text-[10px] text-gray-500">Name</span>
              <input className="w-full bg-[#0d0d1a] border border-[#2a2a4a] rounded px-3 py-1.5 text-sm text-gray-200"
                value={selected?.name ?? ''}
                onChange={(e: any) => updateItem(selected?.id ?? '', { name: e?.target?.value ?? '' })}
              />
            </label>
            <label className="block">
              <span className="text-[10px] text-gray-500">Category</span>
              <select className="w-full bg-[#0d0d1a] border border-[#2a2a4a] rounded px-3 py-1.5 text-sm text-gray-200"
                value={selected?.category ?? 'normal'}
                onChange={(e: any) => updateItem(selected?.id ?? '', { category: e?.target?.value as any })}
              >
                <option value="normal">Normal</option>
                <option value="consumable">Consumable</option>
                <option value="ingredient">Ingredient</option>
                <option value="quest">Quest</option>
                <option value="crafting_station">Crafting Station</option>
              </select>
            </label>
          </div>

          <label className="block">
            <span className="text-[10px] text-gray-500">Description</span>
            <textarea className="w-full bg-[#0d0d1a] border border-[#2a2a4a] rounded px-3 py-2 text-sm text-gray-200 h-20 resize-y"
              value={selected?.description ?? ''}
              onChange={(e: any) => updateItem(selected?.id ?? '', { description: e?.target?.value ?? '' })}
            />
          </label>

          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 text-xs text-gray-300">
              <input type="checkbox" className="rounded" checked={selected?.stackable ?? false}
                onChange={(e: any) => updateItem(selected?.id ?? '', { stackable: e?.target?.checked ?? false })} />
              Stackable
            </label>
            <label className="flex items-center gap-2 text-xs text-gray-300">
              <input type="checkbox" className="rounded" checked={selected?.isUsable ?? false}
                onChange={(e: any) => updateItem(selected?.id ?? '', { isUsable: e?.target?.checked ?? false })} />
              Usable
            </label>
            <label className="flex items-center gap-2 text-xs text-gray-300">
              <input type="checkbox" className="rounded" checked={selected?.consumeOnUse ?? false}
                onChange={(e: any) => updateItem(selected?.id ?? '', { consumeOnUse: e?.target?.checked ?? false })} />
              Consume on Use
            </label>
          </div>

          {selected?.isUsable && (
            <label className="block">
              <span className="text-[10px] text-gray-500">Use Message</span>
              <input className="w-full bg-[#0d0d1a] border border-[#2a2a4a] rounded px-3 py-1.5 text-sm text-gray-200"
                value={selected?.useMessage ?? ''}
                onChange={(e: any) => updateItem(selected?.id ?? '', { useMessage: e?.target?.value ?? '' })}
              />
            </label>
          )}
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center text-gray-500">
          <div className="text-center">
            <Package className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="text-sm">Select an item to edit</p>
          </div>
        </div>
      )}
    </div>
  );
}
