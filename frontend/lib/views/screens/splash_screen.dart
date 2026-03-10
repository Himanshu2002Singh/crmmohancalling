import 'package:calling_crm/controllers/providers/calls_provider.dart';
import 'package:calling_crm/controllers/providers/lead_provider.dart';
import 'package:calling_crm/controllers/providers/userprovider.dart';
import 'package:calling_crm/views/screens/dashboard/dashboard_screen.dart';
import 'package:calling_crm/views/screens/login_screen.dart';
import 'package:flutter/material.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:provider/provider.dart';

class SplashScreen extends StatefulWidget {
  const SplashScreen({super.key});

  @override
  State<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends State<SplashScreen> {
  final storage = FlutterSecureStorage();

  void initState() {
    super.initState();
    _checkLogin();
  }

  Future<void> _checkLogin() async {
    final token = await storage.read(key: "auth_token");
    final userId = await storage.read(key: "userId");
    final loginTime = await storage.read(key: "loginTime");
    if (loginTime == null || loginTime.isEmpty) {
      Navigator.pushReplacement(
        context,
        MaterialPageRoute(builder: (context) => LoginScreen()),
      );
    }
    final lgTime = DateTime.parse(loginTime!);
    final now = DateTime.now();
    final diff = now.difference(lgTime).inDays;

    if (token != null &&
        token.isNotEmpty &&
        userId != null &&
        userId.isNotEmpty &&
        diff < 30) {
      // Already logged in

      await Provider.of<UserProvider>(
        context,
        listen: false,
      ).fetchUserData(userId);
      await Provider.of<LeadProvider>(context, listen: false).fetchAllLeads();
      await Provider.of<CallsProvider>(
        context,
        listen: false,
      ).fetchTotalCalls();
      // await Provider.of<CallsProvider>(
      //   context,
      //   listen: false,
      // ).fetchTodayCalls();

      Navigator.pushReplacement(
        context,
        MaterialPageRoute(builder: (context) => DashboardScreen()),
      );
    } else {
      // Not logged in
      Navigator.pushReplacement(
        context,
        MaterialPageRoute(builder: (context) => LoginScreen()),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Image.asset(
              'assets/images/newLogo.png',
              width: MediaQuery.of(context).size.width,
              height: 200,
            ),
            SizedBox(height: 20),
            Text(
              "Powered by Trusting Brains",
              style: TextStyle(
                fontSize: 15,
                fontWeight: FontWeight.w400,
                color: Colors.black54,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
