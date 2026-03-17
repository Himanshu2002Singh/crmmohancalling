import 'package:calling_crm/controllers/providers/lead_provider.dart';
import 'package:calling_crm/controllers/providers/userprovider.dart';
import 'package:calling_crm/theme/appcolors.dart';
import 'package:calling_crm/views/screens/leads/add_lead_screen.dart';
import 'package:calling_crm/views/screens/leads/lead_details_screen.dart';
import 'package:calling_crm/views/widgets/app_scaffold.dart';
import 'package:calling_crm/views/widgets/custom_appbar.dart';
import 'package:calling_crm/views/widgets/lead_card.dart';
import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';

class LeadsScreen extends StatefulWidget {
  final String? status;
  const LeadsScreen({super.key, this.status});

  @override
  State<LeadsScreen> createState() => _LeadsScreenState();
}

class _LeadsScreenState extends State<LeadsScreen> {
  String loanSelectedItem = "All";
  String selectedStatusItem = "All";
  String searchQuery = "";
  bool showSearchBar = false;

  DateTime today = DateTime.now();
  DateTime? startDate = DateTime.now().subtract(
    Duration(days: 30),
  ); // Changed to reasonable default
  DateTime? endDate = DateTime.now();

  // final List<String> loanTypeOptions = [
  //   "All",
  //   "Home Loan",
  //   "Mortgage Loan",
  //   "User Car Loan",
  //   "Business Loan",
  //   "Personal Loan",
  //   "DOD",
  //   "CC/OD",
  //   "CGTMSME",
  //   "Mutual Fund",
  //   "Insurance",
  //   "Other",
  // ];

