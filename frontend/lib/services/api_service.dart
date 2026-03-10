import 'dart:convert';

import 'package:calling_crm/constants/server_url.dart';
import 'package:calling_crm/models/calls_model.dart';
import 'package:calling_crm/models/history_model.dart';
import 'package:calling_crm/models/leads_model.dart';
import 'package:calling_crm/models/employee_model.dart';
import 'package:calling_crm/models/task_model.dart';
import 'package:calling_crm/models/template_model.dart';

import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:http/http.dart' as http;
import 'package:intl/intl.dart';

class ApiService {
  static String baseUrl = ServerUrl;

  static final FlutterSecureStorage secureStorage = FlutterSecureStorage();

  // Helper method to get headers with token
  static Future<Map<String, String>> _getHeaders() async {
    final token = await secureStorage.read(key: "auth_token");
    return {
      "Content-Type": "application/json",
      if (token != null) "Authorization": "Bearer $token",
    };
  }

  static Future<Employee> getUserById(String userId) async {
    final url = Uri.parse("$baseUrl/employees/$userId");
    final headers = await _getHeaders();
    final response = await http.get(url, headers: headers);

    if (response.statusCode == 200) {
      final data = jsonDecode(response.body);
      return Employee.fromJson(data);
    } else {
      throw Exception('Failed to fetch User : ${response.body}');
    }
  }

  static Future<bool> updateUser(String userId, Employee employee) async {
    final url = Uri.parse("$baseUrl/update_employee/$userId");
    final headers = await _getHeaders();
    final response = await http.put(
      url,
      headers: headers,
      body: jsonEncode(employee.toJson()),
    );
    if (response.statusCode == 200) {
      print("employee updated: ${response.body}");
      return true;
    } else {
      return false;
    }
  }

  static Future<Employee> login(String username, String password) async {
    final url = Uri.parse('$baseUrl/login');

    final response = await http.post(
      url,
      headers: {"Content-Type": "application/json"},
      body: jsonEncode({'username': username, 'password': password}),
    );

    if (response.statusCode == 200) {
      final data = jsonDecode(response.body);

      final token = data['token'];
      final userJson = data['employee'];

      await secureStorage.write(key: "auth_token", value: token);
      await secureStorage.write(
        key: "userId",
        value: Employee.fromJson(userJson).empId,
      );
      await secureStorage.write(
        key: "loginTime",
        value: DateTime.now().toIso8601String(),
      );

      return Employee.fromJson(userJson);
    } else {
      // Extract error message from backend response
      final errorData = jsonDecode(response.body);
      final errorMessage = errorData['message'] ?? 'Login failed';
      throw Exception(errorMessage);
    }
  }

  static Future<List<Leads>> fetchLeads(
    DateTime startDate,
    DateTime endDate,
  ) async {
    final emp_id = await secureStorage.read(key: "userId");

    // Set default values if dates are null
    final url = Uri.parse("$baseUrl/getLeadsByEmpIdAndDate/$emp_id").replace(
      queryParameters: {
        'startDate': DateFormat('yyyy-MM-dd').format(startDate),
        'endDate': DateFormat('yyyy-MM-dd').format(endDate),
      },
    );
    final headers = await _getHeaders();
    final response = await http.get(url, headers: headers);

    if (response.statusCode == 200) {
      List jsonData = jsonDecode(response.body);
      return jsonData.map((e) => Leads.fromJson(e)).toList();
    } else {
      throw Exception("Failed to load leads");
    }
  }

  static Future<int> addLead(Leads lead) async {
    final url = Uri.parse("$baseUrl/submit-lead");
    final headers = await _getHeaders();
    final response = await http.post(
      url,
      headers: headers,
      body: jsonEncode(lead.toJson()),
    );

    if (response.statusCode == 200) {
      // print("lead added : ${response.body}");
      final Map<String, dynamic> jsonData = jsonDecode(response.body);
      // print(
      //   "===========================================>>>>>>>>>${jsonData['id']}",
      // );
      // print("==================================>>>>${response.body[1]}");
      return jsonData['id'];
    } else {
      print("failed : ${response.body}");
      return -1;
    }
  }

