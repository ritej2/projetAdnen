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
import { setCustomApiHost, api } from '../../services/api';

export const LoginScreen = ({ navigation }) => {
  const { login, loginDemo, isLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showConfig, setShowConfig] = useState(false);
  const [customHost, setCustomHost] = useState(api.defaults.baseURL || '');

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      Alert.alert('Champs requis', 'Veuillez saisir votre adresse email et mot de passe.');
      return;
    }
    try {
      await login(email, password);
    } catch (err) {
      Alert.alert('Erreur de connexion', err?.friendlyMessage || err?.message || 'Identifiants invalides.');
    }
  };

  const handleDemo = async (role) => {
    try {
      await loginDemo(role);
    } catch (err) {
      Alert.alert('Erreur Démo', err?.friendlyMessage || err?.message || 'Impossible de se connecter au compte démo.');
    }
  };

  const handleSaveHost = async () => {
    try {
      await setCustomApiHost(customHost);
      Alert.alert('Succès', `Nouvelle URL backend enregistrée :\n${api.defaults.baseURL}`);
      setShowConfig(false);
    } catch {
      Alert.alert('Erreur', 'Impossible de sauvegarder l’hôte');
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
        <View style={styles.header}>
          <View style={styles.logoBadge}>
            <MaterialCommunityIcons name="briefcase-check" size={38} color="#ffffff" />
          </View>
          <Text style={styles.brandTitle}>JobFlow</Text>
          <Text style={styles.subtitle}>Plateforme de recrutement connectée</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.formTitle}>Connexion</Text>

          <CustomInput
            label="Adresse email"
            value={email}
            onChangeText={setEmail}
            placeholder="ex: candidat@jobflow.io"
            keyboardType="email-address"
            leftIcon={<MaterialCommunityIcons name="email-outline" size={20} color={COLORS.textMuted} />}
          />

          <CustomInput
            label="Mot de passe"
            value={password}
            onChangeText={setPassword}
            placeholder="••••••••"
            secureTextEntry
            leftIcon={<MaterialCommunityIcons name="lock-outline" size={20} color={COLORS.textMuted} />}
          />

          <CustomButton
            title="Se connecter"
            onPress={handleLogin}
            loading={isLoading}
            style={styles.submitBtn}
          />

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>Accès rapide démo</Text>
            <View style={styles.dividerLine} />
          </View>

          <View style={styles.demoButtonsContainer}>
            <TouchableOpacity
              style={styles.demoBtn}
              onPress={() => handleDemo('CANDIDAT')}
              disabled={isLoading}
            >
              <MaterialCommunityIcons name="account-school" size={20} color={COLORS.primary} />
              <Text style={styles.demoBtnText}>Démo Candidat</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.demoBtn, styles.demoBtnCompany]}
              onPress={() => handleDemo('ENTREPRISE')}
              disabled={isLoading}
            >
              <MaterialCommunityIcons name="domain" size={20} color="#7c3aed" />
              <Text style={[styles.demoBtnText, { color: '#7c3aed' }]}>Démo Entreprise</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.footerRow}>
            <Text style={styles.footerText}>Pas encore de compte ? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Register')}>
              <Text style={styles.registerLink}>S'inscrire</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Bouton réglage IP backend */}
        <TouchableOpacity
          style={styles.configToggle}
          onPress={() => setShowConfig(!showConfig)}
        >
          <MaterialCommunityIcons name="cog-outline" size={16} color={COLORS.textMuted} />
          <Text style={styles.configToggleText}>
            Backend : {api.defaults.baseURL}
          </Text>
        </TouchableOpacity>

        {showConfig && (
          <View style={styles.configCard}>
            <Text style={styles.configTitle}>Configuration de l'URL Backend</Text>
            <Text style={styles.configHint}>
              • Émulateur Android : http://10.0.2.2:8081{'\n'}
              • Appareil physique / Expo Go : http://[VOTRE_IP_LOCALE]:8081
            </Text>
            <CustomInput
              value={customHost}
              onChangeText={setCustomHost}
              placeholder="http://192.168.1.XX:8081"
            />
            <CustomButton
              title="Valider l'adresse"
              onPress={handleSaveHost}
              variant="outline"
              style={{ height: 40 }}
            />
          </View>
        )}
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
    paddingTop: 50,
  },
  header: {
    alignItems: 'center',
    marginBottom: 28,
  },
  logoBadge: {
    width: 72,
    height: 72,
    borderRadius: 20,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  brandTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.secondary,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.textMuted,
    marginTop: 4,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
  },
  formTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 18,
  },
  submitBtn: {
    marginTop: 8,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.border,
  },
  dividerText: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginHorizontal: 12,
    fontWeight: '500',
  },
  demoButtonsContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  demoBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primaryLight,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  demoBtnCompany: {
    backgroundColor: '#ede9fe',
    borderColor: '#ddd6fe',
  },
  demoBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.primary,
    marginLeft: 6,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 22,
  },
  footerText: {
    color: COLORS.textMuted,
    fontSize: 14,
  },
  registerLink: {
    color: COLORS.primary,
    fontWeight: '700',
    fontSize: 14,
  },
  configToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
    gap: 6,
  },
  configToggleText: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  configCard: {
    marginTop: 12,
    padding: 16,
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
  },
  configTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 4,
  },
  configHint: {
    fontSize: 11,
    color: COLORS.textMuted,
    lineHeight: 16,
    marginBottom: 12,
  },
});

export default LoginScreen;
