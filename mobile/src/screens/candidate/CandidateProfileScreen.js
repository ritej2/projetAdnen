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

export const CandidateProfileScreen = () => {
  const { user, candidat, refreshProfile, logout } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [nom, setNom] = useState(user?.nom || '');
  const [telephone, setTelephone] = useState(user?.telephone || '');
  const [titreProfil, setTitreProfil] = useState(candidat?.titreProfil || '');
  const [adresse, setAdresse] = useState(candidat?.adresse || '');
  const [competences, setCompetences] = useState(candidat?.competences || '');
  const [bio, setBio] = useState(candidat?.bio || '');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      const authService = (await import('../../services/authService')).default;
      await authService.updateProfile({
        nom,
        telephone,
        titreProfil,
        adresse,
        competences,
        bio,
      });
      await refreshProfile();
      setIsEditing(false);
      Alert.alert('Succès', 'Votre profil a bien été mis à jour.');
    } catch (err) {
      Alert.alert('Erreur', 'Impossible de mettre à jour le profil.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Carte identité */}
      <View style={styles.profileHeader}>
        <View style={styles.avatarCircle}>
          <Text style={styles.avatarText}>
            {(nom || 'C').substring(0, 2).toUpperCase()}
          </Text>
        </View>
        <Text style={styles.userName}>{nom}</Text>
        <Text style={styles.userTitle}>{titreProfil || 'Candidat JobFlow'}</Text>
        <Text style={styles.userEmail}>{user?.email}</Text>
      </View>

      {/* Formulaire profil */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>Informations Personnelles</Text>
          <TouchableOpacity onPress={() => setIsEditing(!isEditing)}>
            <Text style={styles.editBtnText}>{isEditing ? 'Annuler' : 'Modifier'}</Text>
          </TouchableOpacity>
        </View>

        {isEditing ? (
          <>
            <CustomInput label="Nom et prénom" value={nom} onChangeText={setNom} />
            <CustomInput label="Téléphone" value={telephone} onChangeText={setTelephone} keyboardType="phone-pad" />
            <CustomInput label="Titre du profil" value={titreProfil} onChangeText={setTitreProfil} />
            <CustomInput label="Localisation" value={adresse} onChangeText={setAdresse} />
            <CustomInput label="Compétences (séparées par virgules)" value={competences} onChangeText={setCompetences} />
            <CustomInput label="Bio" value={bio} onChangeText={setBio} multiline numberOfLines={3} />

            <CustomButton
              title="Enregistrer les modifications"
              onPress={handleSave}
              loading={saving}
              style={{ marginTop: 8 }}
            />
          </>
        ) : (
          <View style={styles.infoList}>
            <View style={styles.infoItem}>
              <MaterialCommunityIcons name="phone" size={18} color={COLORS.textMuted} />
              <Text style={styles.infoValue}>{telephone || 'Non renseigné'}</Text>
            </View>

            <View style={styles.infoItem}>
              <MaterialCommunityIcons name="map-marker" size={18} color={COLORS.textMuted} />
              <Text style={styles.infoValue}>{adresse || 'Non renseigné'}</Text>
            </View>

            <View style={styles.infoItem}>
              <MaterialCommunityIcons name="code-tags" size={18} color={COLORS.textMuted} />
              <Text style={styles.infoValue}>{competences || 'Java, React, MySQL'}</Text>
            </View>

            {bio ? (
              <View style={[styles.infoItem, { alignItems: 'flex-start' }]}>
                <MaterialCommunityIcons name="text-box-outline" size={18} color={COLORS.textMuted} style={{ marginTop: 2 }} />
                <Text style={styles.bioText}>{bio}</Text>
              </View>
            ) : null}
          </View>
        )}
      </View>

      {/* Bouton de déconnexion */}
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
  profileHeader: {
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    padding: 24,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 16,
  },
  avatarCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  avatarText: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.primary,
  },
  userName: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.secondary,
  },
  userTitle: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '600',
    marginTop: 2,
  },
  userEmail: {
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
  bioText: {
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

export default CandidateProfileScreen;
