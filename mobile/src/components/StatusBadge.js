import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { APPLICATION_STATUS_CONFIG } from '../utils/constants';

export const StatusBadge = ({ status, style }) => {
  const config = APPLICATION_STATUS_CONFIG[status] || {
    label: status || 'Inconnu',
    color: '#64748b',
    bgColor: '#f1f5f9',
  };

  return (
    <View style={[styles.badge, { backgroundColor: config.bgColor }, style]}>
      <Text style={[styles.text, { color: config.color }]}>{config.label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: 12,
    fontWeight: '600',
  },
});

export default StatusBadge;
