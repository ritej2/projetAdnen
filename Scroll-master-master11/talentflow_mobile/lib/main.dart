import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'core/app_theme.dart';
import 'core/language_provider.dart';
import 'providers/auth_provider.dart';
import 'providers/jobs_provider.dart';
import 'screens/home_screen.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  runApp(
    MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => LanguageProvider()),
        ChangeNotifierProvider(create: (_) => AuthProvider()),
        ChangeNotifierProvider(create: (_) => JobsProvider()),
      ],
      child: const TalentFlowApp(),
    ),
  );
}

class TalentFlowApp extends StatelessWidget {
  const TalentFlowApp({super.key});

  @override
  Widget build(BuildContext context) {
    final langProvider = Provider.of<LanguageProvider>(context);

    return MaterialApp(
      title: 'Superio',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.lightTheme,
      darkTheme: AppTheme.darkTheme,
      themeMode: ThemeMode.light,
      home: Directionality(
        textDirection: langProvider.textDirection,
        child: const HomeScreen(),
      ),
    );
  }
}
