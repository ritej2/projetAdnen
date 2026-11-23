import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS } from '../utils/constants';

import JobListScreen from '../screens/candidate/JobListScreen';
import JobDetailScreen from '../screens/candidate/JobDetailScreen';
import ApplyModalScreen from '../screens/candidate/ApplyModalScreen';
import MyApplicationsScreen from '../screens/candidate/MyApplicationsScreen';
import InterviewsScreen from '../screens/candidate/InterviewsScreen';
import TakeTestScreen from '../screens/candidate/TakeTestScreen';
import CandidateProfileScreen from '../screens/candidate/CandidateProfileScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const CandidateTabs = () => {
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
        name="JobsTab"
        component={JobListScreen}
        options={{
          title: 'Offres d’emploi',
          tabBarLabel: 'Offres',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="briefcase-search-outline" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="ApplicationsTab"
        component={MyApplicationsScreen}
        options={{
          title: 'Mes Candidatures',
          tabBarLabel: 'Candidatures',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="file-document-outline" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="InterviewsTab"
        component={InterviewsScreen}
        options={{
          title: 'Mes Entretiens',
          tabBarLabel: 'Entretiens',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="calendar-clock" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={CandidateProfileScreen}
        options={{
          title: 'Mon Profil',
          tabBarLabel: 'Profil',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="account-circle-outline" color={color} size={size} />
          ),
        }}
      />
    </Tab.Navigator>
  );
};

export const CandidateNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: COLORS.surface },
        headerTitleStyle: { fontWeight: '700', color: COLORS.secondary },
        headerTintColor: COLORS.primary,
      }}
    >
      <Stack.Screen
        name="CandidateMain"
        component={CandidateTabs}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="JobDetail"
        component={JobDetailScreen}
        options={{ title: 'Détail de l’offre' }}
      />
      <Stack.Screen
        name="ApplyModal"
        component={ApplyModalScreen}
        options={{ title: 'Postuler', presentation: 'modal' }}
      />
      <Stack.Screen
        name="TakeTest"
        component={TakeTestScreen}
        options={{ title: 'Test Technique' }}
      />
    </Stack.Navigator>
  );
};

export default CandidateNavigator;
