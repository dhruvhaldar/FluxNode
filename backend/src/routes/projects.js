const router = require('express').Router();
const Project = require('../models/Project');
const auth = require('../middleware/auth');

// Get all projects for a user
router.get('/', auth, async (req, res) => {
  try {
    const projects = await Project.find({ userId: req.user._id });
    res.json(projects);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Create a new project
router.post('/', auth, async (req, res) => {
  const project = new Project({
    userId: req.user._id,
    projectName: req.body.projectName,
    geometryFileUrl: req.body.geometryFileUrl || ''
  });

  try {
    const savedProject = await project.save();
    res.status(201).json(savedProject);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

module.exports = router;
