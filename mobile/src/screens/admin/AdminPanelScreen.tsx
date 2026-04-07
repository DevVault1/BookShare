import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { AppScreen } from '../../components/ui/AppScreen';
import { PrimaryButton } from '../../components/ui/PrimaryButton';
import { adminApi, analyticsApi, reportsApi } from '../../api/services';
import { useAuthStore } from '../../store/authStore';
import { extractApiError } from '../../api/client';
import type { ReportItem, RequestItem, User } from '../../types/domain';

interface AdminStats {
  users: number;
  books: number;
  requests: number;
  donations: number;
  booksByStatus: Array<{ _id: string; count: number }>;
  booksByCategory: Array<{ _id: string; count: number }>;
}

export const AdminPanelScreen = () => {
  const { user } = useAuthStore();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [requests, setRequests] = useState<RequestItem[]>([]);
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [growthReport, setGrowthReport] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const loadAdminData = async () => {
    setLoading(true);
    try {
      const [statsData, usersData, requestsData, reportsData, growth] = await Promise.all([
        adminApi.getStats(),
        adminApi.getUsers(1, 50),
        adminApi.getRequests(),
        reportsApi.getAdminReports(),
        analyticsApi.getAdminReport('weekly'),
      ]);
      setStats(statsData);
      setUsers(usersData.users || []);
      setRequests(requestsData || []);
      setReports(reportsData || []);
      setGrowthReport(growth);
    } catch (loadError: unknown) {
      Alert.alert('Admin', extractApiError(loadError, 'Failed to load admin data'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role === 'admin') {
      loadAdminData();
    }
  }, [user?.role]);

  const changeRole = async (id: string, role: 'admin' | 'donor' | 'student') => {
    try {
      await adminApi.updateUser(id, { role });
      loadAdminData();
    } catch (error: unknown) {
      Alert.alert('Role update failed', extractApiError(error, 'Could not update user role'));
    }
  };

  const deleteUser = async (id: string) => {
    try {
      await adminApi.deleteUser(id);
      loadAdminData();
    } catch (error: unknown) {
      Alert.alert('Delete failed', extractApiError(error, 'Could not delete user'));
    }
  };

  const updateReportStatus = async (id: string, status: 'under_review' | 'resolved' | 'dismissed') => {
    try {
      await reportsApi.updateReport(id, { status });
      loadAdminData();
    } catch (error: unknown) {
      Alert.alert('Failed', extractApiError(error, 'Could not update report status'));
    }
  };

  if (user?.role !== 'admin') {
    return (
      <AppScreen title="Admin Panel" subtitle="Restricted">
        <Text style={styles.error}>Admin role required.</Text>
      </AppScreen>
    );
  }

  return (
    <AppScreen
      title="Admin Panel"
      subtitle="Platform analytics, user moderation, request monitoring, and safety workflow management."
      scroll={false}
    >
      <ScrollView showsVerticalScrollIndicator={false}>
        {loading ? <Text style={styles.muted}>Loading admin data...</Text> : null}

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Platform Stats</Text>
          <Text style={styles.metric}>Users: {stats?.users || 0}</Text>
          <Text style={styles.metric}>Books: {stats?.books || 0}</Text>
          <Text style={styles.metric}>Requests: {stats?.requests || 0}</Text>
          <Text style={styles.metric}>Donations: {stats?.donations || 0}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Growth Report (Weekly)</Text>
          <Text style={styles.metric}>New Users: {growthReport?.metrics?.newUsers?.current || 0}</Text>
          <Text style={styles.metric}>New Books: {growthReport?.metrics?.newBooks?.current || 0}</Text>
          <Text style={styles.metric}>New Requests: {growthReport?.metrics?.newRequests?.current || 0}</Text>
          <Text style={styles.metric}>Completed Donations: {growthReport?.metrics?.completedDonations?.current || 0}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Users ({users.length})</Text>
          {users.map((u) => (
            <View key={u._id} style={styles.item}>
              <Text style={styles.itemTitle}>{u.name} ({u.role})</Text>
              <Text style={styles.itemText}>{u.email}</Text>
              <View style={styles.row}>
                <PrimaryButton label="Make Admin" variant="ghost" onPress={() => changeRole(u._id, 'admin')} style={styles.inlineButton} />
                <PrimaryButton label="Make Donor" variant="ghost" onPress={() => changeRole(u._id, 'donor')} style={styles.inlineButton} />
                <PrimaryButton label="Delete" variant="danger" onPress={() => deleteUser(u._id)} style={styles.inlineButton} />
              </View>
            </View>
          ))}
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Requests ({requests.length})</Text>
          {requests.map((item) => (
            <View key={item._id} style={styles.item}>
              <Text style={styles.itemTitle}>{item.bookId?.title}</Text>
              <Text style={styles.itemText}>Requester: {item.requesterId?.name}</Text>
              <Text style={styles.itemText}>Donor: {item.donorId?.name}</Text>
              <Text style={styles.itemText}>Status: {item.status}</Text>
            </View>
          ))}
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Safety Reports ({reports.length})</Text>
          {reports.map((report) => (
            <View key={report._id} style={styles.item}>
              <Text style={styles.itemTitle}>{report.category} - {report.status}</Text>
              <Text style={styles.itemText}>Priority: {report.priority}</Text>
              <Text style={styles.itemText}>{report.description}</Text>
              <View style={styles.row}>
                <PrimaryButton label="Review" variant="ghost" onPress={() => updateReportStatus(report._id, 'under_review')} style={styles.inlineButton} />
                <PrimaryButton label="Resolve" variant="secondary" onPress={() => updateReportStatus(report._id, 'resolved')} style={styles.inlineButton} />
                <PrimaryButton label="Dismiss" variant="danger" onPress={() => updateReportStatus(report._id, 'dismissed')} style={styles.inlineButton} />
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </AppScreen>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
  },
  cardTitle: {
    color: '#111827',
    fontWeight: '700',
    fontSize: 16,
    marginBottom: 8,
  },
  metric: {
    color: '#374151',
    marginBottom: 3,
    fontSize: 13,
  },
  item: {
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
    paddingTop: 10,
    marginTop: 10,
  },
  itemTitle: {
    color: '#111827',
    fontWeight: '700',
    fontSize: 14,
    marginBottom: 2,
  },
  itemText: {
    color: '#374151',
    marginBottom: 2,
    fontSize: 13,
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 6,
  },
  inlineButton: {
    flexGrow: 1,
    minWidth: 104,
  },
  muted: {
    color: '#6b7280',
    marginBottom: 10,
  },
  error: {
    color: '#dc2828',
  },
});
