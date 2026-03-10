import 'package:calling_crm/controllers/providers/calls_provider.dart';
import 'package:calling_crm/controllers/providers/lead_provider.dart';
import 'package:calling_crm/models/leads_model.dart';
import 'package:calling_crm/services/api_service.dart';
import 'package:calling_crm/theme/appcolors.dart';
import 'package:calling_crm/views/screens/attendance_screen.dart';
import 'package:calling_crm/views/screens/call_logs_screen.dart';
import 'package:calling_crm/views/screens/dashboard/leads_count_screen.dart';
import 'package:calling_crm/views/screens/leads/leads_screen.dart';
import 'package:calling_crm/views/screens/login_screen.dart';
import 'package:calling_crm/views/widgets/app_scaffold.dart';
import 'package:calling_crm/views/widgets/bar_chart.dart';
import 'package:calling_crm/views/widgets/custom_appbar.dart';
import 'package:calling_crm/views/widgets/dialPadBottomSheet.dart';
import 'package:calling_crm/views/widgets/piechart.dart';
import 'package:flutter/material.dart';
import 'package:fl_chart/fl_chart.dart';
import 'package:provider/provider.dart';

class DashboardScreen extends StatefulWidget {
  DashboardScreen({super.key});

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen>
    with WidgetsBindingObserver {
  final boxColorList = [
    Colors.greenAccent,
    Colors.blueGrey,
    Colors.red,
    Colors.lightBlue,
    Colors.orange,
    Colors.purple,
  ];

  final boxIconList = [
    Icons.calendar_month,
    Icons.event_available,
    Icons.pending_actions,
    Icons.man,
    Icons.call,
    Icons.call_received,
  ];

  final boxTextList = [
    "Today LineUps",
    "Tomorrow LineUps",
    "Selected",
    "Total Joined",
    "Total Calls",
    "Today Calls",
  ];
  List<Leads> leadsForGraph = [];
  int selectedDays = 7;
  List<int> dayOptions = [7, 15, 30, 60];

  @override
  void initState() {
    super.initState();
    // TODO: implement initState
    getLeadsForGraph();
    // Add lifecycle observer to check subscription when app resumes
    WidgetsBinding.instance.addObserver(this);
  }

  @override
  void dispose() {
    // Remove lifecycle observer
    WidgetsBinding.instance.removeObserver(this);
    super.dispose();
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    super.didChangeAppLifecycleState(state);
    // When app resumes from background, check subscription
    if (state == AppLifecycleState.resumed) {
      _checkSubscription();
    }
  }

  Future<void> _checkSubscription() async {
    try {
      final result = await ApiService.checkSubscriptionStatus();
      if (result['is_active'] == false && mounted) {
        // Subscription expired - show dialog and logout
        showDialog(
          context: context,
          barrierDismissible: false,
          builder:
              (context) => AlertDialog(
                title: Text("Subscription Expired"),
                content: Text(
                  result['message'] ??
                      "Your organization's subscription has expired. Please contact your admin to renew.",
                ),
                actions: [
                  TextButton(
                    onPressed: () async {
                      await ApiService.clearAllData();
                      if (mounted) {
                        Navigator.of(context).pushAndRemoveUntil(
                          MaterialPageRoute(
                            builder: (context) => const LoginScreen(),
                          ),
                          (Route<dynamic> route) => false,
                        );
                      }
                    },
                    child: Text("OK"),
                  ),
                ],
              ),
        );
      }
    } catch (e) {
      // Error checking subscription - ignore
    }
  }

  Future<void> getLeadsForGraph() async {
    final startDate = DateTime.now().subtract(Duration(days: selectedDays));
    final endDate = DateTime.now().add(const Duration(days: 1));
    leadsForGraph = await ApiService.fetchLeads(startDate, endDate);
    setState(() {});
  }

  @override
  Widget build(BuildContext context) {
    final leadProvider = Provider.of<LeadProvider>(context, listen: true);
    final callProvider = Provider.of<CallsProvider>(context, listen: true);
    final calls = callProvider.totalCallsCount;
    final todayCalls = callProvider.todayCallsCount;

    final tomorrowLeads = leadProvider.tomorrowLeads;

    final todayLeads = leadProvider.todayLeads;
    final totalLeads = leadProvider.totalLeadsCount;
    final totalJoined = leadProvider.totalJoinedCount;

    final selected = leadProvider.selected;

    final boxCountList = [
      todayLeads.length,
      tomorrowLeads.length,
      selected.length,
      totalJoined,
      calls,
      todayCalls,
    ];
    return AppScaffold(
      isFloatingActionButton: true,
      floatingActionButtonIcon: Icon(Icons.add),
      floatingActionButtonOnTap: () {
        showModalBottomSheet(
          context: context,
          isScrollControlled: true,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
          ),
          builder: (_) => DialPadBottomSheet(),
        );
      },
      appBar: CustomAppbar(
        title: "DashBoard",
        action: [
          // Padding(
          //   padding: const EdgeInsets.all(8.0),
          //   child: OutlinedButton(
          //     onPressed: () {
          //       Navigator.push(
          //         context,
          //         MaterialPageRoute(builder: (context) => Attendancescreen()),
          //       );
          //     },
          //     child: Text(
          //       "Check in/out",
          //       style: TextStyle(color: Colors.white),
          //     ),
          //     style: OutlinedButton.styleFrom(
          //       side: BorderSide(
          //         color: const Color.fromARGB(162, 255, 255, 255),
          //       ), // This is the correct way
          //       shape: RoundedRectangleBorder(
          //         borderRadius: BorderRadius.circular(10),
          //       ),
          //       padding: EdgeInsets.symmetric(
          //         horizontal: 12,
          //       ), // Adjust this value (default is 16)
          //       minimumSize: Size(0, 36), // Remove minimum width constraint
          //     ),
          //   ),
          // ),
        ],
      ),
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(12.0),
          child: LayoutBuilder(
            builder: (context, constraints) {
              double boxWidth = (constraints.maxWidth - 12) / 2;

              return SingleChildScrollView(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // 4 boxes
                    Wrap(
                      spacing: 12,
                      runSpacing: 12,
                      children: List.generate(6, (index) {
                        return GestureDetector(
                          onTap:
                              () => Navigator.push(
                                context,
                                MaterialPageRoute(
                                  builder: (context) {
                                    if (index == 3) {
                                      return LeadsScreen(status: "Joined");
                                    } else if (index == 2) {
                                      return LeadsScreen(
                                        status: "Interview Selected",
                                      );
                                    } else if (index == 1) {
                                      return LeadsCountScreen(
                                        title: "Tomorrow LineUps",
                                        // leads: tomorrowLeads,
                                      );
                                    } else if (index == 0) {
                                      return LeadsCountScreen(
                                        title: "Today LineUps",
                                        // leads: todayLeads,
                                      );
                                    } else if (index == 4) {
                                      return CallLogsScreen();
                                    } else {
                                      return CallLogsScreen(
                                        title: "Today Calls",
                                      );
                                    }
                                  },
                                ),
                              ),
                          child: Container(
                            decoration: BoxDecoration(
                              borderRadius: BorderRadius.circular(10),
                              color: boxColorList[index],
                            ),
                            padding: const EdgeInsets.all(10),
                            width: boxWidth,
                            child: IconTheme(
                              data: const IconThemeData(color: Colors.white),
                              child: DefaultTextStyle(
                                maxLines: 1,
                                style: const TextStyle(
                                  color: Colors.white,
                                  fontWeight: FontWeight.w500,
                                  fontSize: 16,
                                ),
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Icon(boxIconList[index]),
                                    const SizedBox(height: 10),
                                    Center(
                                      child: Column(
                                        children: [
                                          // Text("0"),
                                          Text("${boxCountList[index]}"),
                                          const SizedBox(height: 10),
                                          Text(boxTextList[index]),
                                        ],
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            ),
                          ),
                        );
                      }),
                    ),

                    const SizedBox(height: 20),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text(
                          "Lead Status",
                          style: TextStyle(color: Colors.blue, fontSize: 17),
                        ),
                        DropdownButton<int>(
                          value: selectedDays,
                          items:
                              dayOptions.map((days) {
                                return DropdownMenuItem<int>(
                                  value: days,
                                  child: Text("Last $days days"),
                                );
                              }).toList(),
                          onChanged: (newValue) {
                            if (newValue != null) {
                              setState(() {
                                selectedDays = newValue;
                                getLeadsForGraph(); // fetch new leads on change
                              });
                            }
                          },
                        ),
                      ],
                    ),
                    const SizedBox(height: 16),

                    // Bar chart
                    DynamicBarChart(leads: leadsForGraph),
                    const SizedBox(height: 20),
                    // const Text(
                    //   "Lead By Source",
                    //   style: TextStyle(color: Colors.blue, fontSize: 17),
                    // ),
                    // const SizedBox(height: 16),
                    // //pie chart
                    // DynamicPieChart(leads: leadsForGraph),
                  ],
                ),
              );
            },
          ),
        ),
      ),
    );
  }
}
