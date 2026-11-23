import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS } from '../utils/constants';

export const AppLogo = ({ size = 'medium', showTagline = false }) => {
  const isSmall = size === 'small';
  const isLarge = size === 'large';

  const iconBoxSize = isSmall ? 28 : isLarge ? 48 : 34;
  const iconSize = isSmall ? 16 : isLarge ? 28 : 20;
  const fontSize = isSmall ? 15 : isLarge ? 26 : 19;

  return (
    <View style={styles.container}>
      {/* Icone officielle Superio / JobFlow */}
      <View
        style={[
          styles.iconBox,
          {
            width: iconBoxSize,
            height: iconBoxSize,
            borderRadius: isLarge ? 14 : 10,
          },
        ]}
      >
        <MaterialCommunityIcons name="layers-triple" size={iconSize} color="#FFFFFF" />
      </View>

      <View style={styles.textCol}>
        <View style={styles.titleRow}>
          <Text style={[styles.jobText, { fontSize }]}>Job</Text>
          <Text style={[styles.flowText, { fontSize }]}>Flow</Text>
          <View style={styles.badge3D}>
            <Text style={styles.badge3DText}>3D</Text>
          </View>
        </View>

        {showTagline && (
          <Text style={styles.tagline}>Plateforme Recrutement & Carrières</Text>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconBox: {
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  textCol: {
    justifyContent: 'center',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  jobText: {
    fontWeight: '800',
    color: COLORS.secondary,
    letterSpacing: -0.5,
  },
  flowText: {
    fontWeight: '800',
    color: COLORS.primary,
    letterSpacing: -0.5,
  },
  badge3D: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
    marginLeft: 5,
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  badge3DText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#4F46E5',
  },
  tagline: {
    fontSize: 10,
    color: COLORS.textMuted,
    fontWeight: '500',
    marginTop: -2,
  },
});

export default AppLogo;
