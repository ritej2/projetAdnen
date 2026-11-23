export const formatDate = (dateStr) => {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
};

export const formatDateTime = (dateStr) => {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return dateStr;
  }
};

export const formatSalary = (min, max) => {
  if (!min && !max) return 'Salaire non spécifié';
  if (min && max) return `${min.toLocaleString('fr-FR')} - ${max.toLocaleString('fr-FR')} € / an`;
  if (min) return `À partir de ${min.toLocaleString('fr-FR')} € / an`;
  return `Jusqu'à ${max.toLocaleString('fr-FR')} € / an`;
};
