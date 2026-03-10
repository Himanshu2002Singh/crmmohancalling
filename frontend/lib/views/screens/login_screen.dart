import 'package:calling_crm/controllers/providers/calls_provider.dart';
import 'package:calling_crm/controllers/providers/lead_provider.dart';
import 'package:calling_crm/controllers/providers/userprovider.dart';
import 'package:calling_crm/services/api_service.dart';
import 'package:calling_crm/views/screens/dashboard/dashboard_screen.dart';
import 'package:calling_crm/views/widgets/custom_button.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  TextEditingController userNameController = TextEditingController();
  TextEditingController passwordController = TextEditingController();
  bool _obscurePassword = true;

  void loginUser(String userName, String password) async {
    if (userName.isEmpty || password.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          backgroundColor: Colors.red,
          content: Text('Employee ID and Password are required'),
        ),
      );
      return;
    }
    try {
      final user = await ApiService.login(userName, password);
      if (!mounted) return;
      await Provider.of<UserProvider>(
        context,
        listen: false,
      ).fetchUserData(user.empId);
      await Provider.of<LeadProvider>(context, listen: false).fetchAllLeads();
      await Provider.of<CallsProvider>(
        context,
        listen: false,
      ).fetchTotalCalls();
      // await Provider.of<CallsProvider>(
      //   context,
      //   listen: false,
      // ).fetchTodayCalls();
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(SnackBar(content: Text('Welcome ${user.ename}!')));

      Navigator.pushReplacement(
        context,
        MaterialPageRoute(builder: (context) => DashboardScreen()),
      );
      // write login submission code here
    } catch (e) {
      // Show the actual error message from backend
      String errorMessage = 'Something went wrong';
      if (e.toString().contains('subscription has expired') ||
          e.toString().contains('No active subscription')) {
        errorMessage =
            'Your organization\'s subscription has expired. Please contact your admin to renew.';
      } else if (e.toString().contains('Invalid username') ||
          e.toString().contains('Invalid credentials')) {
        errorMessage = 'Invalid username or password';
      } else {
        // Extract message from Exception
        final msg = e.toString();
        if (msg.contains('Exception:')) {
          errorMessage = msg.split('Exception: ').last;
        }
      }

      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(backgroundColor: Colors.red, content: Text(errorMessage)),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      body: SafeArea(
        child: Center(
          child: Stack(
            children: [
              Container(
                child: Column(
                  mainAxisAlignment:
                      MainAxisAlignment.center, // Center vertically
                  children: <Widget>[
                    // Padding(
                    //   padding: const EdgeInsets.only(top: 20.0),
                    //   child: Column(
                    //     children: [
                    //       Image.asset(
                    //         'assets/images/capitalCareLogo.png',
                    //         width: 225,
                    //       ),
                    //     ],
                    //   ),
                    // ),
                    SizedBox(height: 40), // Extra space
                    Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 24.0),
                      child: Column(
                        children: <Widget>[
                          TextField(
                            controller: userNameController,
                            decoration: const InputDecoration(
                              labelText: 'Enter Username',
                              border: OutlineInputBorder(),
                            ),
                          ),
                          const SizedBox(height: 20),
                          TextField(
                            controller: passwordController,
                            obscureText:
                                _obscurePassword, // Obscure or show password based on toggle
                            decoration: InputDecoration(
                              labelText: 'Enter Password',
                              border: OutlineInputBorder(),
                              suffixIcon: IconButton(
                                icon: Icon(
                                  _obscurePassword
                                      ? Icons.visibility_off
                                      : Icons.visibility,
                                ),
                                onPressed: () {
                                  setState(() {
                                    _obscurePassword =
                                        !_obscurePassword; // Toggle password visibility
                                  });
                                },
                              ),
                            ),
                          ),
                          const SizedBox(height: 30),
                          CustomButton(
                            text: "Login",
                            onPressed: () {
                              String username = userNameController.text.trim();
                              String password = passwordController.text.trim();
                              loginUser(username, password);
                            },
                            color: Colors.green,
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
              Positioned(
                bottom: 10,
                left: 40,
                child: Text("Designed and Developed by Trusting Brains"),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
