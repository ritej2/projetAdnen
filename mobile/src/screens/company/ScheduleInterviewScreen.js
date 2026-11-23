import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS } from '../../utils/constants';
import CustomInput from '../../components/CustomInput';
import CustomButton from '../../components/CustomButton';
import interviewService from '../../services/interviewService';

export const ScheduleInterviewScreen = ({ route, navigation }) => {
  const { candidature } = route.params;
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(14, 0, 0, 0);

  const [dateEntretien, setDateEntretien] = useState(tomorrow.toISOString().slice(0, 16));
  const [typeEntretien, setTypeEntretien] = useState('Visioconférence');
  const [lienOuLieu, setLienOuLieu] = useState(
    `https://meet.jobflow.io/interview-${candidature.id}`
  );
  const [commentaire, setCommentaire] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!dateEntretien.trim()) {
      Alert.alert('Erreur', 'Veuillez renseigner la date et heure de l’entretien.');
      return;
    }

    setSubmitting(true);
    try {
      await interviewService.scheduleInterview({
        candidatureId: candidature.id,
        dateEntretien: new Date(dateEntretien).toISOString(),
        typeEntretien,
        lienOuLieu,
        commentaire: commentaire.trim() || undefined,
      });

      Alert.alert(
        'Entretien planifié !',
        `L’entretien avec ${candidature.candidatNom} a bien été programmé.`,
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (err) {
      Alert.alert('Erreur', err?.friendlyMessage || 'Impossible de planifier l’entretien.');
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
        <View style={styles.candidatCard}>
          <Text style={styles.cardHeader}>Candidat sélectionné</Text>
          <Text style={styles.candidatNom}>{candidature.candidatNom}</Text>
          <Text style={styles.offreTitre}>{candidature.offreTitre}</Text>
        </View>

        <CustomInput
          label="Date et Heure (AAAA-MM-JJTHH:MM) *"
          value={dateEntretien}
          onChangeText={setDateEntretien}
          placeholder="2026-11-25T14:30"
          leftIcon={<MaterialCommunityIcons name="calendar-clock" size={20} color={COLORS.textMuted} />}
        />

        <CustomInput
          label="Format de l'entretien"
          value={typeEntretien}
          onChangeText={setTypeEntretien}
          placeholder="Visioconférence, Présentiel, Téléphone"
        />

        <CustomInput
          label="Lien de la réunion ou Adresse physique"
          value={lienOuLieu}
          onChangeText={setLienOuLieu}
          placeholder="https://meet.google.com/..."
          leftIcon={<MaterialCommunityIcons name="link" size={20} color={COLORS.textMuted} />}
        />

        <CustomInput
          label="Consignes ou message pour le candidat"
          value={commentaire}
          onChangeText={setCommentaire}
          placeholder="Merci de vous munir de vos projets récents pour une démonstration de 15 minutes..."
          multiline
          numberOfLines={4}
        />

        <CustomButton
          title="Confirmer la planification"
          onPress={handleSubmit}
          loading={submitting}
          style={styles.btn}
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
  candidatCard: {
    backgroundColor: COLORS.surface,
    padding: 18,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 20,
  },
  cardHeader: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textMuted,
    textTransform: 'uppercase',
  },
  candidatNom: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.secondary,
    marginTop: 4,
  },
  offreTitre: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '600',
    marginTop: 2,
  },
  btn: {
    marginTop: 10,
  },
});

export default ScheduleInterviewScreen;
