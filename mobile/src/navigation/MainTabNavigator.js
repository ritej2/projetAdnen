import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS } from '../utils/constants';
import { useAuth } from '../context/AuthContext';

import HomeScreen from '../screens/HomeScreen';
import JobListScreen from '../screens/candidate/JobListScreen';
import CompaniesScreen from '../screens/CompaniesScreen';
import AccountScreen from '../screens/AccountScreen';
import AppLogo from '../components/AppLogo';

const Tab = createBottomTabNavigator();

export const MainTabNavigator = () => {
  const { user, isCandidate, isCompany } = useAuth();

  return (
    <Tab.Navigator
      initialRouteName="HomeTab"
      screenOptions={{
        headerStyle: {
          backgroundColor: COLORS.surface,
          elevation: 1,
          shadowOpacity: 0.05,
          borderBottomWidth: 1,
          borderBottomColor: COLORS.border,
        },
        headerTitleStyle: {
          fontWeight: '700',
          color: COLORS.secondary,
          fontSize: 18,
        },
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textMuted,
        tabBarStyle: {
          backgroundColor: COLORS.surface,
          borderTopColor: COLORS.border,
          borderTopWidth: 1,
          height: 60,
          paddingBottom: 8,
          paddingTop: 6,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
      }}
    >
      <Tab.Screen
        name="HomeTab"
        component={HomeScreen}
        options={{
          headerTitle: () => <AppLogo size="medium" />,
          tabBarLabel: 'Accueil',
          tabBarIcon: ({ color, size, focused }) => (
            <MaterialCommunityIcons
              name={focused ? 'home-variant' : 'home-variant-outline'}
              color={color}
              size={size}
            />
          ),
        }}
      />

      <Tab.Screen
        name="JobsTab"
        component={JobListScreen}
        options={{
          title: 'Offres d’Emploi',
          tabBarLabel: 'Offres',
          tabBarIcon: ({ color, size, focused }) => (
            <MaterialCommunityIcons
              name={focused ? 'briefcase-search' : 'briefcase-search-outline'}
              color={color}
              size={size}
            />
          ),
        }}
      />

      <Tab.Screen
        name="CompaniesTab"
        component={CompaniesScreen}
        options={{
          title: 'Entreprises Partenaires',
          tabBarLabel: 'Entreprises',
          tabBarIcon: ({ color, size, focused }) => (
            <MaterialCommunityIcons
              name={focused ? 'domain' : 'domain'}
              color={color}
              size={size}
            />
          ),
        }}
      />

      <Tab.Screen
        name="AccountTab"
        component={AccountScreen}
        options={{
          title: isCompany ? 'Espace Recruteur' : isCandidate ? 'Espace Candidat' : 'Mon Espace',
          tabBarLabel: isCompany ? 'Recruteur' : isCandidate ? 'Candidat' : 'Mon Espace',
          tabBarIcon: ({ color, size, focused }) => (
            <MaterialCommunityIcons
              name={focused ? 'account-circle' : 'account-circle-outline'}
              color={color}
              size={size}
            />
          ),
        }}
      />
    </Tab.Navigator>
  );
};

export default MainTabNavigator;
