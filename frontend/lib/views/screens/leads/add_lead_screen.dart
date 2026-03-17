import 'dart:io';
import 'package:calling_crm/controllers/providers/history_provider.dart';
import 'package:calling_crm/controllers/providers/lead_provider.dart';
import 'package:calling_crm/models/history_model.dart';
import 'package:calling_crm/models/leads_model.dart';
import 'package:calling_crm/services/api_service.dart';
import 'package:calling_crm/theme/appcolors.dart';
import 'package:calling_crm/views/screens/leads/leads_screen.dart';
import 'package:calling_crm/views/widgets/custom_button.dart';
import 'package:file_picker/file_picker.dart';
import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'package:provider/provider.dart';

class AddLeadScreen extends StatefulWidget {
  String userId;
  String userName;
  final title;
  final lead_id;
  var contactName;
  var contactNumber;
  // var email;
  // var branch;
  // var source;
  // var priority;
  var status;
  var next_meeting;
  // var refrence;
  var remark;
  var description;
  var address;
  // var loanType;
  // var dob;
  var expectedSalary;
  var employmentType;
  var company_name;
  AddLeadScreen({
    super.key,
    required this.title,
    required this.userId,
    required this.userName,
    this.lead_id,
    this.contactName,
    this.contactNumber,
    // this.email,
    // this.branch,
    // this.source,
    this.address,
    this.description,
    this.next_meeting,
    // this.priority,
    // this.refrence,
    this.remark,
    this.status,
    // this.loanType,
    // this.dob,
    this.expectedSalary,
    this.employmentType,
    this.company_name,
  });

  @override
  State<AddLeadScreen> createState() => _AddLeadScreenState();
}

class _AddLeadScreenState extends State<AddLeadScreen> {
  final TextEditingController contactNameController = TextEditingController();
  final TextEditingController contactNumberController = TextEditingController();
  // final TextEditingController emailController = TextEditingController();
  final TextEditingController ownerController = TextEditingController();
  // final TextEditingController referenceController = TextEditingController();
  final TextEditingController descriptionController = TextEditingController();
  // final TextEditingController loanPercentageController =
  //     TextEditingController();
  // TextEditingController branchController = TextEditingController();
  // TextEditingController sourceController = TextEditingController();
  // TextEditingController levelController = TextEditingController();
  TextEditingController statusController = TextEditingController();
  TextEditingController nextMeetingTimeController = TextEditingController();
  // TextEditingController loanTypeController = TextEditingController();
  TextEditingController addressController = TextEditingController();
  // TextEditingController dobController = TextEditingController();
  TextEditingController expectedSalaryController = TextEditingController();
  TextEditingController employmentTypeController = TextEditingController();
  TextEditingController companyNameController = TextEditingController();
  TextEditingController remarkController = TextEditingController();
  // File? lastSalaryController;
  // File? cibilController;
  // File? identityController;
  // File? fileDetailsController;

  // List<String> branchOptions = ["Default"];
  // List<String> sourceOptions = [
  //   // "Internet",
  //   // "Newspaper",
  //   // "Website",
  //   "Self",
  //   "Refrence",
  //   "Bulk excel",
  // ];
  // List<String> levelOptions = [
  //   // "Lower",
  //   // "Mid",
  //   // "Important",
  //   // "High Priority and Important",
  //   "Priority",
  //   "Non-Priority",
  // ];
  List<String> statusOptions = [
    "Fresh Lead",
    "Interested",
    "Call Back",
    "Not Interested",
    "Follow up",
    "LineUp",
    "LineUp Dropout",
    "Interview Rejected",
    "Interview Pending",
    "Interview Done",
    "Interview Selected",
    "Joined",
    "1 Month Completed",
    "2 Months Completed",
    "3 Months Completed",
    "Other",
  ];
  // List<String> loanType = [
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
  List<String> employmentType = ["Full Time", "Internship", "Contract Basis"];
  // List<String> loanTerm = ["Monthly", "Yearly"];

