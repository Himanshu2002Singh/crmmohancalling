import 'package:calling_crm/models/template_model.dart';
import 'package:calling_crm/services/api_service.dart';
import 'package:calling_crm/theme/appcolors.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:url_launcher/url_launcher.dart';

class TemplateDialog {
  static Future<void> show(
    BuildContext context,
    String phone,
    String name,
  ) async {
    TextEditingController messageController = TextEditingController();
    Template? selectedTemplate;

    return showDialog<void>(
      context: context,
      builder: (BuildContext context) {
        return FutureBuilder<List<Template>>(
          future: ApiService.getTemplates(),
          builder: (context, snapshot) {
            if (snapshot.connectionState == ConnectionState.waiting) {
              return Center(child: CircularProgressIndicator());
            } else if (snapshot.hasError) {
              print("Error fetching templates: ${snapshot.error}");
              return AlertDialog(
                title: Text('Error'),
                content: Text('Failed to load templates.'),
                actions: [
                  TextButton(
                    onPressed: () => Navigator.pop(context),
                    child: Text('OK'),
                  ),
                ],
              );
            } else {
              List<DropdownMenuItem<Template>> templates =
                  snapshot.data!
                      .map(
                        (template) => DropdownMenuItem(
                          value: template,
                          child: Text(template.name),
                        ),
                      )
                      .toList();

              return StatefulBuilder(
                builder: (context, setState) {
                  return Dialog(
                    backgroundColor: Colors.white,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(10.0),
                    ),
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: <Widget>[
                        Container(
                          padding: const EdgeInsets.all(10.0),
                          width: double.infinity,
                          decoration: BoxDecoration(
                            color: AppColors.primaryColor,
                            borderRadius: BorderRadius.only(
                              topLeft: Radius.circular(10),
                              topRight: Radius.circular(10),
                            ),
                          ),
                          child: Text(
                            "Template",
                            style: TextStyle(
                              fontSize: 20,
                              fontWeight: FontWeight.bold,
                              color: Colors.white,
                            ),
                          ),
                        ),
                        Padding(
                          padding: EdgeInsets.all(10.0),
                          child: Column(
                            children: [
                              Row(
                                children: [
                                  Text(
                                    "To: ",
                                    style: TextStyle(
                                      fontSize: 18,
                                      color: Colors.black54,
                                    ),
                                  ),
                                  SizedBox(width: 10),
                                  Column(
                                    crossAxisAlignment:
                                        CrossAxisAlignment.start,
                                    children: [
                                      Text(
                                        phone,
                                        style: TextStyle(
                                          fontSize: 18,
                                          color: Colors.black54,
                                        ),
                                      ),
                                      Text(
                                        name,
                                        style: TextStyle(
                                          fontSize: 18,
                                          color: Colors.black54,
                                        ),
                                      ),
                                    ],
                                  ),
                                ],
                              ),
                              SizedBox(height: 10),
                              DropdownButtonFormField<Template>(
                                items: templates,
                                value: selectedTemplate,
                                onChanged: (value) {
                                  setState(() {
                                    selectedTemplate = value;
                                    messageController.clear();
                                    messageController.text = value!.description;
                                  });
                                },
                                decoration: InputDecoration(
                                  labelText: 'Select Template',
                                  border: OutlineInputBorder(),
                                ),
                              ),
                              SizedBox(height: 10),

                              selectedTemplate != null &&
                                      selectedTemplate!.fileUrl.isNotEmpty
                                  ? selectedTemplate!.fileType == "image"
                                      ? Image.network(
                                        selectedTemplate!.fileUrl,
                                        height: 150,
                                        fit: BoxFit.cover,
                                      )
                                      : Column(
                                        children: [
                                          Icon(
                                            Icons.picture_as_pdf,
                                            size: 50,
                                            color: Colors.red,
                                          ),
                                          Text(
                                            "PDF Template",
                                            style: TextStyle(fontSize: 16),
                                          ),
                                        ],
                                      )
                                  : SizedBox(),
                              TextField(
                                controller: messageController,
                                decoration: InputDecoration(
                                  labelText: 'Enter your message here',
                                ),
                              ),
                              SizedBox(height: 20),
                              Row(
                                mainAxisAlignment:
                                    MainAxisAlignment.spaceAround,
                                children: [
                                  ElevatedButton.icon(
                                    onPressed: () {
                                      Navigator.pop(context);
                                    },
                                    icon: Icon(Icons.cancel),
                                    label: Text("Cancel"),
                                    style: ElevatedButton.styleFrom(
                                      backgroundColor: Colors.red,
                                      foregroundColor: Colors.white,
                                    ),
                                  ),
                                  ElevatedButton.icon(
                                    onPressed: () async {
                                      sendImageWithMessageToWhatsApp(
                                        selectedTemplate?.fileUrl ?? "",
                                        messageController.text.trim(),
                                      );
                                    },
                                    icon: Icon(Icons.send),
                                    label: Text("Send"),
                                    style: ElevatedButton.styleFrom(
                                      backgroundColor: Colors.green,
                                      foregroundColor: Colors.white,
                                    ),
                                  ),
                                ],
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  );
                },
              );
            }
          },
        );
      },
    );
  }
}

Future<void> sendImageWithMessageToWhatsApp(
  String imageUrl,
  String message,
) async {
  const platform = MethodChannel(
    'com.example.capital_care/whatsapp_share',
  ); // ✅ channel name match

  try {
    await platform.invokeMethod('shareImageToWhatsApp', {
      'imageUrl': imageUrl,
      'message': message,
    });
  } on PlatformException catch (e) {
    print("Failed to send: ${e.message}");
  }
}
