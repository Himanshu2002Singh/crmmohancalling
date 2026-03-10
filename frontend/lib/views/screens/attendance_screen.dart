import 'dart:async';
import 'dart:convert';

import 'package:calling_crm/constants/server_url.dart';
import 'package:calling_crm/theme/appcolors.dart';
import 'package:calling_crm/views/screens/my_attendance_screen.dart';
import 'package:flutter/material.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:geolocator/geolocator.dart';
import 'package:http/http.dart' as http;

class Attendancescreen extends StatefulWidget {
  const Attendancescreen({Key? key}) : super(key: key);

  @override
  State<Attendancescreen> createState() => _AttendancescreenState();
}

class _AttendancescreenState extends State<Attendancescreen> {
  String attendanceStatus = 'Attendance not marked';
  int? attendanceId;
  bool isLoading = false;
  bool isAttendanceMarked = false;
  bool isAttendanceClosed = false;
  // Location? selectedLocation;
  DateTime now = DateTime.now();
  TextEditingController _reasonController = TextEditingController();
  bool isLate = false;
  final storage = FlutterSecureStorage();
  var token;
  Position? position;

  @override
  void initState() {
    super.initState();
    _initializeAttendance();
  }

  Future<void> _initializeAttendance() async {
    // await _loadAttendanceState();

    // await _checkAttendanceStatus();
    // await _checkAndResetAttendanceForNewDay();

    try {
      token = await storage.read(key: "auth_token");
      final response = await http.get(
        Uri.parse('${ServerUrl}/checkattendance'),
        headers: {
          'Content-Type': 'application/json',
          'authorization': 'Bearer $token',
        },
      );
      print("===========================> ${response.body}");
      if (response.statusCode == 200) {
        final responseData = jsonDecode(response.body);
        isAttendanceMarked = responseData['alreadyMarked'] ?? false;
        isAttendanceClosed = responseData['closed'] ?? false;
        setState(() {
          if (isAttendanceMarked && isAttendanceClosed) {
            attendanceStatus = "Attendance is already marked and closed";
          } else if (isAttendanceMarked) {
            attendanceStatus = "Attendance is marked but not closed";
            attendanceId = responseData['attendance']['id'];
          }
        });
      } else {
        print("error fetching attendance details=> ${response.body}");
      }
    } catch (error) {
      print("error fetching attendance status => ${error}");
    }
  }

  Future<void> _closeAttendance() async {
    setState(() {
      isLoading = true;
    });
    try {
      final response = await http.put(
        Uri.parse("${ServerUrl}/closeattendance/${attendanceId}"),
        headers: {
          'Content-Type': 'application/json',
          'authorization': 'Bearer $token',
        },
      );
      if (response.statusCode == 200) {
        final responseData = jsonDecode(response.body);
        print(responseData);
        setState(() {
          attendanceStatus = "Attendance closed Successfully";
          isAttendanceClosed = true;
        });
      } else {
        print("someting went wrong ${response}");
      }
    } catch (error) {
      setState(() {
        attendanceStatus = "An error occurred while marking attendance";
        print("error in close attendance => ${error}");
      });
    } finally {
      setState(() {
        isLoading = false;
      });
    }
  }

  // Future<void> _checkAttendanceStatus() async {
  //   setState(() => isLoading = true);
  //   try {
  //     final storage = FlutterSecureStorage();
  //     final token = await storage.read(key: "auth_token");

  //     final response = await http.get(
  //       Uri.parse('${ServerUrl}/checkattendance'),
  //       headers: {
  //         'Content-Type': 'application/json',
  //         'authorization': 'Bearer $token',
  //       },
  //     );
  //     if (response.statusCode == 200) {
  //       // print('her===>e');
  //       final responseData = jsonDecode(response.body);
  //       bool alreadyMarked = responseData['alreadyMarked'] ?? false;
  //       print('alreadyMarked $alreadyMarked');

  //       setState(() {
  //         if (alreadyMarked) {
  //           attendanceStatus = 'Attendance already completed for today.';
  //           // isAttendanceStarted = true;
  //           isAttendanceMarked = true;
  //         }
  //         print(attendanceStatus);
  //       });
  //     }
  //   } catch (e) {
  //     setState(() => attendanceStatus = 'Error checking attendance status.');
  //   } finally {
  //     setState(() => isLoading = false);
  //   }
  // }

  // Future<void> _checkAndResetAttendanceForNewDay() async {
  //   final prefs = await SharedPreferences.getInstance();
  //   String? lastMarkedDate = prefs.getString('attendanceDate');
  //   print('lastMarkedDate $lastMarkedDate');
  //   String currentDate = DateTime.now().toIso8601String().split('T')[0];
  //   if (lastMarkedDate == null || lastMarkedDate != currentDate) {
  //     await _resetAttendanceState();
  //   }
  // }

