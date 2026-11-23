import React from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../context/AuthContext';
import { COLORS } from '../utils/constants';

import MainTabNavigator from './MainTabNavigator';
import JobDetailScreen from '../screens/candidate/JobDetailScreen';
import ApplyModalScreen from '../screens/candidate/ApplyModalScreen';
import TakeTestScreen from '../screens/candidate/TakeTestScreen';
import MyApplicationsScreen from '../screens/candidate/MyApplicationsScreen';
import InterviewsScreen from '../screens/candidate/InterviewsScreen';
import CandidateProfileScreen from '../screens/candidate/CandidateProfileScreen';

import CompanyDashboardScreen from '../screens/company/CompanyDashboardScreen';
import CompanyJobsScreen from '../screens/company/CompanyJobsScreen';
import CreateJobScreen from '../screens/company/CreateJobScreen';
import CompanyApplicationsScreen from '../screens/company/CompanyApplicationsScreen';
import ScheduleInterviewScreen from '../screens/company/ScheduleInterviewScreen';
import CompanyProfileScreen from '../screens/company/CompanyProfileScreen';

import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';

const Stack = createNativeStackNavigator();

export const RootNavigator = () => {
  const { isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="MainTabs"
        screenOptions={{
          headerStyle: { backgroundColor: COLORS.surface },
          headerTitleStyle: { fontWeight: '700', color: COLORS.secondary },
          headerTintColor: COLORS.primary,
        }}
      >
        {/* Main Tabs (Public: Accueil, Offres, Entreprises, Mon Espace) */}
        <Stack.Screen
          name="MainTabs"
          component={MainTabNavigator}
          options={{ headerShown: false }}
        />

        {/* Candidat & Public Shared Screens */}
        <Stack.Screen
          name="JobDetail"
          component={JobDetailScreen}
          options={{ title: 'Détail du poste' }}
        />
        <Stack.Screen
          name="ApplyModal"
          component={ApplyModalScreen}
          options={{ title: 'Postuler à l’offre', presentation: 'modal' }}
        />
        <Stack.Screen
          name="TakeTest"
          component={TakeTestScreen}
          options={{ title: 'Évaluation Technique' }}
        />
        <Stack.Screen
          name="MyApplications"
          component={MyApplicationsScreen}
          options={{ title: 'Mes Candidatures' }}
        />
        <Stack.Screen
          name="Interviews"
          component={InterviewsScreen}
          options={{ title: 'Mes Entretiens' }}
        />
        <Stack.Screen
          name="CandidateProfile"
          component={CandidateProfileScreen}
          options={{ title: 'Mon Profil & CV' }}
        />

        {/* Entreprise Screens */}
        <Stack.Screen
          name="CompanyDashboard"
          component={CompanyDashboardScreen}
          options={{ title: 'Tableau de bord Recruteur' }}
        />
        <Stack.Screen
          name="CompanyJobs"
          component={CompanyJobsScreen}
          options={{ title: 'Mes Offres Publiées' }}
        />
        <Stack.Screen
          name="CreateJob"
          component={CreateJobScreen}
          options={{ title: 'Publier une Offre' }}
        />
        <Stack.Screen
          name="CompanyApplications"
          component={CompanyApplicationsScreen}
          options={{ title: 'Candidatures Reçues' }}
        />
        <Stack.Screen
          name="ScheduleInterview"
          component={ScheduleInterviewScreen}
          options={{ title: 'Planifier un Entretien', presentation: 'modal' }}
        />
        <Stack.Screen
          name="CompanyProfile"
          component={CompanyProfileScreen}
          options={{ title: 'Fiche Entreprise' }}
        />

        {/* Auth Screens */}
        <Stack.Screen
          name="Login"
          component={LoginScreen}
          options={{ title: 'Connexion JobFlow' }}
        />
        <Stack.Screen
          name="Register"
          component={RegisterScreen}
          options={{ title: 'Créer un compte' }}
        />
      </Stack.Navigator>
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
