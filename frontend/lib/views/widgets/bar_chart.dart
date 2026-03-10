import 'package:calling_crm/models/leads_model.dart';
import 'package:fl_chart/fl_chart.dart';
import 'package:flutter/material.dart';

class DynamicBarChart extends StatelessWidget {
  final List<Leads> leads;

  DynamicBarChart({Key? key, required this.leads}) : super(key: key);

  final List<String> statusList = [
    "Interested",
    "Call Back",
    "No Requirement",
    "Follow up",
    "Interview Rejected",
    "Interview Pending",
    "Interview Done",
    "Interview Selected",
    "Joined",
    "1 month Completed",
    "2 months Completed",
    "3 Months Completed",
  ];

  final List<Color> boxColorList = [
    Colors.blue,
    Colors.red,
    Colors.green,
    Colors.orange,
    Colors.purple,
    Colors.cyan,
    Colors.brown,
    Colors.teal,
    Colors.indigo,
    Colors.pink,
    Colors.amber,
    Colors.lightGreenAccent,
  ];

  @override
  Widget build(BuildContext context) {
    // Step 1: Count how many leads have each status
    Map<String, int> statusCounts = {for (var s in statusList) s: 0};
    for (var lead in leads) {
      if (statusCounts.containsKey(lead.status)) {
        statusCounts[lead.status] = statusCounts[lead.status]! + 1;
      }
    }

    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      child: Container(
        width: statusList.length * 80, // allow space for bars and labels
        height: 250,
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: Colors.white,
          border: Border.all(color: Colors.blue.shade100),
          borderRadius: BorderRadius.circular(12),
          boxShadow: [
            BoxShadow(
              color: Colors.black12,
              blurRadius: 5,
              offset: Offset(0, 2),
            ),
          ],
        ),
        child: BarChart(
          BarChartData(
            alignment: BarChartAlignment.spaceAround,
            maxY:
                (statusCounts.values.isNotEmpty
                    ? statusCounts.values.reduce((a, b) => a > b ? a : b)
                    : 1) +
                3,
            barTouchData: BarTouchData(enabled: true),
            gridData: FlGridData(show: false),
            titlesData: FlTitlesData(
              leftTitles: AxisTitles(sideTitles: SideTitles(showTitles: true)),
              bottomTitles: AxisTitles(
                sideTitles: SideTitles(
                  showTitles: true,
                  getTitlesWidget: (value, _) {
                    int index = value.toInt();
                    if (index >= 0 && index < statusList.length) {
                      return Transform.rotate(
                        angle: -0.5,
                        child: Padding(
                          padding: const EdgeInsets.only(top: 8.0),
                          child: Text(
                            textAlign: TextAlign.center,
                            statusList[index],
                            style: const TextStyle(fontSize: 10),
                          ),
                        ),
                      );
                    }
                    return const SizedBox.shrink();
                  },
                  reservedSize: 40,
                ),
              ),
              rightTitles: AxisTitles(
                sideTitles: SideTitles(showTitles: false),
              ),
              topTitles: AxisTitles(sideTitles: SideTitles(showTitles: false)),
            ),
            borderData: FlBorderData(show: false),
            barGroups: List.generate(statusList.length, (index) {
              final count = statusCounts[statusList[index]] ?? 0;
              return BarChartGroupData(
                x: index,
                barRods: [
                  BarChartRodData(
                    toY: count.toDouble(),
                    color: boxColorList[index % boxColorList.length],
                    width: 20,
                    borderRadius: BorderRadius.circular(4),
                  ),
                ],
              );
            }),
          ),
        ),
      ),
    );
  }
}
