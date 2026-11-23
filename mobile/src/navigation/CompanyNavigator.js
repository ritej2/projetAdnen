import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS } from '../utils/constants';

import CompanyDashboardScreen from '../screens/company/CompanyDashboardScreen';
import CompanyJobsScreen from '../screens/company/CompanyJobsScreen';
import CreateJobScreen from '../screens/company/CreateJobScreen';
import CompanyApplicationsScreen from '../screens/company/CompanyApplicationsScreen';
import ScheduleInterviewScreen from '../screens/company/ScheduleInterviewScreen';
import CompanyProfileScreen from '../screens/company/CompanyProfileScreen';
import InterviewsScreen from '../screens/candidate/InterviewsScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const CompanyTabs = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: COLORS.surface },
        headerTitleStyle: { fontWeight: '700', color: COLORS.secondary },
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textMuted,
        tabBarStyle: {
          backgroundColor: COLORS.surface,
          borderTopColor: COLORS.border,
          height: 60,
          paddingBottom: 8,
          paddingTop: 6,
        },
      }}
    >
      <Tab.Screen
        name="CompanyDashboardTab"
        component={CompanyDashboardScreen}
        options={{
          title: 'Tableau de bord',
          tabBarLabel: 'Accueil',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="view-dashboard-outline" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="CompanyJobsTab"
        component={CompanyJobsScreen}
        options={{
          title: 'Mes Offres Publiées',
          tabBarLabel: 'Offres',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="briefcase-outline" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="CompanyApplicationsTab"
        component={CompanyApplicationsScreen}
        options={{
          title: 'Candidatures Reçues',
          tabBarLabel: 'Candidats',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="account-multiple-outline" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="CompanyInterviewsTab"
        component={InterviewsScreen}
        options={{
          title: 'Entretiens Planifiés',
          tabBarLabel: 'Entretiens',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="calendar-clock" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="CompanyProfileTab"
        component={CompanyProfileScreen}
        options={{
          title: 'Fiche Entreprise',
          tabBarLabel: 'Entreprise',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="domain" color={color} size={size} />
          ),
        }}
      />
    </Tab.Navigator>
  );
};

export const CompanyNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: COLORS.surface },
        headerTitleStyle: { fontWeight: '700', color: COLORS.secondary },
        headerTintColor: COLORS.primary,
      }}
    >
      <Stack.Screen
        name="CompanyMain"
        component={CompanyTabs}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="CreateJob"
        component={CreateJobScreen}
        options={{ title: 'Nouvelle Offre' }}
      />
      <Stack.Screen
        name="ScheduleInterview"
        component={ScheduleInterviewScreen}
        options={{ title: 'Planifier un entretien' }}
      />
    </Stack.Navigator>
  );
};

export default CompanyNavigator;
