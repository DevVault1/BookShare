import type {
  Book,
  ChatMessage,
  ConversationSummary,
  Donation,
  NotificationItem,
  PublicReviewCollection,
  ReportItem,
  RequestItem,
  Review,
  TwoFactorStatus,
  User,
} from '../types/domain';
import { apiClient } from './client';

export interface LoginResponse {
  token?: string;
  user?: User;
  requiresTwoFactor?: boolean;
  pendingToken?: string;
  method?: 'email' | 'sms';
  destinationHint?: string;
  message?: string;
}

export interface BooksQuery {
  search?: string;
  category?: string;
  condition?: string;
  status?: string;
  page?: number;
  limit?: number;
}

export interface BooksListResponse {
  books: Book[];
  total: number;
  pages: number;
  page: number;
}

export interface MyAnalyticsResponse {
  donorImpactAnalytics?: {
    totalBooksShared?: number;
    studentsReached?: number;
    citiesReached?: number;
    favouriteSharedCategory?: string;
    categoryBreakdown?: Array<{ label: string; count: number }>;
    cityBreakdown?: Array<{ label: string; count: number }>;
    monthlyTrend?: Array<{ label: string; count: number }>;
    impactMap?: Array<{ city: string; count: number }>;
    recentRecipients?: Array<{ name: string; date: string; bookTitle: string }>;
  };
  studentReadingAnalytics?: {
    totalAdoptedBooks?: number;
    adoptedThisYear?: number;
    adoptedThisMonth?: number;
    favouriteCategory?: string;
    categoryBreakdown?: Array<{ label: string; count: number }>;
    topAuthors?: Array<{ label: string; count: number }>;
    monthlyTrend?: Array<{ label: string; count: number }>;
    recentBooks?: Array<{ title: string; date: string }>;
  };
}

