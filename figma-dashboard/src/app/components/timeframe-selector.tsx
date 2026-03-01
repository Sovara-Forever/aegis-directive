import React, { useState, useRef, useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';

export interface TimeFrame {
  value: string;
  label: string;
  days: number | null; // null = all time or custom
}

export const TIME_FRAMES: TimeFrame[] = [
  { value: 'last_7_days', label: 'Last 7 Days', days: 7 },
  { value: 'last_30_days', label: 'Last 30 Days', days: 30 },
  { value: 'last_90_days', label: 'Last 90 Days', days: 90 },
  { value: 'year_to_date', label: 'Year to Date', days: null },
  { value: 'all_time', label: 'All Time', days: null },
  { value: 'custom_range', label: 'Custom Range', days: null },
];

const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

interface TimeFrameSelectorProps {
  selectedTimeFrame: string;
  onTimeFrameChange: (timeFrame: string) => void;
  customStartDate?: Date | null;
  customEndDate?: Date | null;
  onCustomRangeChange?: (startDate: Date | null, endDate: Date | null) => void;
}

export const TimeFrameSelector: React.FC<TimeFrameSelectorProps> = ({
  selectedTimeFrame,
  onTimeFrameChange,
  customStartDate,
  customEndDate,
  onCustomRangeChange,
}) => {
  const [showCalendar, setShowCalendar] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState(new Date().getMonth());
  const [calendarYear, setCalendarYear] = useState(new Date().getFullYear());
  const [selectingStart, setSelectingStart] = useState(true);
  const [tempStartDate, setTempStartDate] = useState<Date | null>(customStartDate || null);
  const [tempEndDate, setTempEndDate] = useState<Date | null>(customEndDate || null);
  const calendarRef = useRef<HTMLDivElement>(null);

  const selectedOption = TIME_FRAMES.find(tf => tf.value === selectedTimeFrame);
  const previousTimeFrame = useRef(selectedTimeFrame);

  // Close calendar when clicking outside - fallback to Last 30 Days if incomplete
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (calendarRef.current && !calendarRef.current.contains(event.target as Node)) {
        // If calendar closes without complete selection, revert to last 30 days
        if (selectedTimeFrame === 'custom_range' && (!customStartDate || !customEndDate)) {
          onTimeFrameChange('last_30_days');
        }
        setShowCalendar(false);
        setSelectingStart(true);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [selectedTimeFrame, customStartDate, customEndDate, onTimeFrameChange]);

  const handleTimeFrameChange = (value: string) => {
    // If clicking Custom Range again while already selected, just reopen calendar
    if (value === 'custom_range' && selectedTimeFrame === 'custom_range') {
      setShowCalendar(true);
      setSelectingStart(true);
      setTempStartDate(customStartDate || null);
      setTempEndDate(customEndDate || null);
      return;
    }

    previousTimeFrame.current = selectedTimeFrame;
    onTimeFrameChange(value);

    if (value === 'custom_range') {
      setShowCalendar(true);
      setSelectingStart(true);
      setTempStartDate(customStartDate || null);
      setTempEndDate(customEndDate || null);
    } else {
      setShowCalendar(false);
    }
  };

  // Handle clicking on the trigger when Custom Range is already selected
  const handleTriggerClick = () => {
    if (selectedTimeFrame === 'custom_range' && !showCalendar) {
      setShowCalendar(true);
      setSelectingStart(true);
      setTempStartDate(customStartDate || null);
      setTempEndDate(customEndDate || null);
    }
  };

  const getDaysInMonth = (month: number, year: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (month: number, year: number) => {
    return new Date(year, month, 1).getDay();
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    if (direction === 'prev') {
      if (calendarMonth === 0) {
        setCalendarMonth(11);
        setCalendarYear(calendarYear - 1);
      } else {
        setCalendarMonth(calendarMonth - 1);
      }
    } else {
      if (calendarMonth === 11) {
        setCalendarMonth(0);
        setCalendarYear(calendarYear + 1);
      } else {
        setCalendarMonth(calendarMonth + 1);
      }
    }
  };

  const handleDayClick = (day: number) => {
    const selectedDate = new Date(calendarYear, calendarMonth, day);

    if (selectingStart) {
      setTempStartDate(selectedDate);
      setTempEndDate(null);
      setSelectingStart(false);
    } else {
      // Ensure end date is after start date
      if (tempStartDate && selectedDate < tempStartDate) {
        setTempStartDate(selectedDate);
        setTempEndDate(tempStartDate);
      } else {
        setTempEndDate(selectedDate);
      }
      // Apply the range
      if (onCustomRangeChange) {
        const start = tempStartDate && selectedDate < tempStartDate ? selectedDate : tempStartDate;
        const end = tempStartDate && selectedDate < tempStartDate ? tempStartDate : selectedDate;
        onCustomRangeChange(start, end);
      }
      setShowCalendar(false);
      setSelectingStart(true);
    }
  };

  const isDateInRange = (day: number) => {
    if (!tempStartDate) return false;
    const date = new Date(calendarYear, calendarMonth, day);
    if (tempEndDate) {
      return date >= tempStartDate && date <= tempEndDate;
    }
    return date.getTime() === tempStartDate.getTime();
  };

  const isStartDate = (day: number) => {
    if (!tempStartDate) return false;
    const date = new Date(calendarYear, calendarMonth, day);
    return date.getTime() === tempStartDate.getTime();
  };

  const isEndDate = (day: number) => {
    if (!tempEndDate) return false;
    const date = new Date(calendarYear, calendarMonth, day);
    return date.getTime() === tempEndDate.getTime();
  };

  const formatDateRange = () => {
    if (customStartDate && customEndDate) {
      const format = (d: Date) => `${d.getMonth() + 1}/${d.getDate()}/${d.getFullYear()}`;
      return `${format(customStartDate)} - ${format(customEndDate)}`;
    }
    return 'Custom Range';
  };

  const renderCalendarDays = () => {
    const daysInMonth = getDaysInMonth(calendarMonth, calendarYear);
    const firstDay = getFirstDayOfMonth(calendarMonth, calendarYear);
    const days = [];

    // Empty cells for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="w-8 h-8" />);
    }

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const inRange = isDateInRange(day);
      const isStart = isStartDate(day);
      const isEnd = isEndDate(day);

      days.push(
        <button
          key={day}
          onClick={() => handleDayClick(day)}
          className="w-8 h-8 rounded-md text-sm font-medium transition-all flex items-center justify-center"
          style={{
            backgroundColor: isStart || isEnd ? '#10B981' : inRange ? 'rgba(16, 185, 129, 0.2)' : 'transparent',
            color: isStart || isEnd ? '#0F172A' : inRange ? '#10B981' : '#F1F5F9',
            cursor: 'pointer',
          }}
          onMouseEnter={(e) => {
            if (!isStart && !isEnd) {
              e.currentTarget.style.backgroundColor = 'rgba(16, 185, 129, 0.3)';
            }
          }}
          onMouseLeave={(e) => {
            if (!isStart && !isEnd) {
              e.currentTarget.style.backgroundColor = inRange ? 'rgba(16, 185, 129, 0.2)' : 'transparent';
            }
          }}
        >
          {day}
        </button>
      );
    }

    return days;
  };

  const getDisplayLabel = () => {
    if (selectedTimeFrame === 'custom_range' && customStartDate && customEndDate) {
      return formatDateRange();
    }
    return selectedOption?.label || 'Last 30 Days';
  };

  return (
    <div className="flex flex-col gap-2 relative">
      <span style={{ fontSize: '12px', color: '#94A3B8', fontWeight: '500' }}>
        <Calendar size={12} className="inline-block mr-1" style={{ verticalAlign: 'middle' }} />
        Time Frame:
      </span>
      <Select value={selectedTimeFrame} onValueChange={handleTimeFrameChange}>
        <SelectTrigger
          className="w-full"
          onClick={handleTriggerClick}
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
          <SelectValue placeholder="Select time frame">
            {getDisplayLabel()}
          </SelectValue>
        </SelectTrigger>
        <SelectContent
          style={{
            backgroundColor: '#1E293B',
            borderColor: '#334155',
            color: '#F1F5F9'
          }}
        >
          {TIME_FRAMES.map((timeFrame) => (
            <SelectItem
              key={timeFrame.value}
              value={timeFrame.value}
              style={{
                color: '#F1F5F9',
                cursor: 'pointer',
                backgroundColor: 'transparent',
                fontSize: '13px',
                padding: '8px 12px'
              }}
            >
              {timeFrame.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Custom Range Calendar Popup */}
      {showCalendar && (
        <div
          ref={calendarRef}
          className="absolute top-full left-0 mt-2 z-50 rounded-lg p-4 shadow-xl"
          style={{
            backgroundColor: '#1E293B',
            border: '1px solid #334155',
            minWidth: '280px'
          }}
        >
          {/* Selection Prompt */}
          <div className="text-center mb-3 text-sm" style={{ color: '#94A3B8' }}>
            {selectingStart ? 'Select Starting Date' : 'Select Ending Date'}
          </div>

          {/* Month Navigation */}
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => navigateMonth('prev')}
              className="p-1 rounded-md transition-colors"
              style={{ color: '#94A3B8' }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(16, 185, 129, 0.2)'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              <ChevronLeft size={20} />
            </button>
            <span className="font-semibold" style={{ color: '#F1F5F9' }}>
              {MONTHS[calendarMonth]} {calendarYear}
            </span>
            <button
              onClick={() => navigateMonth('next')}
              className="p-1 rounded-md transition-colors"
              style={{ color: '#94A3B8' }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(16, 185, 129, 0.2)'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              <ChevronRight size={20} />
            </button>
          </div>

          {/* Days of Week Header */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {DAYS_OF_WEEK.map(day => (
              <div
                key={day}
                className="w-8 h-6 flex items-center justify-center text-xs font-medium"
                style={{ color: '#64748B' }}
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Days Grid */}
          <div className="grid grid-cols-7 gap-1">
            {renderCalendarDays()}
          </div>

          {/* Selected Range Display */}
          {tempStartDate && (
            <div className="mt-4 pt-3 text-center text-xs" style={{ borderTop: '1px solid #334155', color: '#94A3B8' }}>
              {tempEndDate ? (
                <>
                  <span style={{ color: '#10B981' }}>
                    {tempStartDate.toLocaleDateString()}
                  </span>
                  {' to '}
                  <span style={{ color: '#10B981' }}>
                    {tempEndDate.toLocaleDateString()}
                  </span>
                </>
              ) : (
                <>Start: <span style={{ color: '#10B981' }}>{tempStartDate.toLocaleDateString()}</span></>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// Utility function to get date filter for Supabase queries
export function getTimeFrameDateFilter(
  timeFrameValue: string,
  customStartDate?: Date | null,
  customEndDate?: Date | null
): { startDate: Date | null; endDate: Date | null } {
  const timeFrame = TIME_FRAMES.find(tf => tf.value === timeFrameValue);

  if (!timeFrame) return { startDate: null, endDate: null };

  // Custom range
  if (timeFrame.value === 'custom_range') {
    return {
      startDate: customStartDate || null,
      endDate: customEndDate || null
    };
  }

  // Year to date
  if (timeFrame.value === 'year_to_date') {
    const now = new Date();
    return {
      startDate: new Date(now.getFullYear(), 0, 1), // January 1st of current year
      endDate: new Date() // Today
    };
  }

  // All time
  if (timeFrame.value === 'all_time' || timeFrame.days === null) {
    return { startDate: null, endDate: null };
  }

  // Preset ranges
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - timeFrame.days);

  return { startDate, endDate };
}
