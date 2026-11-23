import 'package:flutter/material.dart';
import '../core/app_theme.dart';

class StatusBadge extends StatelessWidget {
  final String status;

  const StatusBadge({super.key, required this.status});

  @override
  Widget build(BuildContext context) {
    Color bg;
    Color fg;
    String label;

    switch (status.toUpperCase()) {
      case 'ACCEPTEE':
      case 'ACCEPTÉE':
        bg = AppColors.successLight;
        fg = AppColors.success;
        label = 'Acceptée';
        break;
      case 'EN_COURS_EXAMEN':
        bg = AppColors.primaryLight;
        fg = AppColors.primary;
        label = 'En examen';
        break;
      case 'ENTRETIEN':
      case 'PLANIFIE':
        bg = AppColors.indigoLight;
        fg = AppColors.indigo;
        label = 'Entretien';
        break;
      case 'REFUSEE':
      case 'REFUSÉE':
        bg = AppColors.dangerLight;
        fg = AppColors.danger;
        label = 'Non retenue';
        break;
      case 'ACTIVE':
        bg = AppColors.successLight;
        fg = AppColors.success;
        label = 'Active';
        break;
      case 'FERMEE':
        bg = const Color(0xFFF1F5F9);
        fg = AppColors.textSecondary;
        label = 'Clôturée';
        break;
      default:
        bg = AppColors.warningLight;
        fg = AppColors.warning;
        label = 'En attente';
        break;
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: bg,
        borderRadius: BorderRadius.circular(20),
      ),
      child: Text(
        label,
        style: TextStyle(
          fontSize: 11,
          fontWeight: FontWeight.w700,
          color: fg,
        ),
      ),
    );
  }
}
