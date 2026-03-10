import 'package:calling_crm/controllers/providers/lead_provider.dart';
import 'package:calling_crm/models/leads_model.dart';
import 'package:calling_crm/views/screens/leads/lead_details_screen.dart';
import 'package:calling_crm/views/widgets/app_scaffold.dart';
import 'package:calling_crm/views/widgets/custom_appbar.dart';
import 'package:calling_crm/views/widgets/lead_card.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

class FreshLeads extends StatefulWidget {
  const FreshLeads({super.key});

  @override
  State<FreshLeads> createState() => _FreshLeadsState();
}

class _FreshLeadsState extends State<FreshLeads> {
  @override
  Widget build(BuildContext context) {
    final leadProvider = Provider.of<LeadProvider>(context, listen: false);

    return AppScaffold(
      appBar: CustomAppbar(title: "Fresh Leads"),
      body: FutureBuilder<List<Leads>>(
        future: leadProvider.freshLeads, // async getter
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return const Center(child: CircularProgressIndicator());
          } else if (snapshot.hasError) {
            return Center(child: Text("Error: ${snapshot.error}"));
          } else if (!snapshot.hasData || snapshot.data!.isEmpty) {
            return const Center(child: Text("No fresh leads available."));
          }

          final leads = snapshot.data!;
          return ListView.builder(
            itemCount: leads.length,
            itemBuilder: (context, index) {
              final lead = leads[index];
              return GestureDetector(
                onTap: () {
                  Navigator.push(
                    context,
                    MaterialPageRoute(
                      builder: (context) => LeadDetailsScreen(lead: lead),
                    ),
                  );
                },
                child: LeadCard(lead: lead),
              );
            },
          );
        },
      ),
      isFloatingActionButton: false,
    );
  }
}
