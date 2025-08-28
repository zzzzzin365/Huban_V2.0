import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'config/api_config.dart';
import 'core/services/network_service.dart';
import 'modules/geohash_match/providers/volunteer_provider.dart';
import 'modules/geohash_match/screens/volunteer_matching_screen.dart';

void main() {
  
  
  runApp(const VolunteerMatchingApp());
}

class VolunteerMatchingApp extends StatelessWidget {
  const VolunteerMatchingApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => VolunteerProvider()),
      ],
      child: MaterialApp(
        title: ApiConfig.appName,
        theme: ThemeData(
          primarySwatch: Colors.blue,
          useMaterial3: true,
        ),
        home: const VolunteerMatchingScreen(),
        debugShowCheckedModeBanner: ApiConfig.enableDebugLogs,
      ),
    );
  }
}
