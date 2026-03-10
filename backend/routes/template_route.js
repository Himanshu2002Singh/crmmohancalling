const express = require('express');
const router = express.Router();
const upload = require('../middlewares/upload_middleware');
const templateController = require('../controllers/template_controller');

// POST: create template with file upload
router.post('/create_template', upload.single('file'), templateController.createTemplate);

// GET: get all templates
router.get('/get_templates', templateController.getAllTemplates);
router.delete('/delete_template/:id', templateController.deleteTemplate);


module.exports = router;