  static Future<bool> updateLead(int id, Leads lead) async {
    final url = Uri.parse(
      "$baseUrl/leads/$id",
    ); // assuming backend uses /leads/:id
    final headers = await _getHeaders();
    final response = await http.put(
      url,
      headers: headers,
      body: jsonEncode(lead.toJson()),
    );

    if (response.statusCode == 200) {
      print("Lead updated: ${response.body}");
      return true;
    } else {
      return false;
    }
  }

  static Future<Map<String, dynamic>> getLeadsCount() async {
    final emp_id = await secureStorage.read(key: "userId");
    final url = Uri.parse("$baseUrl/getCountsByEmpId/$emp_id");
    final headers = await _getHeaders();
    final response = await http.get(url, headers: headers);

    if (response.statusCode == 200) {
      final Map<String, dynamic> jsonData = jsonDecode(response.body);
      return {
        'totalLeads': jsonData['totalLeads'] ?? 0,
        'totalJoined': jsonData['totalJoined'] ?? 0,
        'interviewSelectedCount': jsonData['interviewSelectedCount'],
        'todayLeadCount': jsonData['todayLineups'] ?? [],
        'tomorrowLeadCount': jsonData['tomorrowLineups'] ?? [],
      };
    } else {
      throw Exception("Failed to fetch leads count");
    }
  }

  static Future<List<Leads>> getFreshLeads() async {
    final emp_id = await secureStorage.read(key: "userId");
    final url = Uri.parse("$baseUrl/getFreshLeadsByEmpId/$emp_id");
    final headers = await _getHeaders();
    final response = await http.get(url, headers: headers);
    if (response.statusCode == 200) {
      final List jsonData = jsonDecode(response.body);
      return jsonData.map((json) => Leads.fromJson(json)).toList();
    } else {
      print("${response.statusCode} error fetching fresh leads");
      return [];
    }
  }

  static Future<Leads> getLeadByLeadId(var leadId) async {
    final url = Uri.parse("$baseUrl/getLead/$leadId");
    final headers = await _getHeaders();
    final response = await http.get(url, headers: headers);
    if (response.statusCode == 200) {
      final jsonData = jsonDecode(response.body);
      return Leads.fromJson(jsonData);
    } else {
      print("${response.statusCode} error fetching lead");
      return Leads();
    }
  }

  static Future<Leads> getLeadByNumber(var number) async {
    final url = Uri.parse("$baseUrl/getLeadByNumber/$number");
    final headers = await _getHeaders();
    final response = await http.get(url, headers: headers);
    if (response.statusCode == 200) {
      if (response.body == "null") {
        return Leads();
      } else {
        final jsonData = jsonDecode(response.body);
        return Leads.fromJson(jsonData);
      }
    } else {
      print("${response.statusCode} error fetching lead by number");
      return Leads();
    }
  }

  static Future<bool> addHistory(History history) async {
    final url = Uri.parse("$baseUrl/histories");
    final headers = await _getHeaders();
    final response = await http.post(
      url,
      headers: headers,
      body: jsonEncode(history.toJson()),
    );
    if (response.statusCode == 200) {
      print("history added : ${response.body}");
      return true;
    } else {
      print("failed : ${response.body}");
      return false;
    }
  }

  static Future<List<History>> getHistory(int id) async {
    final url = Uri.parse("$baseUrl/histories/$id");
    final headers = await _getHeaders();
    final response = await http.get(url, headers: headers);

    if (response.statusCode == 200) {
      final Map<String, dynamic> jsonData = jsonDecode(response.body);
      final List historyList = jsonData['history'];
      return historyList.map((e) => History.fromJson(e)).toList();
    } else {
      throw Exception("Failed to load history");
    }
  }

