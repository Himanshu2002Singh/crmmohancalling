class History {
  final history_id;
  final lead_id;
  final owner;
  final next_meeting;
  final status;
  // final loanType;
  final remark;
  final createdAt;

  History({
    this.history_id,
    this.lead_id,
    this.owner,
    this.next_meeting,
    this.status,
    // this.loanType,
    this.remark,
    this.createdAt,
  });

  Map<String, dynamic> toJson() {
    final Map<String, dynamic> json = {};
    if (lead_id != null) json["lead_id"] = lead_id;
    if (owner != null) json["owner"] = owner;
    if (owner != null) json["next_meeting"] = next_meeting;
    if (status != null) json["status"] = status;
    // if (loanType != null) json["loanType"] = loanType;
    if (remark != null) json["remark"] = remark;
    return json;
  }

  factory History.fromJson(Map<String, dynamic> json) {
    return History(
      lead_id: json['lead_id'],
      owner: json["owner"] ?? "",
      next_meeting: json["next_meeting"] ?? "",
      status: json["status"] ?? "",
      // loanType: json["loanType"] ?? "",
      remark: json["remark"] ?? "",
      createdAt: json["createdAt"] ?? "",
    );
  }
}
