import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { format, isToday, isThisMonth, addDays } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return '';
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return format(dateObj, 'MMM d, yyyy');
}

export function getTimeUntil(date: Date | string | null | undefined): string {
  if (!date) return '';
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const today = new Date();
  
  // if date is in the past
  if (dateObj < today) {
    const diffTime = Math.abs(today.getTime() - dateObj.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return `Overdue by ${diffDays} ${diffDays === 1 ? 'day' : 'days'}`;
  }
  
  // if date is today
  if (isToday(dateObj)) {
    return 'Due today';
  }
  
  // if date is in the future
  const diffTime = Math.abs(dateObj.getTime() - today.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return `In ${diffDays} ${diffDays === 1 ? 'day' : 'days'}`;
}

export function getInitials(name: string): string {
  if (!name) return '';
  
  const names = name.split(' ');
  if (names.length === 1) {
    return names[0].charAt(0).toUpperCase();
  }
  
  return (names[0].charAt(0) + names[names.length - 1].charAt(0)).toUpperCase();
}

export function truncateText(text: string, maxLength: number): string {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  
  return text.substring(0, maxLength) + '...';
}

export function getMonthDays(year: number, month: number): Date[] {
  const days: Date[] = [];
  
  // Get first day of month
  const firstDay = new Date(year, month, 1);
  
  // Get last day of month
  const lastDay = new Date(year, month + 1, 0);
  
  // Get day of week of first day (0 = Sunday, 6 = Saturday)
  const firstDayOfWeek = firstDay.getDay();
  
  // Add days from previous month to fill the calendar
  for (let i = firstDayOfWeek; i > 0; i--) {
    const day = new Date(year, month, 1 - i);
    days.push(day);
  }
  
  // Add all days of current month
  for (let i = 1; i <= lastDay.getDate(); i++) {
    const day = new Date(year, month, i);
    days.push(day);
  }
  
  // Add days from next month to fill the calendar
  const lastDayOfWeek = lastDay.getDay();
  for (let i = 1; i <= 6 - lastDayOfWeek; i++) {
    const day = new Date(year, month + 1, i);
    days.push(day);
  }
  
  return days;
}

export function downloadCSV(data: any[], filename: string): void {
  if (!data || !data.length) return;
  
  // Get headers from first object
  const headers = Object.keys(data[0]);
  
  // Create CSV content
  let csvContent = headers.join(',') + '\n';
  
  data.forEach(item => {
    const row = headers.map(header => {
      const value = item[header];
      // Handle special cases (objects, arrays, null, undefined)
      if (value === null || value === undefined) return '';
      if (typeof value === 'object') return JSON.stringify(value).replace(/"/g, '""');
      
      // Ensure strings with commas are quoted
      if (typeof value === 'string' && (value.includes(',') || value.includes('"') || value.includes('\n'))) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      
      return value;
    }).join(',');
    
    csvContent += row + '\n';
  });
  
  // Create blob and download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function downloadJSON(data: any, filename: string): void {
  const jsonContent = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonContent], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
