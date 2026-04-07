import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

interface StarsProps {
  value: number;
  max?: number;
  size?: number;
  editable?: boolean;
  onChange?: (value: number) => void;
  showNumeric?: boolean;
}

export const Stars = ({
  value,
  max = 5,
  size = 18,
  editable = false,
  onChange,
  showNumeric = false,
}: StarsProps) => {
  const activeCount = Math.round(value || 0);

  return (
    <View style={styles.row}>
      {Array.from({ length: max }).map((_, index) => {
        const starValue = index + 1;
        const active = starValue <= activeCount;

        const star = (
          <Text style={[styles.star, { fontSize: size }, active ? styles.active : styles.inactive]}>
            {'★'}
          </Text>
        );

        if (!editable) {
          return <View key={starValue}>{star}</View>;
        }

        return (
          <Pressable key={starValue} onPress={() => onChange?.(starValue)}>
            {star}
          </Pressable>
        );
      })}
      {showNumeric ? <Text style={styles.valueText}>{value.toFixed(1)}</Text> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  star: {
    marginRight: 2,
  },
  active: {
    color: '#f59e0b',
  },
  inactive: {
    color: '#d1d5db',
  },
  valueText: {
    marginLeft: 6,
    color: '#374151',
    fontWeight: '700',
    fontSize: 13,
  },
});
