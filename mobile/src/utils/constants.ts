export const BOOK_CATEGORIES = [
  'Fiction',
  'Non-Fiction',
  'Science',
  'Mathematics',
  'History',
  'Technology',
  'Literature',
  'Arts',
  'Children',
  'Other',
] as const;

export const BOOK_CONDITIONS = ['New', 'Like New', 'Good', 'Fair', 'Poor'] as const;

export const DELIVERY_METHODS = ['meetup', 'pickup', 'mail'] as const;

export const REPORT_CATEGORIES = [
  'fake_listing',
  'inappropriate_content',
  'suspicious_user',
  'harassment',
  'spam',
  'other',
] as const;

export const REPORT_PRIORITIES = ['low', 'medium', 'high'] as const;
