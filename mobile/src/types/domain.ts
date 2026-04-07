export type UserRole = 'donor' | 'student' | 'admin';

export interface DonorReputation {
  overallScore?: number;
  responseSpeedScore?: number;
  accuracyScore?: number;
  receiverFeedbackScore?: number;
  totalReviewedDonations?: number;
  respondedRequests?: number;
  avgResponseHours?: number;
  lastCalculatedAt?: string;
}

export interface User {
  _id: string;
  name: string;
  email: string;
  role: UserRole;
  location?: string;
  phoneNumber?: string;
  profileImage?: string;
  interests?: string[];
  bio?: string;
  authProvider?: 'local' | 'google' | 'facebook' | 'hybrid';
  twoFactorEnabled?: boolean;
  twoFactorMethod?: 'email' | 'sms';
  donorReputation?: DonorReputation;
}

export interface Book {
  _id: string;
  title: string;
  author: string;
  category: string;
  condition: string;
  status: 'available' | 'requested' | 'adopted';
  description?: string;
  location?: string;
  image?: string;
  isbn?: string;
  language?: string;
  pages?: number;
  publishedYear?: number;
  tags?: string[];
  ratingsAverage?: number;
  ratingsCount?: number;
  donorId?: User;
  createdAt?: string;
}

export interface RequestItem {
  _id: string;
  bookId: Book;
  requesterId: User;
  donorId: User;
  status: 'pending' | 'approved' | 'rejected';
  message?: string;
  responseNote?: string;
  requestDate?: string;
  responseDate?: string;
  createdAt?: string;
}

export interface Review {
  _id: string;
  reviewType: 'public' | 'private';
  donationId?: string;
  bookId?: Book;
  userId?: User;
  donorId?: User;
  receiverId?: User;
  bookRating: number;
  donorFeedbackRating?: number;
  descriptionAccuracyRating?: number;
  reviewText?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Donation {
  _id: string;
  bookId: Book;
  donorId: User;
  receiverId: User;
  requestId?: string;
  reviewId?: Review;
  deliveryMethod?: 'pickup' | 'mail' | 'meetup';
  status: 'pending' | 'delivered' | 'confirmed';
  notes?: string;
  deliveredAt?: string;
  confirmedAt?: string;
  reviewedAt?: string;
  createdAt?: string;
}

export interface NotificationItem {
  _id: string;
  userId: string;
  type: 'request' | 'approval' | 'rejection' | 'message' | 'donation' | 'report' | 'security' | 'system';
  message: string;
  isRead: boolean;
  link?: string;
  relatedId?: string;
  createdAt?: string;
}

export interface ConversationSummary {
  _id: string;
  conversationKey: string;
  user: User;
  book?: Book | null;
  lastMessage?: string;
  lastMessageAt?: string;
  lastMessageSenderId?: string;
  unreadCount?: number;
}

export interface ChatMessage {
  _id: string;
  conversationId: string;
  conversationKey?: string;
  senderId: User | string;
  receiverId: User | string;
  message: string;
  bookId?: Book;
  isRead?: boolean;
  createdAt: string;
}

export interface PublicReviewCollection {
  reviews: Review[];
  summary: {
    bookRatingAverage: number;
    reviewsCount: number;
  };
  myReview: Review | null;
  total: number;
  page: number;
  pages: number;
}

export interface ReportItem {
  _id: string;
  reporterId: User;
  targetType: 'book' | 'user' | 'message' | 'platform' | 'other';
  targetId?: string;
  category: 'fake_listing' | 'inappropriate_content' | 'suspicious_user' | 'harassment' | 'spam' | 'other';
  description: string;
  status: 'pending' | 'under_review' | 'resolved' | 'dismissed';
  priority: 'low' | 'medium' | 'high';
  adminNotes?: string;
  createdAt?: string;
}

export interface TwoFactorStatus {
  enabled: boolean;
  method: 'email' | 'sms';
  email: string;
  phoneNumber?: string;
}
