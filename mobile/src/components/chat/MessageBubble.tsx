import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { formatDateTime } from '../../utils/format';

interface MessageBubbleProps {
  message: string;
  createdAt: string;
  mine: boolean;
}

export const MessageBubble = ({ message, createdAt, mine }: MessageBubbleProps) => (
  <View style={[styles.container, mine ? styles.mine : styles.theirs]}>
    <Text style={[styles.text, mine ? styles.mineText : styles.theirsText]}>{message}</Text>
    <Text style={[styles.time, mine ? styles.mineTime : styles.theirsTime]}>
      {formatDateTime(createdAt)}
    </Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    maxWidth: '80%',
    borderRadius: 14,
    marginBottom: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  mine: {
    alignSelf: 'flex-end',
    backgroundColor: '#2463eb',
    borderBottomRightRadius: 4,
  },
  theirs: {
    alignSelf: 'flex-start',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderBottomLeftRadius: 4,
  },
  text: {
    fontSize: 14,
    lineHeight: 20,
  },
  mineText: {
    color: '#ffffff',
  },
  theirsText: {
    color: '#111827',
  },
  time: {
    fontSize: 10,
    marginTop: 4,
  },
  mineTime: {
    color: '#d1fae5',
    textAlign: 'right',
  },
  theirsTime: {
    color: '#6b7280',
  },
});
