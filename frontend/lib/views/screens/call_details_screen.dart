import 'dart:ffi';

import 'package:calling_crm/controllers/providers/calls_provider.dart';
import 'package:calling_crm/controllers/providers/history_provider.dart';
import 'package:calling_crm/controllers/providers/lead_provider.dart';
import 'package:calling_crm/controllers/providers/userprovider.dart';
import 'package:calling_crm/models/calls_model.dart';
import 'package:calling_crm/models/employee_model.dart';
import 'package:calling_crm/models/history_model.dart';
import 'package:calling_crm/models/leads_model.dart';

import 'package:calling_crm/services/api_service.dart';
import 'package:calling_crm/theme/appcolors.dart';
import 'package:calling_crm/views/widgets/custom_button.dart';
import 'package:flutter/material.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:provider/provider.dart';

class CallDetailsScreen extends StatefulWidget {
  final lead;
  final number;
  CallDetailsScreen({super.key, this.lead, this.number});

  @override
  State<CallDetailsScreen> createState() => _CallDetailsScreenState();
}

class _CallDetailsScreenState extends State<CallDetailsScreen> {
  String? feedbackStatus;

  // String? priority;

  // String? source;

  // String? loanType;

  final TextEditingController nextMeetingController = TextEditingController();

  final TextEditingController budgetController = TextEditingController();

  final TextEditingController remarkController = TextEditingController();
  final TextEditingController contactNameController = TextEditingController();

  final TextEditingController descriptionController = TextEditingController();
  final TextEditingController companyNameController = TextEditingController();

  void handleSubmission() async {
    updateCall();
    if (feedbackStatus == null) {
      feedbackStatus = widget.lead.status;
    }
    // if (loanType == null) {
    //   loanType = widget.lead.loanType;
    // }
    // if (priority == null) {
    //   priority = widget.lead.priority;
    // }

    // Clear next meeting when status is 3 Months Completed
    if (feedbackStatus == "3 Months Completed") {
      nextMeetingController.text = "";
    } else if (nextMeetingController.text.isEmpty) {
      nextMeetingController.text = widget.lead.next_meeting;
    }

    // Only update estimated salary if it's a new lead or empty
    if (widget.lead == null ||
        widget.lead.est_salary == null ||
        widget.lead.est_salary.isEmpty) {
      if (budgetController.text.isNotEmpty) {
        // Keep the new value
      } else {
        budgetController.text = widget.lead?.est_salary ?? "";
      }
    } else {
      // Keep existing estimated salary, don't update
      budgetController.text = widget.lead.est_salary;
    }

    if (remarkController.text.isEmpty) {
      remarkController.text = widget.lead.remark;
    }

    Leads updateLead = Leads(
      status: feedbackStatus!,
      // loanType: loanType,
      // priority: priority!,
      next_meeting: nextMeetingController.text,
      est_salary: budgetController.text,
      remark: remarkController.text,
    );

    History newHistory = History(
      lead_id: widget.lead.lead_id,
      owner: widget.lead.owner,
      next_meeting: nextMeetingController.text,
      status: feedbackStatus,
      // loanType: loanType,
      remark: remarkController.text,
    );
    Provider.of<LeadProvider>(
      context,
      listen: false,
    ).updateLead(updateLead, widget.lead.lead_id);
    // bool success1 = await ApiService.updateLead(
    //   widget.lead.lead_id,
    //   updateLead,
    // );
    // bool success2 = await ApiService.addHistory(newHistory);
    Provider.of<HistoryProvider>(context, listen: false).addHistory(newHistory);
    // Provider.of<LeadProvider>(context, listen: false).addLead();

    // ScaffoldMessenger.of(context).showSnackBar(
    //   SnackBar(content: Text(success1 && success2 ? "success" : "Error")),
    // );
    // if (success1 && success2) {
    //   Navigator.pop(context);
    // }
    Navigator.pop(context);
  }

  void updateCall() async {
    // print("==================================> update call called");
    final storage = FlutterSecureStorage();
    final userId = await storage.read(key: "userId");

    if (userId == null) {
      print("User ID not found");
      return;
    }
    // final callProvider = Provider.of<CallsProvider>(context, listen: false);
    // List<Calls> callList = callProvider.calls;

    // if (callList.isEmpty) {
    //   print("No calls found for this user");
    //   return;
    // }

    Provider.of<CallsProvider>(
      context,
      listen: false,
    ).updateLastCallRemark(remarkController.text);

    // bool success = await ApiService.updateCall(newCall, callList[0].call_id);

    // print(
    //   success
    //       ? "=================> Call updated successfully"
    //       : "Failed to update call",
    // );
  }

