'use client';

interface AdSlotProps {
  slotId?: string;
  format?: 'auto' | 'rectangle' | 'horizontal' | 'vertical';
  className?: string;
}

export function AdSlot({ slotId = 'placeholder', format = 'auto', className = '' }: AdSlotProps) {
  return (
    <div 
      className={className} 
      data-ad-slot={slotId} 
      data-ad-format={format} 
      style={{ display: 'none' }} 
    />
  );
}
