import React from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { COLORS } from '../utils/constants';

import AuthNavigator from './AuthNavigator';
import CandidateNavigator from './CandidateNavigator';
import CompanyNavigator from './CompanyNavigator';

export const RootNavigator = () => {
  const { user, isCandidate, isCompany, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      {!user ? (
        <AuthNavigator />
      ) : isCandidate ? (
        <CandidateNavigator />
      ) : isCompany ? (
        <CompanyNavigator />
      ) : (
        <CandidateNavigator />
      )}
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.background,
  },
});

export default RootNavigator;