  void addLeadSubmission() async {
    int idOfLead;
    // updateCall();
    if (contactNameController.text.isEmpty) {
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(SnackBar(content: Text("fill contact name")));
      return;
    }
    if (companyNameController.text.isEmpty) {
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(SnackBar(content: Text("fill company name")));
      return;
    }
    final user = Provider.of<UserProvider>(context, listen: false).user;
    Leads newLead = Leads(
      name: contactNameController.text,
      number: widget.number,
      person_id: user?.empId,
      owner: user?.ename,
      // source: source,
      description: descriptionController.text,
      status: feedbackStatus,
      next_meeting: nextMeetingController.text,
      remark: remarkController.text,
      est_salary: budgetController.text,
      company_name: companyNameController.text,
      // loanType: loanType,
      // priority: priority,
    );
    // bool success = await ApiService.addLead(newLead);
    int newLeadId = await Provider.of<LeadProvider>(
      context,
      listen: false,
    ).addLead(newLead);
    idOfLead = newLeadId;
    updateHistory(user?.ename, user?.empId, idOfLead);
    // ScaffoldMessenger.of(
    //   context,
    // ).showSnackBar(SnackBar(content: Text(success ? "Success" : "error")));
    Navigator.pop(context);
    // if (success) Navigator.pop(context);
  }

  void updateHistory(ename, emp_id, idOfLead) async {
    // List<Leads> leads = Provider.of<LeadProvider>(context, listen: false).leads;

    History newHistory = History(
      lead_id: idOfLead ?? widget.lead.lead_id,
      owner: ename,
      next_meeting: nextMeetingController.text,
      status: feedbackStatus,
      remark: remarkController.text,
      // loanType: loanType,
    );
    // await ApiService.addHistory(newHistory);
    Provider.of<HistoryProvider>(context, listen: false).addHistory(newHistory);

    Calls call = Calls(
      lead_id: idOfLead ?? widget.lead.lead_id,
      emp_id: emp_id,
      name: contactNameController.text,
      number: widget.number,
      remark: remarkController.text,
    );
    // await ApiService.addCalls(call);
    Provider.of<CallsProvider>(context, listen: false).addCall(call);
  }

