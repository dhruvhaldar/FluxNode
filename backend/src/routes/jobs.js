const router = require('express').Router();
const SimulationJob = require('../models/SimulationJob');
const auth = require('../middleware/auth');
const Queue = require('bull');

// Connect to Redis queue
const REDIS_URL = process.env.REDIS_URL || 'redis://127.0.0.1:6379';
const jobQueue = new Queue('cfd-jobs', REDIS_URL);

// Submit a new job
router.post('/start', auth, async (req, res) => {
  const { projectId, config } = req.body;

  if (!projectId || !config) {
    return res.status(400).json({ message: 'ProjectId and config are required' });
  }

  const job = new SimulationJob({
    projectId,
    status: 'Pending',
    config,
    residuals: { timeSteps: [], error: [] }
  });

  try {
    const savedJob = await job.save();

    // Add job to Redis Queue for the Python worker
    await jobQueue.add({
      jobId: savedJob._id,
      projectId: savedJob.projectId,
      config: savedJob.config
    });

    res.status(201).json(savedJob);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get all jobs for a specific project
router.get('/project/:projectId', auth, async (req, res) => {
  try {
    const jobs = await SimulationJob.find({ projectId: req.params.projectId }).sort('-createdAt');
    res.json(jobs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get job status
router.get('/:id/status', auth, async (req, res) => {
  try {
    const job = await SimulationJob.findById(req.params.id).select('status config residuals resultsUrl createdAt updatedAt');
    if (!job) return res.status(404).json({ message: 'Job not found' });
    res.json(job);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
