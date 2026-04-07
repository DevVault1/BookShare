import React, { useEffect, useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, View } from 'react-native';
import { AppScreen } from '../../components/ui/AppScreen';
import { PrimaryButton } from '../../components/ui/PrimaryButton';
import { TagChip } from '../../components/ui/TagChip';
import { REPORT_CATEGORIES, REPORT_PRIORITIES } from '../../utils/constants';
import { reportsApi } from '../../api/services';
import type { ReportItem } from '../../types/domain';
import { extractApiError } from '../../api/client';
import { formatDateTime } from '../../utils/format';

const TARGET_TYPES = ['book', 'user', 'message', 'platform', 'other'] as const;

type TargetType = (typeof TARGET_TYPES)[number];

type ReportCategory = (typeof REPORT_CATEGORIES)[number];

type ReportPriority = (typeof REPORT_PRIORITIES)[number];

export const ReportsCenterScreen = () => {
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [targetType, setTargetType] = useState<TargetType>('platform');
  const [targetId, setTargetId] = useState('');
  const [category, setCategory] = useState<ReportCategory>('other');
  const [priority, setPriority] = useState<ReportPriority>('medium');
  const [description, setDescription] = useState('');
  const [busy, setBusy] = useState(false);

  const loadReports = async () => {
    try {
      const data = await reportsApi.getMyReports();
      setReports(data);
    } catch {
      setReports([]);
    }
  };

  useEffect(() => {
    loadReports();
  }, []);

  const submitReport = async () => {
    if (!description.trim()) {
      Alert.alert('Required', 'Please add a description.');
      return;
    }

    setBusy(true);
    try {
      await reportsApi.createReport({
        targetType,
        targetId: targetId.trim() || undefined,
        category,
        description: description.trim(),
        priority,
      });
      setTargetId('');
      setDescription('');
      await loadReports();
      Alert.alert('Submitted', 'Safety report sent to admins.');
    } catch (submitError: unknown) {
      Alert.alert('Failed', extractApiError(submitError, 'Could not submit report'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <AppScreen
      title="Safety Reports"
      subtitle="Report suspicious users, books, or messages and track your submitted reports."
    >
      <View style={styles.card}>
        <Text style={styles.label}>Target type</Text>
        <View style={styles.wrap}>
          {TARGET_TYPES.map((item) => (
            <TagChip
              key={item}
              label={item}
              selected={targetType === item}
              onPress={() => setTargetType(item)}
            />
          ))}
        </View>

        <Text style={styles.label}>Target ID (optional)</Text>
        <TextInput
          value={targetId}
          onChangeText={setTargetId}
          placeholder="Object ID if available"
          placeholderTextColor="#5e6778"
          style={styles.input}
        />

        <Text style={styles.label}>Category</Text>
        <View style={styles.wrap}>
          {REPORT_CATEGORIES.map((item) => (
            <TagChip
              key={item}
              label={item}
              selected={category === item}
              onPress={() => setCategory(item)}
            />
          ))}
        </View>

        <Text style={styles.label}>Priority</Text>
        <View style={styles.wrap}>
          {REPORT_PRIORITIES.map((item) => (
            <TagChip
              key={item}
              label={item}
              selected={priority === item}
              onPress={() => setPriority(item)}
            />
          ))}
        </View>

        <Text style={styles.label}>Description</Text>
        <TextInput
          value={description}
          onChangeText={setDescription}
          placeholder="Describe the issue"
          placeholderTextColor="#5e6778"
          style={styles.textArea}
          multiline
        />

        <PrimaryButton label="Submit Report" onPress={submitReport} loading={busy} />
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>My Reports ({reports.length})</Text>
        {reports.length === 0 ? (
          <Text style={styles.muted}>No reports submitted yet.</Text>
        ) : (
          reports.map((item) => (
            <View key={item._id} style={styles.item}>
              <Text style={styles.itemTitle}>{item.category} - {item.status}</Text>
              <Text style={styles.itemText}>Target: {item.targetType}</Text>
              <Text style={styles.itemText}>Priority: {item.priority}</Text>
              <Text style={styles.itemText}>{item.description}</Text>
              <Text style={styles.itemDate}>{formatDateTime(item.createdAt)}</Text>
            </View>
          ))
        )}
      </View>
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
  sectionTitle: {
    color: '#111827',
    fontWeight: '700',
    fontSize: 16,
    marginBottom: 8,
  },
  label: {
    color: '#374151',
    fontWeight: '700',
    marginBottom: 6,
  },
  input: {
    minHeight: 44,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    paddingHorizontal: 12,
    backgroundColor: '#ffffff',
    color: '#111827',
    marginBottom: 8,
  },
  textArea: {
    minHeight: 90,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#ffffff',
    color: '#111827',
    textAlignVertical: 'top',
    marginBottom: 8,
  },
  wrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8,
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
    marginBottom: 2,
  },
  itemText: {
    color: '#374151',
    marginBottom: 2,
  },
  itemDate: {
    color: '#6b7280',
    fontSize: 11,
    marginTop: 3,
  },
  muted: {
    color: '#6b7280',
  },
});
