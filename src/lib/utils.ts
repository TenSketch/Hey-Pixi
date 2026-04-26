
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function exportToCSV<T>(data: T[], filename: string) {
  if (!data || !data.length) return;

  // Extract headers
  const headers = Object.keys(data[0] as object);
  
  // Create CSV string
  const csvContent = [
    headers.join(','),
    ...data.map(row => 
      headers.map(header => {
        const value = (row as Record<string, unknown>)[header];
        // Handle special characters and nested objects simply
        if (value === null || value === undefined) return '""';
        if (typeof value === 'object') return `"${JSON.stringify(value).replace(/"/g, '""')}"`;
        return `"${String(value).replace(/"/g, '""')}"`;
      }).join(',')
    )
  ].join('\n');

  // Create blob and trigger download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
