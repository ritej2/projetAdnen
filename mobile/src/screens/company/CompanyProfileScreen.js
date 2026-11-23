import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS } from '../../utils/constants';
import { useAuth } from '../../context/AuthContext';
import CustomInput from '../../components/CustomInput';
import CustomButton from '../../components/CustomButton';

export const CompanyProfileScreen = () => {
  const { user, entreprise, refreshProfile, logout } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [nomEntreprise, setNomEntreprise] = useState(entreprise?.nomEntreprise || '');
  const [nomContact, setNomContact] = useState(user?.nom || '');
  const [telephone, setTelephone] = useState(user?.telephone || '');
  const [secteur, setSecteur] = useState(entreprise?.secteur || '');
  const [adresse, setAdresse] = useState(entreprise?.adresse || '');
  const [siteWeb, setSiteWeb] = useState(entreprise?.siteWeb || '');
  const [description, setDescription] = useState(entreprise?.description || '');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      const authService = (await import('../../services/authService')).default;
      await authService.updateProfile({
        nom: nomContact,
        nomEntreprise,
        telephone,
        secteur,
        adresse,
        siteWeb,
        description,
      });
      await refreshProfile();
      setIsEditing(false);
      Alert.alert('Succès', 'Profil entreprise mis à jour.');
    } catch {
      Alert.alert('Erreur', 'Impossible de modifier le profil.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.headerCard}>
        <View style={styles.logoBadge}>
          <Text style={styles.logoText}>
            {(nomEntreprise || 'E').substring(0, 2).toUpperCase()}
          </Text>
        </View>
        <Text style={styles.companyName}>{nomEntreprise || 'Mon Entreprise'}</Text>
        <Text style={styles.sector}>{secteur || 'Technologie & Recrutement'}</Text>
        <Text style={styles.email}>{user?.email}</Text>
      </View>

      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>Détails Entreprise</Text>
          <TouchableOpacity onPress={() => setIsEditing(!isEditing)}>
            <Text style={styles.editBtnText}>{isEditing ? 'Annuler' : 'Modifier'}</Text>
          </TouchableOpacity>
        </View>

        {isEditing ? (
          <>
            <CustomInput label="Nom de l'entreprise" value={nomEntreprise} onChangeText={setNomEntreprise} />
            <CustomInput label="Contact recruteur" value={nomContact} onChangeText={setNomContact} />
            <CustomInput label="Téléphone" value={telephone} onChangeText={setTelephone} keyboardType="phone-pad" />
            <CustomInput label="Secteur d'activité" value={secteur} onChangeText={setSecteur} />
            <CustomInput label="Site web" value={siteWeb} onChangeText={setSiteWeb} />
            <CustomInput label="Adresse du siège" value={adresse} onChangeText={setAdresse} />
            <CustomInput label="Description" value={description} onChangeText={setDescription} multiline numberOfLines={3} />

            <CustomButton
              title="Enregistrer"
              onPress={handleSave}
              loading={saving}
              style={{ marginTop: 8 }}
            />
          </>
        ) : (
          <View style={styles.infoList}>
            <View style={styles.infoItem}>
              <MaterialCommunityIcons name="account-tie" size={18} color={COLORS.textMuted} />
              <Text style={styles.infoValue}>Contact : {nomContact || user?.nom}</Text>
            </View>

            <View style={styles.infoItem}>
              <MaterialCommunityIcons name="phone" size={18} color={COLORS.textMuted} />
              <Text style={styles.infoValue}>{telephone || 'Non renseigné'}</Text>
            </View>

            <View style={styles.infoItem}>
              <MaterialCommunityIcons name="web" size={18} color={COLORS.textMuted} />
              <Text style={styles.infoValue}>{siteWeb || 'https://monentreprise.com'}</Text>
            </View>

            <View style={styles.infoItem}>
              <MaterialCommunityIcons name="map-marker" size={18} color={COLORS.textMuted} />
              <Text style={styles.infoValue}>{adresse || 'Paris, France'}</Text>
            </View>

            {description ? (
              <View style={[styles.infoItem, { alignItems: 'flex-start' }]}>
                <MaterialCommunityIcons name="text-box-outline" size={18} color={COLORS.textMuted} style={{ marginTop: 2 }} />
                <Text style={styles.descText}>{description}</Text>
              </View>
            ) : null}
          </View>
        )}
      </View>

      <CustomButton
        title="Se déconnecter"
        variant="outline"
        onPress={logout}
        style={styles.logoutBtn}
        textStyle={{ color: COLORS.danger }}
        icon={<MaterialCommunityIcons name="logout" size={18} color={COLORS.danger} />}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  headerCard: {
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    padding: 24,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 16,
  },
  logoBadge: {
    width: 72,
    height: 72,
    borderRadius: 18,
    backgroundColor: '#ede9fe',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  logoText: {
    fontSize: 24,
    fontWeight: '800',
    color: '#7c3aed',
  },
  companyName: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.secondary,
  },
  sector: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '600',
    marginTop: 2,
  },
  email: {
    fontSize: 13,
    color: COLORS.textMuted,
    marginTop: 4,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.secondary,
  },
  editBtnText: {
    color: COLORS.primary,
    fontWeight: '600',
    fontSize: 14,
  },
  infoList: {
    gap: 14,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoValue: {
    fontSize: 14,
    color: COLORS.text,
    marginLeft: 10,
    fontWeight: '500',
    flex: 1,
  },
  descText: {
    fontSize: 14,
    color: '#475569',
    marginLeft: 10,
    lineHeight: 20,
    flex: 1,
  },
  logoutBtn: {
    borderColor: '#fecaca',
    backgroundColor: '#fff5f5',
    marginTop: 10,
  },
});

export default CompanyProfileScreen;