  // Future<void> _resetAttendanceState() async {
  //   print('here reset');
  //   final prefs = await SharedPreferences.getInstance();

  //   await prefs.remove('attendanceId');
  //   await prefs.remove('attendanceDate');

  //   setState(() {
  //     attendanceId = null;
  //     attendanceStatus = 'Attendance not marked';
  //   });
  // }

  // Future<void> _loadAttendanceState() async {
  //   final prefs = await SharedPreferences.getInstance();

  //   setState(() {
  //     attendanceId = prefs.getInt('attendanceId');
  //     isAttendanceMarked = prefs.getBool('isAttendanceMarked') ?? false;
  //     attendanceStatus =
  //         isAttendanceMarked
  //             ? 'Attendance Already Marked'
  //             : 'Attendance not marked.';
  //   });
  // }

  // Future<void> _saveAttendanceState(int? id, bool marked) async {
  //   final prefs = await SharedPreferences.getInstance();
  //   await prefs.setBool('isAttendanceMarked', marked);
  //   if (id != null) {
  //     await prefs.setInt('attendanceId', id);
  //   } else {
  //     await prefs.remove('attendanceId');
  //   }

  //   await prefs.setString(
  //     'attendanceDate',
  //     DateTime.now().toIso8601String().split('T')[0],
  //   );
  // }

  Future<void> _getLocationAndMarkAttendance() async {
    bool serviceEnabled = await Geolocator.isLocationServiceEnabled();
    if (!serviceEnabled) {
      setState(() => attendanceStatus = 'Device location is Disabled');
      return;
    }

    LocationPermission permission = await Geolocator.checkPermission();
    if (permission == LocationPermission.denied) {
      permission = await Geolocator.requestPermission();
      if (permission == LocationPermission.denied) {
        setState(() => attendanceStatus = 'Location permissions are denied.');
        return;
      }
    }

    if (permission == LocationPermission.deniedForever) {
      setState(
        () => attendanceStatus = 'Location permissions are permanently denied',
      );
      return;
    }

    position = await Geolocator.getCurrentPosition(
      desiredAccuracy: LocationAccuracy.high,
    );

    // double distanceInMeters = Geolocator.distanceBetween(
    //   28.583967,
    //   77.313246,
    //   position.latitude,
    //   position.longitude,
    // );

    // if (distanceInMeters <= 20) {
    if (isAttendanceMarked) {
      await _closeAttendance();
    } else {
      await _markAttendanceStart();
    }
    // } else {
    // setState(() {
    //   attendanceStatus = 'You are not within 20 meters of office.';
    // });
    // }
  }

  Future<void> _markAttendanceStart() async {
    setState(() => isLoading = true);
    try {
      // final storage = FlutterSecureStorage();
      // final token = await storage.read(key: "auth_token");

      final response = await http.post(
        Uri.parse('${ServerUrl}/markattendance'),
        headers: {
          'Content-Type': 'application/json',
          'authorization': 'Bearer $token',
        },

        body: jsonEncode({
          // 'locationName': "office",
          'isLate': isLate,
          'remark': _reasonController.text,
          'latitude': position!.latitude,
          'longitude': position!.longitude,
        }),
      );

      if (response.statusCode == 200) {
        final responseData = jsonDecode(response.body);
        setState(() {
          attendanceStatus = 'Attendance started successfully!';
          isAttendanceMarked = true;
          attendanceId = responseData['attendance']['id'];
        });
        // print("=========== $attendanceId");
        // await _saveAttendanceState(attendanceId, isAttendanceMarked);
      } else if (response.statusCode == 400) {
        setState(() => attendanceStatus = 'Attendance already marked today.');
      } else {
        setState(
          () =>
              attendanceStatus = 'Failed to start attendance. Try again later.',
        );
      }
    } catch (e) {
      setState(
        () => attendanceStatus = 'An error occurred while marking attendance',
      );
    } finally {
      setState(() => isLoading = false);
    }
  }

  void dispose() {
    super.dispose();
    _reasonController.dispose();
  }

