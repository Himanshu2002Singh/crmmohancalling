import 'package:calling_crm/models/leads_model.dart';
import 'package:calling_crm/services/api_service.dart';
import 'package:flutter/material.dart';

class LeadProvider with ChangeNotifier {
  List<Leads> _leads = [];
  int _totalLeadsCount = 0;
  int _totalJoinedCount = 0;
  List<Leads> _todayLeads = [];
  List<Leads> _tomorrowLeads = [];
  List<Leads> _selected = [];
  DateTime _lastStartDate = DateTime.now();
  DateTime _lastEndDate = DateTime.now().add(Duration(days: 1));

  // List<Leads> _freshLeads = [];
  bool _isLoading = false;

  List<Leads> get leads => _leads;
  int get totalLeadsCount => _totalLeadsCount;
  int get totalJoinedCount => _totalJoinedCount;
  List<Leads> get todayLeads => _todayLeads;
  List<Leads> get tomorrowLeads => _tomorrowLeads;
  List<Leads> get selected => _selected;

  // int allLeads => _allLeads;
  Future<List<Leads>> get freshLeads async {
    return await ApiService.getFreshLeads();
  }

  bool get isLoading => _isLoading;

  Future<void> fetchLeads({DateTime? start, DateTime? end}) async {
    _isLoading = true;
    notifyListeners();
    try {
      DateTime startDate =
          start ?? DateTime.now().subtract(const Duration(days: 30));
      DateTime endDate = end ?? DateTime.now();
      endDate = endDate.add(Duration(days: 1));
      _leads = await ApiService.fetchLeads(startDate, endDate);
      _lastStartDate = startDate;
      _lastEndDate = endDate;
    } catch (e) {
      print("Error fetching leads: $e");
      _leads = []; // fallback on error
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  // Future<void> fetchFreshLeads() async {
  //   _isLoading = true;
  //   notifyListeners();

  //   _freshLeads = _leads.where((lead) => lead.status == "Fresh Lead").toList();

  //   _isLoading = false;
  //   notifyListeners();
  //   print(_freshLeads);
  // }

  Future<void> fetchAllLeads() async {
    try {
      Map<String, dynamic> data = await ApiService.getLeadsCount();

      _totalLeadsCount = data["totalLeads"] ?? 0;
      _totalJoinedCount = data['totalJoined'] ?? 0;

      _todayLeads =
          (data['todayLeadCount'] as List)
              .map((item) => Leads.fromJson(item))
              .toList();

      _tomorrowLeads =
          (data['tomorrowLeadCount'] as List)
              .map((item) => Leads.fromJson(item))
              .toList();

      _selected =
          (data['interviewSelectedCount'] as List)
              .map((item) => Leads.fromJson(item))
              .toList();
    } catch (e) {
      print("Error fetching all leads: $e");
      _leads = [];
    } finally {
      notifyListeners();
    }
  }

  Future<int> addLead(Leads newLead) async {
    try {
      int newId = await ApiService.addLead(newLead);

      if (newId != -1) {
        DateTime now = DateTime.now();
        if (now.isAfter(_lastStartDate) && now.isBefore(_lastEndDate)) {
          _leads.add(newLead);
        }

        _totalLeadsCount++;

        if (newLead.status == "Interview Selected") {
          _selected.insert(0, newLead);
        }

        DateTime today = DateTime(now.year, now.month, now.day);
        DateTime tomorrow = today.add(Duration(days: 1));

        // 🔁 Convert next_meeting to DateTime (date-only)
        DateTime? nextMeeting;
        try {
          if (newLead.next_meeting is String) {
            final parsed = DateTime.parse(newLead.next_meeting);
            nextMeeting = DateTime(parsed.year, parsed.month, parsed.day);
          } else if (newLead.next_meeting is DateTime) {
            nextMeeting = DateTime(
              newLead.next_meeting.year,
              newLead.next_meeting.month,
              newLead.next_meeting.day,
            );
          }
        } catch (e) {
          print("Invalid next_meeting format: $e");
        }

        if (nextMeeting != null) {
          if (nextMeeting == today) {
            _todayLeads.insert(0, newLead);
          } else if (nextMeeting == tomorrow) {
            _tomorrowLeads.insert(0, newLead);
          }
        }

        notifyListeners();
        return newId;
      }
      return -1;
    } catch (e) {
      print("Error adding lead: $e");
      return -1;
    }
  }

  Future<void> updateLead(Leads updatedLead, int leadId) async {
    print("==============================> updateleadCalled");
    try {
      bool success = await ApiService.updateLead(leadId, updatedLead);
      if (success) {
        final index = _leads.indexWhere((lead) => lead.lead_id == leadId);

        if (index != -1) {
          final oldLead = _leads[index];

          final mergedLead = Leads(
            lead_id: oldLead.lead_id,
            person_id: updatedLead.person_id ?? oldLead.person_id,
            name: updatedLead.name ?? oldLead.name,
            number: updatedLead.number ?? oldLead.number,
            email: updatedLead.email ?? oldLead.email,
            // dob: updatedLead.dob ?? oldLead.dob,
            owner: updatedLead.owner ?? oldLead.owner,
            // branch: updatedLead.branch ?? oldLead.branch,
            // source: updatedLead.source ?? oldLead.source,
            // priority: updatedLead.priority ?? oldLead.priority,
            status: updatedLead.status ?? oldLead.status,
            next_meeting: updatedLead.next_meeting ?? oldLead.next_meeting,
            // refrence: updatedLead.refrence ?? oldLead.refrence,
            description: updatedLead.description ?? oldLead.description,
            address: updatedLead.address ?? oldLead.address,
            // loanType: updatedLead.loanType ?? oldLead.loanType,
            est_salary: updatedLead.est_salary ?? oldLead.est_salary,
            remark: updatedLead.remark ?? oldLead.remark,
            createdAt: oldLead.createdAt,
            employment_type:
                updatedLead.employment_type ?? oldLead.employment_type,
            // loan_term: updatedLead.loan_term ?? oldLead.loan_term,
          );

          // File login handling
          // if (oldLead.status == "File Login" &&
          //     updatedLead.status != "File Login") {
          //   _fileLoginLeads.removeWhere(
          //     (lead) => lead.lead_id == oldLead.lead_id,
          //   );
          // }
          // if (updatedLead.status == "File Login" &&
          //     oldLead.status != "File Login") {
          //   _fileLoginLeads.insert(0, mergedLead);
          // }
          if (oldLead.status != "Joined" && updatedLead.status == "Joined") {
            _totalJoinedCount++;
          }
          if (oldLead.status == "Joined" && updatedLead.status != "Joined") {
            _totalJoinedCount--;
          }
          if (oldLead.status != "Interview Selected" &&
              updatedLead.status == "Interview Selected") {
            _selected.add(updatedLead);
          }
          if (oldLead.status == "Interview Selected" &&
              updatedLead.status != "Interview Selected") {
            _selected.removeWhere((lead) => lead.lead_id == oldLead.lead_id);
          }

          // Replace in _leads
          _leads[index] = mergedLead;

          final now = DateTime.now();
          final today = DateTime(now.year, now.month, now.day);
          final tomorrow = today.add(Duration(days: 1));

          // Helper to get date-only value
          DateTime toDateOnly(dynamic val) {
            if (val is String) {
              final dt = DateTime.parse(val);
              return DateTime(dt.year, dt.month, dt.day);
            } else if (val is DateTime) {
              return DateTime(val.year, val.month, val.day);
            } else {
              throw Exception("Invalid date format");
            }
          }

          if (updatedLead.next_meeting != null) {
            final updatedNextMeetingDate = toDateOnly(updatedLead.next_meeting);

            if (oldLead.next_meeting != null) {
              final oldLeadNextMeetingDate = toDateOnly(oldLead.next_meeting);

              if (oldLeadNextMeetingDate == today) {
                _todayLeads.removeWhere(
                  (lead) => lead.lead_id == oldLead.lead_id,
                );
              }

              if (oldLeadNextMeetingDate == tomorrow) {
                _tomorrowLeads.removeWhere(
                  (lead) => lead.lead_id == oldLead.lead_id,
                );
              }
            }

            if (updatedNextMeetingDate == today) {
              _todayLeads.removeWhere(
                (lead) => lead.lead_id == mergedLead.lead_id,
              );
              _todayLeads.insert(0, mergedLead);
            } else if (updatedNextMeetingDate == tomorrow) {
              _tomorrowLeads.removeWhere(
                (lead) => lead.lead_id == mergedLead.lead_id,
              );
              _tomorrowLeads.insert(0, mergedLead);
            }
          }

          // print("=====================================> lead updated");
          notifyListeners();
        }
      }
    } catch (e) {
      print("Error updating lead: $e");
    }
  }

  Leads? getLeadIfAvailable(var lead_id) {
    // print("=================> provider me dhunda");
    final index = _leads.indexWhere((lead) => lead.lead_id == lead_id);
    if (index != -1) {
      return _leads[index];
    }
    return null;
  }
}
