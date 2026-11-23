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
import { COLORS, CONTRACT_TYPES } from '../../utils/constants';
import CustomInput from '../../components/CustomInput';
import CustomButton from '../../components/CustomButton';
import jobService from '../../services/jobService';

export const CreateJobScreen = ({ navigation }) => {
  const [titre, setTitre] = useState('');
  const [typeContrat, setTypeContrat] = useState('CDI');
  const [localisation, setLocalisation] = useState('Paris, France');
  const [modeTravail, setModeTravail] = useState('Hybride');
  const [salaireMin, setSalaireMin] = useState('');
  const [salaireMax, setSalaireMax] = useState('');
  const [competences, setCompetences] = useState('React Native, Spring Boot, MySQL');
  const [description, setDescription] = useState('');
  const [missions, setMissions] = useState('');
  const [profilRecherche, setProfilRecherche] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!titre.trim() || !description.trim()) {
      Alert.alert('Champs obligatoires', 'Veuillez saisir au minimum le titre et la description du poste.');
      return;
    }

    setSubmitting(true);
    try {
      await jobService.createJob({
        titre: titre.trim(),
        typeContrat,
        localisation: localisation.trim(),
        modeTravail,
        salaire: salaireMin ? Number(salaireMin) : undefined,
        salaireMax: salaireMax ? Number(salaireMax) : undefined,
        competencesRequises: competences.trim(),
        description: description.trim(),
        missions: missions.trim() || undefined,
        profilRecherche: profilRecherche.trim() || undefined,
        statut: 'ACTIVE',
      });

      Alert.alert('Offre créée !', 'Votre offre a été publiée avec succès.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (err) {
      Alert.alert('Erreur', err?.friendlyMessage || 'Impossible de créer l’offre.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.pageTitle}>Publier une offre d'emploi</Text>

        <CustomInput
          label="Titre du poste *"
          value={titre}
          onChangeText={setTitre}
          placeholder="ex: Développeur Mobile Senior React Native"
        />

        {/* Choix du contrat */}
        <Text style={styles.fieldLabel}>Type de contrat *</Text>
        <View style={styles.contractRow}>
          {CONTRACT_TYPES.map((c) => (
            <TouchableOpacity
              key={c}
              style={[styles.contractChip, typeContrat === c && styles.activeContractChip]}
              onPress={() => setTypeContrat(c)}
            >
              <Text style={[styles.contractChipText, typeContrat === c && styles.activeContractChipText]}>
                {c}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <CustomInput
          label="Localisation *"
          value={localisation}
          onChangeText={setLocalisation}
          placeholder="ex: Paris, France ou Télétravail"
        />

        <CustomInput
          label="Mode de travail"
          value={modeTravail}
          onChangeText={setModeTravail}
          placeholder="ex: Télétravail, Hybride, Sur site"
        />

        <View style={styles.row}>
          <View style={{ flex: 1, marginRight: 8 }}>
            <CustomInput
              label="Salaire Min (€ / an)"
              value={salaireMin}
              onChangeText={setSalaireMin}
              placeholder="ex: 45000"
              keyboardType="numeric"
            />
          </View>
          <View style={{ flex: 1, marginLeft: 8 }}>
            <CustomInput
              label="Salaire Max (€ / an)"
              value={salaireMax}
              onChangeText={setSalaireMax}
              placeholder="ex: 55000"
              keyboardType="numeric"
            />
          </View>
        </View>

        <CustomInput
          label="Compétences requises (séparées par virgules)"
          value={competences}
          onChangeText={setCompetences}
          placeholder="ex: React Native, TypeScript, Spring Boot"
        />

        <CustomInput
          label="Description générale du poste *"
          value={description}
          onChangeText={setDescription}
          placeholder="Présentation du rôle, contexte du projet, équipe..."
          multiline
          numberOfLines={4}
        />

        <CustomInput
          label="Missions principales"
          value={missions}
          onChangeText={setMissions}
          placeholder="Ce que fera le candidat au quotidien..."
          multiline
          numberOfLines={3}
        />

        <CustomInput
          label="Profil recherché"
          value={profilRecherche}
          onChangeText={setProfilRecherche}
          placeholder="Expérience attendue, qualités recherchées..."
          multiline
          numberOfLines={3}
        />

        <CustomButton
          title="Publier l'offre en ligne"
          onPress={handleSubmit}
          loading={submitting}
          style={styles.submitBtn}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  pageTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.secondary,
    marginBottom: 20,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 8,
  },
  contractRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  contractChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#e2e8f0',
  },
  activeContractChip: {
    backgroundColor: COLORS.primary,
  },
  contractChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textMuted,
  },
  activeContractChipText: {
    color: '#ffffff',
  },
  row: {
    flexDirection: 'row',
  },
  submitBtn: {
    marginTop: 10,
  },
});

export default CreateJobScreen;