export const authApi = {
  login: async (email: string, password: string) => {
    const { data } = await apiClient.post<LoginResponse>('/login', { email, password });
    return data;
  },
  register: async (payload: {
    name: string;
    email: string;
    password: string;
    role: 'donor' | 'student' | 'admin';
    location?: string;
    phoneNumber?: string;
  }) => {
    const { data } = await apiClient.post<LoginResponse>('/register', payload);
    return data;
  },
  verifyTwoFactorLogin: async (pendingToken: string, code: string) => {
    const { data } = await apiClient.post<LoginResponse>('/login/verify-2fa', { pendingToken, code });
    return data;
  },
  resendTwoFactorLogin: async (pendingToken: string) => {
    const { data } = await apiClient.post<LoginResponse>('/login/resend-2fa', { pendingToken });
    return data;
  },
  getMe: async () => {
    const { data } = await apiClient.get<User>('/me');
    return data;
  },
  updateProfile: async (payload: FormData) => {
    const { data } = await apiClient.put<User>('/profile', payload, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  },
  getTwoFactorStatus: async () => {
    const { data } = await apiClient.get<TwoFactorStatus>('/2fa/status');
    return data;
  },
  requestTwoFactorSetup: async (payload: { method: 'email' | 'sms'; phoneNumber?: string }) => {
    const { data } = await apiClient.post<{ method: 'email' | 'sms'; destinationHint?: string; message: string }>(
      '/2fa/setup/request',
      payload,
    );
    return data;
  },
  verifyTwoFactorSetup: async (payload: { method: 'email' | 'sms'; code: string }) => {
    const { data } = await apiClient.post<{ message: string; user: User }>('/2fa/setup/verify', payload);
    return data;
  },
  disableTwoFactor: async () => {
    const { data } = await apiClient.post<{ message: string; user: User }>('/2fa/disable');
    return data;
  },
};

export const booksApi = {
  getBooks: async (query: BooksQuery) => {
    const { data } = await apiClient.get<BooksListResponse>('/books', { params: query });
    return data;
  },
  getBook: async (id: string) => {
    const { data } = await apiClient.get<Book>(`/books/${id}`);
    return data;
  },
  lookupIsbn: async (isbn: string) => {
    const { data } = await apiClient.get<{
      message?: string;
      providers?: Record<string, boolean>;
      details?: string[];
      book?: Partial<Book> & { publisher?: string };
    }>(`/books/lookup/isbn/${isbn}`);
    return data;
  },
  getMyBooks: async () => {
    const { data } = await apiClient.get<Book[]>('/books/my-books');
    return data;
  },
  getRecommendations: async () => {
    const { data } = await apiClient.get<Book[]>('/books/recommendations');
    return data;
  },
  createBook: async (payload: FormData) => {
    const { data } = await apiClient.post<Book>('/books', payload, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  },
  updateBook: async (id: string, payload: FormData) => {
    const { data } = await apiClient.put<Book>(`/books/${id}`, payload, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  },
  deleteBook: async (id: string) => {
    const { data } = await apiClient.delete<{ message: string }>(`/books/${id}`);
    return data;
  },
};

export const requestsApi = {
  create: async (payload: { bookId: string; message?: string }) => {
    const { data } = await apiClient.post<RequestItem>('/requests', payload);
    return data;
  },
  getUserRequests: async () => {
    const { data } = await apiClient.get<RequestItem[]>('/requests/user');
    return data;
  },
  getDonorRequests: async () => {
    const { data } = await apiClient.get<RequestItem[]>('/requests/donor');
    return data;
  },
  respond: async (
    id: string,
    payload: { status: 'approved' | 'rejected'; responseNote?: string; deliveryMethod?: 'meetup' | 'pickup' | 'mail' },
  ) => {
    const { data } = await apiClient.put<RequestItem>(`/requests/${id}/respond`, payload);
    return data;
  },
};

export const donationsApi = {
  getDonations: async () => {
    const { data } = await apiClient.get<Donation[]>('/donations');
    return data;
  },
  updateStatus: async (id: string, payload: { status: 'pending' | 'delivered' | 'confirmed'; notes?: string }) => {
    const { data } = await apiClient.put<Donation>(`/donations/${id}/status`, payload);
    return data;
  },
};

export const messagesApi = {
  startConversation: async (payload: { receiverId: string; bookId?: string }) => {
    const { data } = await apiClient.post<ConversationSummary>('/messages/conversations/start', payload);
    return data;
  },
  getConversations: async () => {
    const { data } = await apiClient.get<ConversationSummary[]>('/messages/conversations');
    return data;
  },
  getConversationMessages: async (conversationId: string) => {
    const { data } = await apiClient.get<{ conversation: ConversationSummary; messages: ChatMessage[] }>(
      `/messages/conversations/${conversationId}/messages`,
    );
    return data;
  },
  markConversationRead: async (conversationId: string) => {
    const { data } = await apiClient.put<{ conversation: ConversationSummary }>(
      `/messages/conversations/${conversationId}/read`,
    );
    return data;
  },
  sendMessage: async (payload: { conversationId: string; receiverId: string; bookId?: string; message: string }) => {
    const { data } = await apiClient.post<ChatMessage>('/messages', payload);
    return data;
  },
};

export const notificationsApi = {
  getNotifications: async () => {
    const { data } = await apiClient.get<NotificationItem[]>('/notifications');
    return data;
  },
  markRead: async () => {
    const { data } = await apiClient.put<{ message: string }>('/notifications/mark-read');
    return data;
  },
};

export const reviewsApi = {
  getPublicBookReviews: async (bookId: string, page = 1) => {
    const { data } = await apiClient.get<PublicReviewCollection>(`/reviews/public/book/${bookId}`, {
      params: { page, limit: 10 },
    });
    return data;
  },
  createPublicReview: async (bookId: string, payload: { bookRating: number; reviewText: string }) => {
    const { data } = await apiClient.post<{ review: Review; summary: { bookRatingAverage: number; reviewsCount: number } }>(
      `/reviews/public/book/${bookId}`,
      payload,
    );
    return data;
  },
  createPrivateReview: async (
    donationId: string,
    payload: { bookRating: number; donorFeedbackRating: number; descriptionAccuracyRating: number; reviewText: string },
  ) => {
    const { data } = await apiClient.post<{ review: Review }>(`/reviews/donation/${donationId}`, payload);
    return data;
  },
  updateReview: async (reviewId: string, payload: Record<string, string | number>) => {
    const { data } = await apiClient.put<{ review: Review }>(`/reviews/${reviewId}`, payload);
    return data;
  },
  deleteReview: async (reviewId: string) => {
    const { data } = await apiClient.delete<{ message: string }>(`/reviews/${reviewId}`);
    return data;
  },
};

export const reportsApi = {
  createReport: async (payload: {
    targetType: 'book' | 'user' | 'message' | 'platform' | 'other';
    targetId?: string;
    category: 'fake_listing' | 'inappropriate_content' | 'suspicious_user' | 'harassment' | 'spam' | 'other';
    description: string;
    priority: 'low' | 'medium' | 'high';
  }) => {
    const { data } = await apiClient.post<ReportItem>('/reports', payload);
    return data;
  },
  getMyReports: async () => {
    const { data } = await apiClient.get<ReportItem[]>('/reports/me');
    return data;
  },
  getAdminReports: async (status?: string) => {
    const { data } = await apiClient.get<ReportItem[]>('/reports/admin', {
      params: status ? { status } : undefined,
    });
    return data;
  },
  updateReport: async (id: string, payload: Partial<ReportItem>) => {
    const { data } = await apiClient.put<ReportItem>(`/reports/admin/${id}`, payload);
    return data;
  },
};

export const analyticsApi = {
  getMyAnalytics: async () => {
    const { data } = await apiClient.get<MyAnalyticsResponse>('/analytics/me');
    return data;
  },
  getAdminReport: async (period: 'weekly' | 'monthly' = 'weekly') => {
    const { data } = await apiClient.get('/analytics/admin/report', { params: { period } });
    return data;
  },
};

export const adminApi = {
  getStats: async () => {
    const { data } = await apiClient.get('/admin/stats');
    return data;
  },
  getUsers: async (page = 1, limit = 20, search = '') => {
    const { data } = await apiClient.get<{ users: User[]; total: number }>('/admin/users', {
      params: { page, limit, search: search || undefined },
    });
    return data;
  },
  updateUser: async (id: string, payload: Partial<User>) => {
    const { data } = await apiClient.put<User>(`/admin/users/${id}`, payload);
    return data;
  },
  deleteUser: async (id: string) => {
    const { data } = await apiClient.delete<{ message: string }>(`/admin/users/${id}`);
    return data;
  },
  getBooks: async () => {
    const { data } = await apiClient.get('/admin/books');
    return data;
  },
  getRequests: async () => {
    const { data } = await apiClient.get<RequestItem[]>('/admin/requests');
    return data;
  },
};
