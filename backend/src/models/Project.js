const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  projectName: {
    type: String,
    required: true
  },
  geometryFileUrl: {
    type: String
  }
}, { timestamps: true });

module.exports = mongoose.model('Project', projectSchema);
