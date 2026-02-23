import React, { useState, useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '../../../lib/supabase';

interface Dealership {
  id: string;
  name: string;
}

interface DealershipSelectorProps {
  selectedDealership: string;
  onDealershipChange: (dealership: string) => void;
}

export const DealershipSelector: React.FC<DealershipSelectorProps> = ({
  selectedDealership,
  onDealershipChange,
}) => {
  const [dealerships, setDealerships] = useState<Dealership[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDealerships() {
      try {
        const { data, error } = await supabase
          .from('dealerships')
          .select('id, name')
          .order('name');

        if (error) {
          console.error('Error loading dealerships:', error);
          return;
        }

        const loadedDealerships = data || [];
        setDealerships(loadedDealerships);

        // Auto-select first dealership if current selection doesn't exist
        if (loadedDealerships.length > 0) {
          const selectionExists = loadedDealerships.some(d => d.name === selectedDealership);
          if (!selectionExists) {
            console.log('Default dealership not found, selecting first:', loadedDealerships[0].name);
            onDealershipChange(loadedDealerships[0].name);
          }
        }
      } catch (err) {
        console.error('Failed to load dealerships:', err);
      } finally {
        setLoading(false);
      }
    }

    loadDealerships();
  }, []);

  return (
    <div className="flex flex-col gap-2">
      <span style={{ fontSize: '12px', color: '#94A3B8', fontWeight: '500' }}>Dealership:</span>
      <Select value={selectedDealership} onValueChange={onDealershipChange}>
        <SelectTrigger
          className="w-full"
          style={{
            backgroundColor: '#0F172A',
            borderColor: '#334155',
            color: '#F1F5F9',
            fontSize: '13px',
            padding: '8px 12px',
            height: 'auto',
            minHeight: '36px'
          }}
        >
          <SelectValue placeholder="Select dealership" />
        </SelectTrigger>
        <SelectContent
          style={{
            backgroundColor: '#1E293B',
            borderColor: '#334155',
            color: '#F1F5F9'
          }}
        >
          {loading ? (
            <SelectItem value="loading" disabled style={{ color: '#94A3B8' }}>Loading...</SelectItem>
          ) : dealerships.length === 0 ? (
            <SelectItem value="none" disabled style={{ color: '#94A3B8' }}>No dealerships found</SelectItem>
          ) : (
            dealerships.map((dealer) => (
              <SelectItem
                key={dealer.id}
                value={dealer.name}
                style={{
                  color: '#F1F5F9',
                  cursor: 'pointer',
                  backgroundColor: 'transparent',
                  fontSize: '13px',
                  padding: '8px 12px'
                }}
              >
                {dealer.name}
              </SelectItem>
            ))
          )}
        </SelectContent>
      </Select>
    </div>
  );
};