  final List<String> statusOptions = [
    "All",
    "Interested",
    "Call Back",
    "Not Interested",
    "LineUp",
    "LineUp Dropout",
    "Interview Rejected",
    "Interview Pending",
    "Interview Done",
    "Interview Selected",
    "Joined",
    "1 month Completed",
    "2 months Completed",
    "3 Months Completed",
    "Other",
  ];

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      Provider.of<LeadProvider>(
        context,
        listen: false,
      ).fetchLeads(start: startDate, end: endDate);
    });
    if (widget.status != null) {
      selectedStatusItem = widget.status!;
    }
  }

  @override
  Widget build(BuildContext context) {
    final leadProvider = Provider.of<LeadProvider>(context, listen: true);
    final leads = leadProvider.leads;
    final isLoading = leadProvider.isLoading;
    final user = Provider.of<UserProvider>(context).user;

    final filteredLeads =
        leads.where((lead) {
          // final matchesLoan =
          //     loanSelectedItem == "All" || lead.loanType == loanSelectedItem;

          final matchesStatus =
              selectedStatusItem == "All"
                  ? lead.status !=
                      "Fresh Lead" // 🟢 All selected → skip Fresh
                  : lead.status == selectedStatusItem;

          final matchesSearch =
              searchQuery.isEmpty ||
              lead.name.toLowerCase().contains(searchQuery.toLowerCase()) ||
              lead.number.contains(searchQuery);

          return matchesStatus && matchesSearch;
        }).toList();

    return AppScaffold(
      isFloatingActionButton: true,
      appBar: CustomAppbar(
        title: "Leads",
        // action: [
        //   const SizedBox(width: 10),
        //   DropdownButton<String>(
        //     value: loanSelectedItem,
        //     underline: const SizedBox(),
        //     items:
        //         loanTypeOptions.map((type) {
        //           return DropdownMenuItem(
        //             value: type,
        //             child: Text(type, style: const TextStyle(fontSize: 14)),
        //           );
        //         }).toList(),
        //     onChanged: (value) => setState(() => loanSelectedItem = value!),
        //   ),
        // ],
      ),
      body: SafeArea(
        child: Column(
          children: [
            // Filters and search section (always visible)
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
              child: Row(
                children: [
                  Flexible(
                    child: Container(
                      padding: const EdgeInsets.all(10),
                      decoration: BoxDecoration(
                        gradient: LinearGradient(
                          colors: [
                            Colors.lightBlue.shade100,
                            Colors.lightBlue.shade50,
                          ],
                          begin: Alignment.topLeft,
                          end: Alignment.bottomRight,
                        ),
                        borderRadius: BorderRadius.circular(12),
                        boxShadow: [
                          BoxShadow(
                            color: Colors.grey.withOpacity(0.3),
                            blurRadius: 8,
                            offset: const Offset(0, 4),
                          ),
                        ],
                      ),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.spaceAround,
                        children: [
                          Flexible(
                            child: ElevatedButton(
                              onPressed: _selectStartDate,
                              style: ElevatedButton.styleFrom(
                                padding: const EdgeInsets.symmetric(
                                  horizontal: 10,
                                  vertical: 0,
                                ),
                                backgroundColor: Colors.teal,
                              ),
                              child: FittedBox(
                                fit: BoxFit.scaleDown,
                                child: Text(
                                  maxLines: 1,
                                  startDate != null
                                      ? "Start: ${DateFormat('d MMM yyyy').format(startDate!)}"
                                      : "Pick Start Date",
                                  style: TextStyle(color: Colors.white),
                                ),
                              ),
                            ),
                          ),
                          Flexible(
                            child: ElevatedButton(
                              onPressed: _selectEndDate,
                              style: ElevatedButton.styleFrom(
                                padding: const EdgeInsets.symmetric(
                                  horizontal: 10,
                                  vertical: 0,
                                ),
                                backgroundColor: Colors.deepPurple,
                              ),
                              child: FittedBox(
                                fit: BoxFit.scaleDown,
                                child: Text(
                                  endDate != null
                                      ? "End: ${DateFormat('d MMM yyyy').format(endDate!)}"
                                      : "Pick End Date",
                                  style: TextStyle(color: Colors.white),
                                ),
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                  IconButton(
                    icon: const Icon(Icons.search, color: Colors.black),
                    onPressed:
                        () => setState(() => showSearchBar = !showSearchBar),
                  ),
                ],
              ),
            ),

            if (showSearchBar)
              Padding(
                padding: const EdgeInsets.symmetric(
                  horizontal: 12,
                  vertical: 4,
                ),
                child: TextField(
                  onChanged: (value) => setState(() => searchQuery = value),
                  decoration: InputDecoration(
                    hintText: "Search by name...",
                    prefixIcon: const Icon(Icons.search),
                    contentPadding: const EdgeInsets.symmetric(
                      vertical: 10,
                      horizontal: 10,
                    ),
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                  ),
                ),
              ),

            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 12),
              child: Row(
                children: [
                  Text(
                    "Total Leads: ${filteredLeads.length}",
                    style: const TextStyle(fontWeight: FontWeight.w500),
                  ),
                ],
              ),
            ),

            Container(
              height: 50,
              padding: const EdgeInsets.symmetric(horizontal: 8),
              child: ListView.builder(
                scrollDirection: Axis.horizontal,
                itemCount: statusOptions.length,
                itemBuilder: (context, index) {
                  final option = statusOptions[index];
                  return GestureDetector(
                    onTap: () => setState(() => selectedStatusItem = option),
                    child: Container(
                      margin: const EdgeInsets.symmetric(
                        horizontal: 4,
                        vertical: 8,
                      ),
                      padding: const EdgeInsets.symmetric(
                        horizontal: 12,
                        vertical: 5,
                      ),
                      decoration: BoxDecoration(
                        border: Border.all(
                          color: AppColors.primaryColor,
                          width: 2,
                        ),
                        borderRadius: BorderRadius.circular(20),
                        color:
                            selectedStatusItem == option
                                ? const Color.fromARGB(255, 219, 219, 219)
                                : Colors.white,
                      ),
                      child: Text(option, style: const TextStyle(fontSize: 14)),
                    ),
                  );
                },
              ),
            ),

            // Main content with RefreshIndicator
            Expanded(
              child: RefreshIndicator(
                onRefresh:
                    () => Provider.of<LeadProvider>(
                      context,
                      listen: false,
                    ).fetchLeads(start: startDate, end: endDate),
                child:
                    isLoading
                        ? const Center(child: CircularProgressIndicator())
                        : filteredLeads.isEmpty
                        ? const Center(child: Text("No leads found"))
                        : ListView.builder(
                          itemCount: filteredLeads.length,
                          itemBuilder: (context, index) {
                            final lead = filteredLeads[index];
                            return GestureDetector(
                              onTap: () {
                                Navigator.push(
                                  context,
                                  MaterialPageRoute(
                                    builder:
                                        (context) =>
                                            LeadDetailsScreen(lead: lead),
                                  ),
                                );
                              },
                              child: LeadCard(lead: lead),
                            );
                          },
                        ),
              ),
            ),
          ],
        ),
      ),
      floatingActionButtonIcon: const Icon(Icons.add),
      floatingActionButtonOnTap: () {
        Navigator.push(
          context,
          MaterialPageRoute(
            builder:
                (context) => AddLeadScreen(
                  title: "Add Lead",
                  userId: user?.empId ?? "",
                  userName: user?.ename ?? "",
                ),
          ),
        );
      },
    );
  }

  Future<void> _selectStartDate() async {
    final picked = await showDatePicker(
      context: context,
      initialDate: startDate ?? DateTime.now(),
      firstDate: DateTime(2023),
      lastDate: endDate ?? DateTime.now(), // Don't allow start after end
    );
    if (picked != null) {
      setState(() => startDate = picked);
      Provider.of<LeadProvider>(
        context,
        listen: false,
      ).fetchLeads(start: startDate, end: endDate);
    }
  }

  Future<void> _selectEndDate() async {
    final picked = await showDatePicker(
      context: context,
      initialDate: endDate ?? DateTime.now(),
      firstDate: startDate ?? DateTime(2023), // Don't allow end before start
      lastDate: DateTime.now(),
    );
    if (picked != null) {
      setState(() => endDate = picked);
      Provider.of<LeadProvider>(
        context,
        listen: false,
      ).fetchLeads(start: startDate, end: endDate);
    }
  }
}
