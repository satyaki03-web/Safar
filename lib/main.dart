import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'core/theme/app_theme.dart';
import 'core/router/app_router.dart';
import 'core/providers/app_providers.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  runApp(const ProviderScope(child: SafarApp()));
}

class SafarApp extends ConsumerWidget {
  const SafarApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final userAsync = ref.watch(authStateProvider);
    final user = userAsync.valueOrNull;

    final router = createSafarRouter(user: user);

    return MaterialApp.router(
      title: 'Safar | Hire a driver by the hour',
      debugShowCheckedModeBanner: false,
      theme: SafarTheme.lightTheme,
      routerConfig: router,
    );
  }
}