  static Future<Calls?> addCalls(Calls call) async {
    final url = Uri.parse("$baseUrl/calls");
    final headers = await _getHeaders();
    final response = await http.post(
      url,
      headers: headers,
      body: jsonEncode(call.toJson()),
    );

    if (response.statusCode == 200 || response.statusCode == 201) {
      print("Call added: ${response.body}");
      final Map<String, dynamic> jsonData = jsonDecode(response.body);
      print(jsonData['call_id']);
      return Calls.fromJson(jsonData);
    } else {
      print("Failed: ${response.body}");
      return null;
    }
  }

  static Future<List<Calls>> getCalls() async {
    final emp_id = await secureStorage.read(key: "userId");
    final url = Uri.parse("$baseUrl/calls/$emp_id");
    final headers = await _getHeaders();
    final response = await http.get(url, headers: headers);
    if (response.statusCode == 200) {
      final Map<String, dynamic> jsonData = jsonDecode(response.body);
      final List callList = jsonData['calls'];
      return callList.map((e) => Calls.fromJson(e)).toList();
    } else {
      throw Exception("Failed to load Calls");
    }
  }

  static Future<List<Calls>> getCallsByDates(
    DateTime startDate,
    DateTime endDate,
  ) async {
    final emp_id = await secureStorage.read(key: "userId");
    final formattedStart =
        "${startDate.year}-${startDate.month.toString().padLeft(2, '0')}-${startDate.day.toString().padLeft(2, '0')}";
    final formattedEnd =
        "${endDate.year}-${endDate.month.toString().padLeft(2, '0')}-${endDate.day.toString().padLeft(2, '0')}";

    final url = Uri.parse("$baseUrl/callsByEmpIdAndDate/$emp_id").replace(
      queryParameters: {'startDate': formattedStart, 'endDate': formattedEnd},
    );
    final headers = await _getHeaders();
    final response = await http.get(url, headers: headers);

    if (response.statusCode == 200) {
      final Map<String, dynamic> jsonData = jsonDecode(response.body);
      final List callList = jsonData['calls'];
      return callList.map((e) => Calls.fromJson(e)).toList();
    } else {
      throw Exception("Failed to load Calls");
    }
  }

  static Future<bool> updateCall(Calls call, int callId) async {
    final url = Uri.parse("$baseUrl/updateCall/$callId");
    final headers = await _getHeaders();
    final response = await http.put(
      url,
      headers: headers,
      body: jsonEncode(call.toJson()),
    );
    if (response.statusCode == 200) {
      print("Call updated: ${response.body}");
      return true;
    } else {
      return false;
    }
  }

  static Future<Map<String, int>> getTotalCallsCount() async {
    final emp_id = await secureStorage.read(key: "userId");
    final url = Uri.parse("$baseUrl/totalCallsCountByEmployee/$emp_id");
    final headers = await _getHeaders();
    final response = await http.get(url, headers: headers);

    if (response.statusCode == 200) {
      final data = jsonDecode(response.body);
      return {'total': data['total'] ?? 0, 'today': data['today'] ?? 0};
    } else {
      print("Failed to get total calls count. Status: ${response.statusCode}");
      return {'total': 0, 'today': 0};
    }
  }

  static Future<List<Calls>> filterCalls({
    required DateTime startDate,
    required DateTime endDate,
    String? status,
    String? loanType,
  }) async {
    final emp_id = await secureStorage.read(key: "userId");
    try {
      final queryParameters = {
        "startDate": startDate.toIso8601String(),
        "endDate": endDate.toIso8601String(),
        if (status != null && status != "All") "status": status,
        if (loanType != null && loanType != "All") "loanType": loanType,
      };

      final uri = Uri.parse(
        "$baseUrl/filterCalls/${emp_id}",
      ).replace(queryParameters: queryParameters);
      final headers = await _getHeaders();
      final response = await http.get(uri, headers: headers);

      if (response.statusCode == 200) {
        final List<dynamic> jsonData = jsonDecode(response.body);
        return jsonData.map((e) => Calls.fromJson(e)).toList();
      } else {
        throw Exception("Failed to load filtered calls");
      }
    } catch (e) {
      print("Error in filterCalls API: $e");
      return [];
    }
  }

