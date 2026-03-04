const mongoose = require('mongoose');

const simulationJobSchema = new mongoose.Schema({
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true
  },
  status: {
    type: String,
    enum: ['Pending', 'Running', 'Meshing', 'Solving', 'Completed', 'Failed'],
    default: 'Pending'
  },
  config: {
    kinematicViscosity: Number,
    inletVelocity: [Number],
    turbulenceModel: String,
    endTime: Number,
    meshSize: Number
  },
  residuals: {
    timeSteps: [Number],
    error: [Number]
  },
  resultsUrl: String
}, { timestamps: true });

module.exports = mongoose.model('SimulationJob', simulationJobSchema);
