import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS } from '../../utils/constants';
import { useAuth } from '../../context/AuthContext';
import CustomInput from '../../components/CustomInput';
import CustomButton from '../../components/CustomButton';
import AppLogo from '../../components/AppLogo';

export const RegisterScreen = ({ navigation }) => {
  const { register, isLoading } = useAuth();
  const [role, setRole] = useState('CANDIDAT'); // 'CANDIDAT' | 'ENTREPRISE'
  const [nom, setNom] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [telephone, setTelephone] = useState('');
  const [titreProfil, setTitreProfil] = useState('');
  const [nomEntreprise, setNomEntreprise] = useState('');
  const [secteur, setSecteur] = useState('');

  const handleRegister = async () => {
    if (!nom.trim() || !email.trim() || !password) {
      Alert.alert('Champs obligatoires', 'Veuillez remplir votre nom, email et mot de passe.');
      return;
    }

    if (role === 'ENTREPRISE' && !nomEntreprise.trim()) {
      Alert.alert('Information requise', 'Veuillez indiquer le nom de votre entreprise.');
      return;
    }

    try {
      await register({
        nom,
        email,
        password,
        telephone,
        role,
        nomEntreprise: role === 'ENTREPRISE' ? nomEntreprise : undefined,
        secteur: role === 'ENTREPRISE' ? secteur : undefined,
        titreProfil: role === 'CANDIDAT' ? titreProfil : undefined,
      });
      Alert.alert('Compte créé !', 'Bienvenue sur JobFlow.');
    } catch (err) {
      Alert.alert('Erreur', err?.friendlyMessage || err?.message || 'Impossible de finaliser l’inscription.');
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
        >
          <MaterialCommunityIcons name="arrow-left" size={24} color={COLORS.text} />
          <Text style={styles.backBtnText}>Retour</Text>
        </TouchableOpacity>

        <View style={{ alignItems: 'center', marginBottom: 16 }}>
          <AppLogo size="medium" />
        </View>

        <Text style={styles.pageTitle}>Créer un compte</Text>
        <Text style={styles.subtitle}>Rejoignez la communauté JobFlow</Text>

        {/* Sélection du rôle */}
        <View style={styles.roleSelector}>
          <TouchableOpacity
            style={[
              styles.roleTab,
              role === 'CANDIDAT' && styles.activeRoleTab,
            ]}
            onPress={() => setRole('CANDIDAT')}
          >
            <MaterialCommunityIcons
              name="account-school"
              size={20}
              color={role === 'CANDIDAT' ? COLORS.primary : COLORS.textMuted}
            />
            <Text
              style={[
                styles.roleTabText,
                role === 'CANDIDAT' && styles.activeRoleTabText,
              ]}
            >
              Candidat
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.roleTab,
              role === 'ENTREPRISE' && styles.activeRoleTab,
            ]}
            onPress={() => setRole('ENTREPRISE')}
          >
            <MaterialCommunityIcons
              name="domain"
              size={20}
              color={role === 'ENTREPRISE' ? COLORS.primary : COLORS.textMuted}
            />
            <Text
              style={[
                styles.roleTabText,
                role === 'ENTREPRISE' && styles.activeRoleTabText,
              ]}
            >
              Entreprise
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.card}>
          <CustomInput
            label={role === 'CANDIDAT' ? 'Nom et prénom *' : 'Nom du recruteur/contact *'}
            value={nom}
            onChangeText={setNom}
            placeholder="ex: Jean Dupont"
          />

          <CustomInput
            label="Adresse email *"
            value={email}
            onChangeText={setEmail}
            placeholder="ex: jean.dupont@email.com"
            keyboardType="email-address"
          />

          <CustomInput
            label="Mot de passe *"
            value={password}
            onChangeText={setPassword}
            placeholder="••••••••"
            secureTextEntry
          />

          <CustomInput
            label="Numéro de téléphone"
            value={telephone}
            onChangeText={setTelephone}
            placeholder="+33 6 12 34 56 78"
            keyboardType="phone-pad"
          />

          {role === 'CANDIDAT' ? (
            <CustomInput
              label="Titre du profil recherché"
              value={titreProfil}
              onChangeText={setTitreProfil}
              placeholder="ex: Développeur Full Stack React & Java"
            />
          ) : (
            <>
              <CustomInput
                label="Nom de l'entreprise *"
                value={nomEntreprise}
                onChangeText={setNomEntreprise}
                placeholder="ex: Acme Technologies"
              />
              <CustomInput
                label="Secteur d'activité"
                value={secteur}
                onChangeText={setSecteur}
                placeholder="ex: FinTech, SaaS, IA, Industrie"
              />
            </>
          )}

          <CustomButton
            title="Créer mon compte"
            onPress={handleRegister}
            loading={isLoading}
            style={styles.submitBtn}
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    padding: 24,
    paddingTop: 40,
    paddingBottom: 40,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  backBtnText: {
    fontSize: 15,
    color: COLORS.text,
    marginLeft: 6,
    fontWeight: '500',
  },
  pageTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: COLORS.secondary,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.textMuted,
    marginTop: 4,
    marginBottom: 20,
  },
  roleSelector: {
    flexDirection: 'row',
    backgroundColor: '#e2e8f0',
    borderRadius: 14,
    padding: 4,
    marginBottom: 20,
  },
  roleTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 10,
  },
  activeRoleTab: {
    backgroundColor: COLORS.surface,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  roleTabText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textMuted,
    marginLeft: 8,
  },
  activeRoleTabText: {
    color: COLORS.primary,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  submitBtn: {
    marginTop: 8,
  },
});

export default RegisterScreen;