  void _customDialog() {
    showDialog(
      context: context,
      builder: (context) {
        return StatefulBuilder(
          builder: (context, setState) {
            return AlertDialog(
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(15),
              ),
              title: Row(
                children: [
                  Icon(Icons.warning_amber_rounded, color: Colors.red),
                  SizedBox(width: 8),
                  Text(
                    "You are Late",
                    style: TextStyle(fontWeight: FontWeight.bold),
                  ),
                ],
              ),
              content: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(
                    "Please provide a reason",
                    style: TextStyle(fontSize: 14),
                  ),
                  SizedBox(height: 10),
                  TextField(
                    controller: _reasonController,
                    maxLines: 3,
                    onChanged: (_) => setState(() {}), // Refresh on input
                    decoration: InputDecoration(
                      hintText: "Enter your reason...",
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(8),
                        borderSide: BorderSide(color: Colors.grey.shade400),
                      ),
                      contentPadding: EdgeInsets.all(12),
                    ),
                  ),
                ],
              ),
              actions: [
                TextButton(
                  onPressed: () => Navigator.of(context).pop(),
                  child: Text(
                    "Cancel",
                    style: TextStyle(color: Colors.grey[700]),
                  ),
                ),
                ElevatedButton(
                  onPressed:
                      _reasonController.text.trim().length >= 5
                          ? () {
                            isLate = true;
                            _getLocationAndMarkAttendance();
                            Navigator.of(context).pop();
                          }
                          : null, // disabled if text too short
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.deepPurple,
                    foregroundColor: Colors.white,
                    disabledBackgroundColor: Colors.grey.shade400,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(8),
                    ),
                  ),
                  child: Text("Submit"),
                ),
              ],
            );
          },
        );
      },
    );
  }

  void _showConfirmationDialog() {
    showDialog(
      context: context,
      builder: (context) {
        return AlertDialog(
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(15),
          ),
          title: Text("Close Attendance"),
          content: Text("Are you sure you want to close attendance?"),
          actions: [
            TextButton(
              onPressed: () => Navigator.of(context).pop(),
              child: Text("Cancel"),
            ),
            ElevatedButton(
              onPressed: () {
                Navigator.of(context).pop();
                _getLocationAndMarkAttendance();
              },
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.red,
                foregroundColor: Colors.white,
              ),
              child: Text("Close Attendance"),
            ),
          ],
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('Attendance'),
        backgroundColor: AppColors.primaryColor,
        foregroundColor: Colors.white,
        actions: [
          Padding(
            padding: const EdgeInsets.only(right: 10),
            child: ElevatedButton(
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.white,
                foregroundColor: Colors.teal,
              ),
              onPressed: () {
                Navigator.push(
                  context,
                  MaterialPageRoute(builder: (context) => MyAttendanceScreen()),
                );
              },
              child: Text("My report"),
            ),
          ),
        ],
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          child: Container(
            height: MediaQuery.of(context).size.height,
            decoration: BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.topCenter,
                end: Alignment.bottomCenter,
                colors: [
                  AppColors.primaryColor,
                  AppColors.appBarForegroundColor,
                ],
              ),
            ),
            child: Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  // Text(
                  //   'Ensure that you are at least 20 meters \n  within the specified location.',
                  //   style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                  //   textAlign: TextAlign.center,
                  // ),
                  // SizedBox(height: 20),
                  Icon(Icons.location_on, size: 100, color: Colors.white),
                  SizedBox(height: 30),
                  Container(
                    padding: EdgeInsets.symmetric(vertical: 20, horizontal: 6),
                    decoration: BoxDecoration(
                      color: Colors.white.withOpacity(0.8),
                      borderRadius: BorderRadius.circular(15),
                    ),
                    child:
                        isLoading
                            ? CircularProgressIndicator()
                            : Text(
                              attendanceStatus,
                              style: TextStyle(
                                fontSize: 18,
                                fontWeight: FontWeight.bold,
                              ),
                              textAlign: TextAlign.center,
                            ),
                  ),
                  SizedBox(height: 40),

                  // isme onpressed closed ke lia shi krna h kr lena jb closed ka bna lo..............................
                  if (isAttendanceMarked == false ||
                      isAttendanceClosed == false)
                    ElevatedButton(
                      onPressed:
                          isLoading
                              ? null
                              : isAttendanceMarked
                              ? _showConfirmationDialog
                              : (now.hour > 10)
                              ? _customDialog
                              : (now.hour == 10 && now.minute > 10)
                              ? _customDialog
                              : _getLocationAndMarkAttendance,
                      child:
                          isLoading
                              ? null
                              : Text(
                                isAttendanceMarked
                                    ? "Close Attendance"
                                    : 'Mark Attendance',
                                style: TextStyle(
                                  fontSize: 18,
                                  color: Colors.white,
                                ),
                              ),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.orange,
                        padding: EdgeInsets.symmetric(
                          horizontal: 40,
                          vertical: 15,
                        ),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(30),
                        ),
                      ),
                    ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}