  void handleSubmit() async {
    int idOfLead;
    if (contactNameController.text.isEmpty ||
        contactNumberController.text.isEmpty) {
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(SnackBar(content: Text("Name and Number can't be null")));
    } else {
      Leads lead = Leads(
        person_id: widget.userId,
        name: contactNameController.text,
        number: contactNumberController.text,
        // email: emailController.text,
        owner: ownerController.text,
        // branch: branchController.text,
        // source: sourceController.text,
        // priority: levelController.text,
        status: statusController.text,
        next_meeting: nextMeetingTimeController.text,
        // refrence: referenceController.text,
        remark: remarkController.text,
        description: descriptionController.text,
        address: addressController.text,
        // loanType: loanTypeController.text,
        // dob: dobController.text,
        employment_type: employmentTypeController.text,
        company_name: companyNameController.text,
        est_salary: expectedSalaryController.text,
      );
      Leads oldLead = await ApiService.getLeadByNumber(
        contactNumberController.text,
      );
      if (widget.title == "Add Lead") {
        if (oldLead.lead_id != null) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text("Lead with this number already exists")),
          );
          return;
        }
        // print("==============================>${oldLead.lead_id}");
        int newLeadId = await Provider.of<LeadProvider>(
          context,
          listen: false,
        ).addLead(lead);
        idOfLead = newLeadId;
      } else {
        if (oldLead.lead_id != widget.lead_id) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text("You cannot assign this number to this lead"),
            ),
          );
          return;
        }
        Provider.of<LeadProvider>(
          context,
          listen: false,
        ).updateLead(lead, widget.lead_id);
        idOfLead = widget.lead_id;
      }
      // print("=======================================> $UpdaidOfLead");
      History newHistory = History(
        lead_id: idOfLead,
        owner: ownerController.text,
        next_meeting: nextMeetingTimeController.text,
        status: statusController.text,
        // loanType: loanTypeController.text,
        remark: remarkController.text,
      );
      Provider.of<HistoryProvider>(
        context,
        listen: false,
      ).addHistory(newHistory);
      // bool success1 =
      //     widget.title == "Add Lead"
      //         ? await ApiService.addLead(lead)
      //         : await ApiService.updateLead(widget.lead_id, lead);
      // print("=========================================> ${dobController.text}");

      // Provider.of<LeadProvider>(context, listen: false).addLead(lead);
      // ScaffoldMessenger.of(
      //   context,
      // ).showSnackBar(SnackBar(content: Text(success1 ? "success" : "Error")));
      // handleSubmission2(idOfLead);
      Navigator.pushReplacement(
        context,
        MaterialPageRoute(builder: (context) => LeadsScreen()),
      );
    }
  }

  // void handleSubmission2(int idOfLead) async {
  //   // List<Leads> leads = Provider.of<LeadProvider>(context, listen: false).leads;
  //   if (contactNameController.text.isEmpty ||
  //       contactNumberController.text.isEmpty) {
  //     ScaffoldMessenger.of(
  //       context,
  //     ).showSnackBar(SnackBar(content: Text("Name and Number can't be null")));
  //   } else {
  //     History newHistory = History(
  //       lead_id: idOfLead,
  //       owner: ownerController.text,
  //       next_meeting: nextMeetingTimeController.text,
  //       status: statusController.text,
  //     );
  //     Provider.of<HistoryProvider>(
  //       context,
  //       listen: false,
  //     ).addHistory(newHistory);
  //   }
  // }

  @override
  void initState() {
    // TODO: implement initState
    super.initState();
    ownerController.text = widget.userName;
    // levelController.text = "Lower";

    contactNameController.text =
        widget.contactName == null ? "" : widget.contactName;

    contactNumberController.text =
        widget.contactNumber == null ? "" : widget.contactNumber;
    // emailController.text = widget.email == null ? "" : widget.email;
    // // branchController.text = widget.branch == null ? "" : widget.branch;
    // sourceController.text = widget.source == null ? "" : widget.source;
    // levelController.text = widget.priority == null ? "" : widget.priority;
    statusController.text = widget.status == null ? "" : widget.status;
    nextMeetingTimeController.text =
        widget.next_meeting == null ? "" : widget.next_meeting;
    // referenceController.text = widget.refrence == null ? "" : widget.refrence;
    remarkController.text = widget.remark == null ? "" : widget.remark;
    descriptionController.text =
        widget.description == null ? "" : widget.description;
    addressController.text = widget.address == null ? "" : widget.address;
    // loanTypeController.text = widget.loanType == null ? "" : widget.loanType;
    // dobController.text = widget.dob == null ? "" : widget.dob;
    // loanAmountController.text =
    //     widget.loanAmount == null ? "" : widget.loanAmount;
    // LoanTermController.text = widget.loanTerm == null ? "" : widget.loanTerm;
    employmentTypeController.text =
        widget.employmentType == null ? "" : widget.employmentType;
  }

  @override
  void dispose() {
    contactNameController.dispose();
    ownerController.dispose();
    // referenceController.dispose();
    descriptionController.dispose();
    remarkController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(widget.title),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () => Navigator.pop(context),
        ),
        backgroundColor: Colors.lightBlue,
        foregroundColor: Colors.white,
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const SectionTitle(title: "Contact Details"),
              const SizedBox(height: 8),
              CustomTextField(
                hint: "Contact Name",
                controller: contactNameController,
                maxLine: 1,
              ),
              SizedBox(height: 12),
              CustomTextField(
                hint: "Contact Number",
                controller: contactNumberController,
                keyboardType: TextInputType.phone,
                maxLine: 1,
              ),
              const SizedBox(height: 16),

              // CustomTextField(hint: "Email", controller: emailController),
              // const SizedBox(height: 12),
              const SectionTitle(title: "Candidate Other Details"),
              // const SizedBox(height: 8),

              // CustomTextField(hint: "Owner", controller: ownerController),
              // const SizedBox(height: 12),
              // CustomDropdown(
              //   hint: "-- Select Branch --",
              //   options: branchOptions,
              //   onChange: (value) {
              //     branchController.text = value;
              //   },
              // ),
              // const SizedBox(height: 12),
              // CustomDropdown(
              //   hint:
              //       widget.source == null || widget.source.isEmpty
              //           ? "-- Select Source --"
              //           : widget.source,
              //   options: sourceOptions,
              //   onChange: (value) {
              //     sourceController.text = value;
              //   },
              // ),
              // const SizedBox(height: 12),
              // const SizedBox(height: 12),
              // CustomDropdown(
              //   hint:
              //       widget.priority == null || widget.priority.isEmpty
              //           ? "Non-Priority"
              //           : widget.priority,
              //   options: levelOptions,
              //   onChange: (value) {
              //     levelController.text = value;
              //   },
              // ),
              const SizedBox(height: 12),
              if (widget.title == "Add Lead")
                CustomDropdown(
                  hint: widget.status == null ? "Select Status" : widget.status,
                  options: statusOptions,
                  onChange: (value) {
                    setState(() {
                      statusController.text = value;
                    });
                  },
                ),
              if (widget.title == "Add Lead") const SizedBox(height: 12),

              if (widget.title == "Add Lead")
                if (statusController.text != "Not Interested")
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
                          nextMeetingTimeController.text =
                              finalDateTime.toString();
                          // OR use intl package for prettier format:
                          // nextMeetingTimeController.text = DateFormat('yyyy-MM-dd HH:mm').format(finalDateTime);
                        }
                      }
                    },
                    child: AbsorbPointer(
                      child: TextFormField(
                        controller: nextMeetingTimeController,
                        decoration: InputDecoration(
                          hintText: 'Select Next Calling Date',
                          border: OutlineInputBorder(),
                        ),
                      ),
                    ),
                  ),
              if (widget.title == "Add Lead")
                if (statusController.text != "Not Interested")
                  SizedBox(height: 12),

              const SizedBox(height: 12),
              CustomTextField(hint: "Remark", controller: remarkController),

              const SizedBox(height: 12),
              CustomTextField(
                hint: "Description",
                controller: descriptionController,
              ),
              const SizedBox(height: 12),

              CustomTextField(
                hint: "Address",
                controller: addressController,
                maxLine: null,
              ),

              const SizedBox(height: 20),

              const SectionTitle(title: "Company Dynamic Questions"),
              const SizedBox(height: 20),

              // GestureDetector(
              //   onTap: () async {
              //     DateTime? pickedDate = await showDatePicker(
              //       context: context,
              //       initialDate: DateTime.now(),
              //       firstDate: DateTime(1900),
              //       lastDate: DateTime.now(),
              //     );
              //     if (pickedDate != null) {
              //       dobController.text =
              //           pickedDate.toLocal().toString().split(
              //             ' ',
              //           )[0]; // or use DateFormat
              //     }
              //   },
              //   child: AbsorbPointer(
              //     child: TextFormField(
              //       controller: dobController,
              //       decoration: InputDecoration(
              //         hintText: 'Select Date of Birth',
              //         border: OutlineInputBorder(),
              //       ),
              //     ),
              //   ),
              // ),
              CustomTextField(
                hint: "CompanyName",
                controller: companyNameController,
              ),
              const SizedBox(height: 16),
              CustomTextField(
                hint: "Enter Expected Salary",
                controller: expectedSalaryController,
                maxLine: 1,
              ),
              const SizedBox(height: 16),
              CustomDropdown(
                hint:
                    widget.employmentType == null
                        ? "Employment Type"
                        : widget.employmentType,
                options: employmentType,
                onChange: (value) {
                  setState(() {
                    employmentTypeController.text = value;
                  });
                },
              ),
              const SizedBox(height: 16),
              // CustomDropdown(
              //   hint: widget.loanTerm == null ? "Loan Term" : widget.loanTerm,
              //   options: loanTerm,
              //   onChange: (value) {
              //     setState(() {
              //       LoanTermController.text = value;
              //     });
              //   },
              // ),
              const SizedBox(height: 16),
              // CustomDropdown(
              //   hint:
              //       widget.loanType == null || widget.loanType.isEmpty
              //           ? "--Loan Type--"
              //           : widget.loanType,
              //   options: loanType,
              //   onChange: (value) {
              //     loanTypeController.text = value;
              //   },
              // ),
              // SizedBox(height: 10),
              // addDocumentContainer(
              //   documentName: "Last 3 months Salary",
              //   onFileSelected: (file) {
              //     setState(() {
              //       lastSalaryController = file;
              //     });
              //   },
              // ),
              // SizedBox(height: 10),
              // addDocumentContainer(
              //   documentName: "Cibil Score",
              //   onFileSelected: (file) {
              //     setState(() {
              //       cibilController = file;
              //     });
              //   },
              // ),
              // SizedBox(height: 10),
              // addDocumentContainer(
              //   documentName: "Identity Proof",
              //   onFileSelected: (file) {
              //     setState(() {
              //       identityController = file;
              //     });
              //   ),
              // ),
              // SizedBox(height: 10),
              // addDocumentContainer(
              //   documentName: "File Details",
              //   onFileSelected: (file) {
              //     setState(() {
              //       fileDetailsController = file;
              //     });
              //   ),
              // ),
              // SizedBox(height: 10),
              // CustomTextField(
              //   hint: "Enter Loan Percentage",
              //   controller: loanPercentageController,
              //   keyboardType: TextInputType.number,
              // ),
              // SizedBox(height: 20),
              CustomButton(
                text: widget.title,
                onPressed: () {
                  handleSubmit();
                },
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class SectionTitle extends StatelessWidget {
  final String title;
  const SectionTitle({super.key, required this.title});

  @override
  Widget build(BuildContext context) {
    return Text(
      title,
      style: const TextStyle(
        fontWeight: FontWeight.bold,
        fontSize: 16,
        fontStyle: FontStyle.italic,
      ),
    );
  }
}

class CustomTextField extends StatelessWidget {
  final String hint;
  final TextEditingController controller;
  final keyboardType;
  final maxLine;
  const CustomTextField({
    super.key,
    required this.hint,
    required this.controller,
    this.keyboardType,
    this.maxLine,
  });

  @override
  Widget build(BuildContext context) {
    return TextField(
      controller: controller,
      keyboardType: keyboardType,
      maxLines: maxLine,
      decoration: InputDecoration(
        hintText: hint,
        border: const OutlineInputBorder(),

        contentPadding: const EdgeInsets.symmetric(
          horizontal: 12,
          vertical: 10,
        ),
      ),
    );
  }
}

class CustomDropdown extends StatelessWidget {
  final String hint;
  final List<String> options;
  final onChange;
  const CustomDropdown({
    super.key,
    required this.hint,
    required this.options,
    required this.onChange,
  });

  @override
  Widget build(BuildContext context) {
    return DropdownButtonFormField<String>(
      items:
          options.map((String value) {
            return DropdownMenuItem<String>(value: value, child: Text(value));
          }).toList(),
      onChanged: (value) {
        onChange(value);
      },
      decoration: InputDecoration(
        hintText: hint,
        border: const OutlineInputBorder(),
        contentPadding: const EdgeInsets.symmetric(
          horizontal: 12,
          vertical: 10,
        ),
      ),
    );
  }
}

// class addDocumentContainer extends StatefulWidget {
//   final documentName;
//   final Function(File?) onFileSelected;

//   addDocumentContainer({
//     super.key,
//     required this.documentName,
//     required this.onFileSelected,
//   });

//   @override
//   State<addDocumentContainer> createState() => _addDocumentContainerState();
// }

// class _addDocumentContainerState extends State<addDocumentContainer> {
//   File? _file;
//   String? _filePath;
//   String? _fileName;

//   @override
//   Widget build(BuildContext context) {
//     return InkWell(
//       onTap: () {
//         customDialogBox();
//       },
//       child: Container(
//         width: MediaQuery.of(context).size.width,
//         height: MediaQuery.of(context).size.height / 4,
//         padding: EdgeInsets.all(10),
//         decoration: BoxDecoration(
//           border: Border.all(
//             color: Colors.black,
//             width: 1,
//             style: BorderStyle.solid,
//           ),
//           borderRadius: BorderRadius.circular(10),
//         ),
//         child: Column(
//           mainAxisAlignment: MainAxisAlignment.spaceEvenly,
//           children: [
//             _file != null
//                 ? Image.file(_file!, width: 100, height: 140, fit: BoxFit.cover)
//                 : Icon(
//                   Icons.add_circle,
//                   color: AppColors.primaryColor,
//                   size: 100,
//                 ),

//             Text(
//               _fileName != null ? _fileName : widget.documentName,
//               style: TextStyle(fontSize: 17, color: Colors.grey),
//             ),
//           ],
//         ),
//       ),
//     );
//   }

  // Future<void> _takePicture() async {
  //   final ImagePicker picker = ImagePicker();
  //   final XFile? photo = await picker.pickImage(source: ImageSource.camera);

  //   if (photo != null) {
  //     setState(() {
  //       _file = File(photo.path); // Just keep in memory, don't save permanently
  //     });
  //     widget.onFileSelected(_file);
  //   }
  // }

  // Future<void> _pickImageFromGallery() async {
  //   final ImagePicker picker = ImagePicker();
  //   final XFile? image = await picker.pickImage(source: ImageSource.gallery);

  //   if (image != null) {
  //     setState(() {
  //       _file = File(image.path); // Temporarily hold in memory
  //     });
  //     widget.onFileSelected(_file);
  //   }
  // }

  // Future<void> _pickPdfFile() async {
  //   final result = await FilePicker.platform.pickFiles(
  //     type: FileType.custom,
  //     allowedExtensions: ['pdf'],
  //   );

  //   if (result != null && result.files.single.path != null) {
  //     setState(() {
  //       _fileName = result.files.single.name;
  //       _filePath = result.files.single.path;
  //       _file = File(_filePath!);
  //     });
  //     widget.onFileSelected(_file);

  //     // print('Picked file: $_filePath');
  //   }
  // }

  // Future<dynamic> customDialogBox() {
  //   return showDialog(
  //     context: context,
  //     builder: (context) {
  //       return Dialog(
  //         backgroundColor: Colors.white,
  //         child: Column(
  //           mainAxisAlignment: MainAxisAlignment.center,
  //           mainAxisSize: MainAxisSize.min,
  //           children: [
  //             InkWell(
  //               child: Container(
  //                 width: MediaQuery.of(context).size.width,
  //                 padding: EdgeInsets.all(10),
  //                 decoration: BoxDecoration(
  //                   border: Border(
  //                     bottom: BorderSide(
  //                       color: Colors.black,
  //                       width: 1,
  //                       style: BorderStyle.solid,
  //                     ),
  //                   ),
  //                 ),
  //                 child: Text(
  //                   textAlign: TextAlign.center,
  //                   "Take a picture",
  //                   style: TextStyle(fontWeight: FontWeight.bold),
  //                 ),
  //               ),
  //               onTap: () {
  //                 _takePicture();
  //                 Navigator.pop(context);
  //               },
  //             ),
  //             InkWell(
  //               child: Container(
  //                 width: MediaQuery.of(context).size.width,
  //                 padding: EdgeInsets.all(10),
  //                 decoration: BoxDecoration(
  //                   border: Border(
  //                     bottom: BorderSide(
  //                       color: Colors.black,
  //                       width: 1,
  //                       style: BorderStyle.solid,
  //                     ),
  //                   ),
  //                 ),
  //                 child: Text(
  //                   textAlign: TextAlign.center,
  //                   "Choose a picture",
  //                   style: TextStyle(fontWeight: FontWeight.bold),
  //                 ),
  //               ),
  //               onTap: () {
  //                 _pickImageFromGallery();
  //                 Navigator.pop(context);
  //               },
  //             ),

  //             InkWell(
  //               child: Container(
  //                 width: MediaQuery.of(context).size.width,
  //                 padding: EdgeInsets.all(10),
  //                 decoration: BoxDecoration(
  //                   border: Border(
  //                     bottom: BorderSide(
  //                       color: Colors.black,
  //                       width: 1,
  //                       style: BorderStyle.solid,
  //                     ),
  //                   ),
  //                 ),

  //                 child: Text(
  //                   textAlign: TextAlign.center,
  //                   "Choose a PDF",
  //                   style: TextStyle(fontWeight: FontWeight.bold),
  //                 ),
  //               ),
  //               onTap: () {
  //                 _pickPdfFile();
  //                 Navigator.pop(context);
  //               },
  //             ),
  //             InkWell(
  //               child: Container(
  //                 padding: EdgeInsets.all(10),
  //                 width: MediaQuery.of(context).size.width,
  //                 // color: AppColors.primaryColor,
  //                 child: Text(
  //                   textAlign: TextAlign.center,
  //                   "Cancel",
  //                   style: TextStyle(fontWeight: FontWeight.bold),
  //                 ),
  //               ),
  //               onTap: () {
  //                 Navigator.pop(context);
  //               },
  //             ),
  //           ],
  //         ),
  //       );
  //     },
  //   );
  // }
  // }

