class Employee {
  final empId;
  final username;
  final email;
  final phone;
  final ename;
  final password;

  Employee({
    this.empId,
    this.username,
    this.email,
    this.phone,
    this.ename,
    this.password,
  });

  factory Employee.fromJson(Map<String, dynamic> json) {
    return Employee(
      empId: json['emp_id'].toString(),
      username: json['username'],
      email: json['email'],
      phone: json['phone'],
      ename: json['ename'],
      password: json['password'],
    );
  }

  Map<String, dynamic> toJson() {
    final Map<String, dynamic> json = {};
    if (email != null) json['email'] = email;
    if (phone != null) json['phone'] = phone;
    if (ename != null) json['ename'] = ename;
    if (password != null) json['password'] = password;
    return json;
  }
}