  @override
  void initState() {
    // TODO: implement initState
    super.initState();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        backgroundColor: AppColors.primaryColor,
        title: const Text('You just called.....'),
        automaticallyImplyLeading: false,
        foregroundColor: AppColors.appBarForegroundColor,
        actions: [
          IconButton(
            onPressed: () {
              Navigator.pop(context);
            },
            icon: Icon(Icons.close),
          ),
        ],
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.center,
              children: [
                Row(
                  children: [
                    const Icon(
                      Icons.check_circle,
                      size: 70,
                      color: Color(0xFF03A9F4),
                    ),
                    const SizedBox(width: 10),
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          widget.lead == null
                              ? widget.number
                              : widget.lead.number,
                          style: TextStyle(fontSize: 20, color: Colors.black54),
                        ),
                        Text(
                          widget.lead == null ? "" : widget.lead.name,
                          style: TextStyle(fontSize: 16, color: Colors.black54),
                        ),
                        // const Text(
                        //   '01:31:46',
                        //   style: TextStyle(fontSize: 16, color: Colors.black54),
                        // ),
                      ],
                    ),
                  ],
                ),

                const SizedBox(height: 20),

                /// Feedback Status Dropdown
                buildDropdown(
                  value: feedbackStatus,
                  hint: 'Select Feedback Status',
                  items: [
                    "Interested",
                    "Call Back",
                    "Not Interested",
                    "LineUp",
                    "LineUp Droupout",
                    "Interview Rejected",
                    "Interview Pending",
                    "Interview Done",
                    "Interview Selected",
                    "Joined",
                    "1 month Completed",
                    "2 months Completed",
                    "3 Months Completed",
                    "Other",
                  ],
                  onChanged: (val) => setState(() => feedbackStatus = val!),
                ),

                //select loan type
                // buildDropdown(
                //   value: loanType,
                //   hint: 'Select Loan Type',
                //   items: [
                //     "Home Loan",
                //     "Mortgage Loan",
                //     "User Car Loan",
                //     "Business Loan",
                //     "Personal Loan",
                //     "DOD",
                //     "CC/OD",
                //     "CGTMSME",
                //     "Mutual Fund",
                //     "Insurance",
                //     "Other",
                //   ],
                //   onChanged:
                //       (val) => setState(() {
                //         loanType = val!;
                //       }),
                // ),

                /// Priority Dropdown
                // buildDropdown(
                //   value: priority,
                //   hint: 'Select Priority',
                //   items: [
                //     // 'High Priority and Urgent',
                //     // 'Med',
                //     // 'Lower',
                //     // "Important",
                //     "Priority",
                //     "Non-Priority",
                //   ],
                //   onChanged: (val) => setState(() => priority = val!),
                // ),
                GestureDetector(
                  onTap: () async {
                    DateTime? pickedDate = await showDatePicker(
                      context: context,
                      initialDate: DateTime.now(),
                      firstDate: DateTime.now(),
                      lastDate: DateTime(2050),
                    );

                    if (pickedDate != null) {
                      TimeOfDay? pickedTime = await showTimePicker(
                        context: context,
                        initialTime: TimeOfDay.now(),
                      );

                      if (pickedTime != null) {
                        // Combine date and time into one DateTime
                        DateTime finalDateTime = DateTime(
                          pickedDate.year,
                          pickedDate.month,
                          pickedDate.day,
                          pickedTime.hour,
                          pickedTime.minute,
                        );

                        // Format as desired, e.g., YYYY-MM-DD HH:MM
                        nextMeetingController.text = finalDateTime.toString();
                        // OR use intl package for prettier format:
                        // nextMeetingTimeController.text = DateFormat('yyyy-MM-dd HH:mm').format(finalDateTime);
                      }
                    }
                  },
                  child: AbsorbPointer(
                    child: TextFormField(
                      controller: nextMeetingController,
                      decoration: InputDecoration(
                        hintText: 'Select Next Calling Date',
                        border: OutlineInputBorder(),
                      ),
                    ),
                  ),
                ),

                /// Next Meeting DateTime Dropdown (Dummy)
                // buildDropdown(
                //   value: nextMeeting,
                //   hint: 'Select Next Meeting DateTime',
                //   items: ['Today 4 PM', 'Tomorrow 11 AM', 'Next Monday'],
                //   onChanged: (val) => setState(() => nextMeeting = val),
                // ),

                /// Estimation Date Dropdown (Dummy)
                // buildDropdown(
                //   value: estimationDate,
                //   hint: 'Select Estimation Date',
                //   items: ['10 May 2025', '12 May 2025', '15 May 2025'],
                //   onChanged: (val) => setState(() => estimationDate = val),
                // ),

                /// Budget
                if (widget.lead == null)
                  buildTextField(
                    controller: budgetController,
                    hint: 'Estimated Salary',
                    keyboardType: TextInputType.number,
                  ),

                /// Remark
                buildTextField(controller: remarkController, hint: 'Remark'),
                SizedBox(height: 10),

                if (widget.lead == null)
                  Container(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          "Contact Details",
                          style: TextStyle(
                            fontSize: 20,
                            fontStyle: FontStyle.italic,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        SizedBox(height: 10),
                        buildTextField(
                          controller: contactNameController,
                          hint: "Contact Name",
                        ),
                        buildTextField(
                          controller: companyNameController,
                          hint: "Company Name",
                        ),
                        // buildDropdown(
                        //   value: source,
                        //   hint: "--Select Source--",
                        //   items: [
                        //     // "Internet",
                        //     // "Newspaper",
                        //     // "Website",
                        //     "Self",
                        //     "Refrence",
                        //     "Bulk excel",
                        //   ],
                        //   onChanged: (value) {
                        //     source = value;
                        //     setState(() {});
                        //   },
                        // ),
                        buildTextField(
                          controller: descriptionController,
                          hint: "Description",
                        ),
                      ],
                    ),
                  ),

                SizedBox(height: 20),

                /// Submit Button
                CustomButton(
                  text: "SUBMIT",
                  onPressed: () {
                    if (widget.lead == null) {
                      addLeadSubmission();
                    } else {
                      handleSubmission();
                    }
                  },
                ),

                const SizedBox(height: 20),
                const Text(
                  'fetching Recording file ...Please Wait',
                  style: TextStyle(color: Colors.black54),
                ),
                const SizedBox(height: 20),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget buildDropdown({
    // required BuildContext context,
    required String? value,
    required String hint,
    required List<String> items,
    required void Function(String?) onChanged,
  }) {
    return Container(
      margin: const EdgeInsets.symmetric(vertical: 8),
      padding: const EdgeInsets.symmetric(horizontal: 12),
      decoration: BoxDecoration(
        border: Border.all(color: Colors.black38),
        borderRadius: BorderRadius.circular(5),
      ),
      child: DropdownButtonFormField<String>(
        value: value,
        isExpanded: true,
        dropdownColor: Colors.white,
        decoration: const InputDecoration(border: InputBorder.none),
        hint: Text(hint),
        style: const TextStyle(color: Colors.black87, fontSize: 16),
        items:
            items
                .map(
                  (item) => DropdownMenuItem<String>(
                    value: item,
                    child: Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 12,
                        vertical: 14,
                      ),
                      decoration: const BoxDecoration(
                        border: Border(
                          bottom: BorderSide(color: Colors.grey, width: 0.8),
                        ),
                      ),
                      width: double.infinity,
                      child: Text(item),
                    ),
                  ),
                )
                .toList(),
        onChanged: onChanged,
        selectedItemBuilder: (context) {
          return items.map((item) {
            return Align(alignment: Alignment.centerLeft, child: Text(item));
          }).toList();
        },
      ),
    );
  }

  Widget buildTextField({
    required TextEditingController controller,
    required String hint,
    TextInputType keyboardType = TextInputType.text,
  }) {
    return Container(
      margin: const EdgeInsets.symmetric(vertical: 8),
      child: TextField(
        keyboardType: keyboardType,
        controller: controller,
        decoration: InputDecoration(
          hintText: hint,
          border: const OutlineInputBorder(),
        ),
      ),
    );
  }
}
