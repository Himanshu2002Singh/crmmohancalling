import 'package:calling_crm/models/history_model.dart';
import 'package:calling_crm/services/api_service.dart';
import 'package:flutter/widgets.dart';

class HistoryProvider with ChangeNotifier {
  List<History> _history = [];
  List<History> get history => _history;

  Future<void> addHistory(History history) async {
    try {
      bool success = await ApiService.addHistory(history);
      if (success) {
        _history.add(history);
      }
    } catch (e) {
      print(e);
    } finally {
      notifyListeners();
    }
  }
  // await ApiService.addHistory(newHistory);

  Future<void> fetchHistory(leadId) async {
    try {
      _history = await ApiService.getHistory(leadId);
    } catch (e) {
      print("Error fetching calls: $e");
    } finally {
      notifyListeners();
    }
  }
}