  static Future<Task?> addTask(Task task) async {
    final url = Uri.parse("$baseUrl/add_task");
    final headers = await _getHeaders();
    final response = await http.post(
      url,
      headers: headers,
      body: jsonEncode(task.toJson()),
    );

    if (response.statusCode == 200) {
      final jsonData = jsonDecode(response.body);
      print("Task added successfully: ${jsonData}");
      if (jsonData['task'] != null) {
        return Task.fromJson(jsonData['task']);
      } else {
        print("No 'task' key found in response");
        return null;
      }
    } else {
      print("Task add failed: ${response.statusCode} - ${response.body}");
      return null;
    }
  }

  static Future<List<Task>> getTasks() async {
    final emp_id = await secureStorage.read(key: "userId");
    final url = Uri.parse("$baseUrl/task/$emp_id");
    final headers = await _getHeaders();
    final response = await http.get(url, headers: headers);
    if (response.statusCode == 200) {
      final Map<String, dynamic> jsonData = jsonDecode(response.body);
      final List taskList = jsonData['tasks'];
      return taskList.map((e) => Task.fromJson(e)).toList();
    } else {
      throw Exception("Failed to load Tasks");
    }
  }

  static Future<List<Task>> getTasksByLeadId(int lead_id) async {
    final url = Uri.parse("$baseUrl/task_by_lead_id/$lead_id");
    final headers = await _getHeaders();
    final response = await http.get(url, headers: headers);
    if (response.statusCode == 200) {
      final Map<String, dynamic> jsonData = jsonDecode(response.body);
      final List taskList = jsonData['tasks'];
      return taskList.map((e) => Task.fromJson(e)).toList();
    } else {
      throw Exception("Failed to load Tasks");
    }
  }

  static Future<Task> updateTask(
    String taskId,
    Map<String, dynamic> updatedFields,
  ) async {
    final url = Uri.parse("$baseUrl/update_task/$taskId");
    final headers = await _getHeaders();
    final response = await http.put(
      url,
      headers: headers,
      body: jsonEncode(updatedFields),
    );

    if (response.statusCode == 200) {
      final data = jsonDecode(response.body);
      return Task.fromJson(data["task"]);
    } else {
      print("Update failed: ${response.body}");
      return Task();
    }
  }

  static Future<bool> deleteTask(String taskId) async {
    try {
      final url = Uri.parse('$baseUrl/deleteTask/$taskId');
      final headers = await _getHeaders();
      final response = await http.delete(url, headers: headers);

      if (response.statusCode == 200) {
        return true;
      } else {
        print("Failed to delete task: ${response.body}");
        return false;
      }
    } catch (e) {
      print("Error deleting task: $e");
      return false;
    }
  }

  static Future<List<Template>> getTemplates() async {
    final url = Uri.parse("$baseUrl/get_templates");
    final headers = await _getHeaders();
    final response = await http.get(url, headers: headers);
    if (response.statusCode == 200) {
      final jd = jsonDecode(response.body);
      final List jsonData = jd['data'] as List<dynamic>;
      return jsonData.map((e) => Template.fromJson(e)).toList();
    } else {
      throw Exception("Failed to load templates");
    }
  }

  // Check if admin's subscription is active
  static Future<Map<String, dynamic>> checkSubscriptionStatus() async {
    final token = await secureStorage.read(key: "auth_token");
    if (token == null) {
      return {"is_active": false, "message": "Not logged in"};
    }

    final url = Uri.parse("$baseUrl/check-subscription");
    final response = await http.get(
      url,
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer $token",
      },
    );

    if (response.statusCode == 200) {
      final data = jsonDecode(response.body);
      return {
        "is_active": data['is_active'] ?? false,
        "message": data['message'] ?? '',
      };
    } else {
      return {"is_active": false, "message": "Failed to check subscription"};
    }
  }

  // Clear all stored data (for logout)
  static Future<void> clearAllData() async {
    await secureStorage.delete(key: "auth_token");
    await secureStorage.delete(key: "userId");
    await secureStorage.delete(key: "loginTime");
  }
}
