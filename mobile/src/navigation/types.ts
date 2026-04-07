export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
  TwoFactor: {
    pendingToken: string;
    method: 'email' | 'sms';
    destinationHint?: string;
  };
};

export type AppTabsParamList = {
  Books: undefined;
  Dashboard: undefined;
  Donate: undefined;
  Chat: undefined;
  Profile: undefined;
};

export type RootStackParamList = {
  AppTabs: undefined;
  BookDetail: { bookId: string };
  ChatRoom: { conversationId: string; title?: string };
  AdminPanel: undefined;
  ReportsCenter: undefined;
};
