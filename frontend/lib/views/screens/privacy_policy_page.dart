import 'package:flutter/material.dart';

class PrivacyPolicyPage extends StatelessWidget {
  const PrivacyPolicyPage({Key? key}) : super(key: key);

  Widget sectionTitle(String text) {
    return Padding(
      padding: const EdgeInsets.only(top: 20, bottom: 8),
      child: Text(
        text,
        style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
      ),
    );
  }

  Widget sectionContent(String text) {
    return Text(text, style: const TextStyle(fontSize: 15, height: 1.6));
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text("Privacy Policy")),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            sectionTitle("1. Introduction"),
            sectionContent(
              "This Privacy Policy explains how information is collected, used, "
              "and protected when using this mobile application. "
              "By using the application, you agree to this policy.",
            ),

            sectionTitle("2. Information We Collect"),
            sectionContent(
              "• Personal Information (Name, Email, Phone Number)\n"
              "• Customer / CRM Data",
              // "• Device Information\n"
              // "• Call-related Information (if required for functionality)",
            ),

            sectionTitle("3. How We Use Information"),
            sectionContent(
              "Information is used to manage leads, track communication, "
              "improve services, enhance security, and ensure smooth operations.",
            ),

            sectionTitle("4. Data Security"),
            sectionContent(
              "We implement reasonable safeguards to protect data from "
              "unauthorized access or misuse.",
            ),

            sectionTitle("5. Data Sharing"),
            sectionContent(
              "We do not sell or rent personal information. "
              "Data may be shared with authorized administrators or if required by law.",
            ),

            sectionTitle("6. Permissions Used"),
            sectionContent(
              "The application may request Phone, Call Logs, Internet, "
              "and Storage permissions strictly for operational purposes.",
            ),

            sectionTitle("7. Data Retention"),
            sectionContent(
              "Data is retained only as long as necessary for business or legal purposes.",
            ),

            sectionTitle("8. User Rights"),
            sectionContent(
              "Users may request access, correction, or deletion of their data "
              "subject to applicable policies.",
            ),

            sectionTitle("9. Changes to This Policy"),
            sectionContent(
              "This Privacy Policy may be updated from time to time. "
              "Changes will be reflected within the application.",
            ),

            const SizedBox(height: 30),
          ],
        ),
      ),
    );
  }
}
