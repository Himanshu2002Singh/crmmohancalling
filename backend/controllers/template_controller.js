const { uploadFileToS3, deleteFileFromS3} = require('../services/s3_services');
const Template = require('../models/template_model');

exports.createTemplate = async (req, res) => {
  try {
    const { name, description, fileType } = req.body;
    let fileUrl = null;  // change const → let

    // If fileType is not 'none', then file must be uploaded
    if (fileType !== "none") {
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }
      fileUrl = await uploadFileToS3(req.file);  // upload and get URL
    }

    const newTemplate = await Template.create({
      name,
      description,
      fileType,
      fileUrl,
    });

    return res.status(200).json({
      success: true,
      message: 'Template created successfully',
      data: newTemplate,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};


exports.getAllTemplates = async (req, res) => {
  try {
    const templates = await Template.findAll();
    res.status(200).json({ success: true, data: templates });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

// 🔴 Delete Template by ID
exports.deleteTemplate = async (req, res) => {
  try {
    const { id } = req.params;

    const template = await Template.findByPk(id);
    if (!template) {
      return res.status(404).json({ success: false, message: 'Template not found' });
    }
    console.log("yha tk code chla");
    // Delete file from S3 if exists
    await deleteFileFromS3(template.fileUrl);
    console.log("checkpoint 2");
    // Delete row from DB
    await template.destroy();

    res.json({ success: true, message: 'Template deleted successfully' });
  } catch (error) {
    console.error('Error deleting template:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};
