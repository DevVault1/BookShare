export const formatDate = (value?: string | Date): string => {
  if (!value) return 'N/A';
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(value));
};

export const formatDateTime = (value?: string | Date): string => {
  if (!value) return 'N/A';
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(value));
};

export const formatRating = (value?: number | null): string => {
  if (!value || value <= 0) return 'New';
  return value.toFixed(1);
};
