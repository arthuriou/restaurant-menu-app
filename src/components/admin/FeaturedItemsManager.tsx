"use client";

import { useState } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { MenuItem } from '@/types';
import Image from 'next/image';

interface SortableItemProps {
  item: MenuItem;
  onRemove: (id: string) => void;
}

function SortableItem({ item, onRemove }: SortableItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-3 p-3 bg-zinc-50 dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800"
    >
      <button
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing p-1 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded"
      >
        <GripVertical className="w-5 h-5 text-muted-foreground" />
      </button>
      
      {item.imageUrl && (
        <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0">
          <Image 
            src={item.imageUrl} 
            alt={item.name} 
            width={48} 
            height={48} 
            className="object-cover w-full h-full"
          />
        </div>
      )}
      
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm truncate">{item.name}</p>
        <p className="text-xs text-muted-foreground">{item.price.toLocaleString()} FCFA</p>
      </div>
      
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 flex-shrink-0"
        onClick={() => onRemove(item.id)}
      >
        <X className="w-4 h-4" />
      </Button>
    </div>
  );
}

interface FeaturedItemsManagerProps {
  items: MenuItem[];
  onReorder: (items: MenuItem[]) => void;
}

export function FeaturedItemsManager({ items, onReorder }: FeaturedItemsManagerProps) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = items.findIndex((item) => item.id === active.id);
      const newIndex = items.findIndex((item) => item.id === over.id);

      const reorderedItems = arrayMove(items, oldIndex, newIndex);
      onReorder(reorderedItems);
    }
  };

  const handleRemove = (id: string) => {
    const updated = items.filter((item) => item.id !== id);
    onReorder(updated);
  };

  if (items.length === 0) {
    return (
      <div className="text-center py-8 text-sm text-muted-foreground border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-lg">
        Aucun item vedette. Activez "Item Vedette" sur des plats pour les ajouter ici.
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <div className="space-y-2">
        <p className="text-sm text-muted-foreground mb-3">
          Glissez-déposez pour réorganiser l'ordre d'affichage ({items.length}/8 recommandé)
        </p>
        <SortableContext
          items={items.map(i => i.id)}
          strategy={verticalListSortingStrategy}
        >
          {items.map((item) => (
            <SortableItem key={item.id} item={item} onRemove={handleRemove} />
          ))}
        </SortableContext>
      </div>
    </DndContext>
  );
}
