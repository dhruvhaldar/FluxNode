import React, { useState, useEffect } from 'react';
import { Card, Badge, Spinner } from 'react-bootstrap';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import api from '../api/axios';

function JobDetails({ jobId, initialStatus }) {
  const [job, setJob] = useState(null);

  useEffect(() => {
    fetchJobStatus();

    // Poll every 2 seconds if not completed/failed
    let interval;
    if (!job || !['Completed', 'Failed'].includes(job.status)) {
      interval = setInterval(() => {
        fetchJobStatus();
      }, 2000);
    }

    return () => clearInterval(interval);
  }, [jobId, job?.status]);

  const fetchJobStatus = async () => {
    try {
      const response = await api.get(`/jobs/${jobId}/status`);
      setJob(response.data);
    } catch (err) {
      console.error(err);
    }
  };

  if (!job) return <Spinner animation="border" size="sm" />;

  const getStatusColor = (status) => {
    switch(status) {
      case 'Pending': return 'secondary';
      case 'Running': return 'primary';
      case 'Meshing': return 'info';
      case 'Solving': return 'warning';
      case 'Completed': return 'success';
      case 'Failed': return 'danger';
      default: return 'light';
    }
  };

  // Format data for Recharts
  const chartData = job.residuals?.timeSteps?.map((step, index) => ({
    step,
    error: job.residuals.error[index]
  })) || [];

  return (
    <Card className="mb-3">
      <Card.Header className="d-flex justify-content-between align-items-center">
        <span>Job ID: {job._id.slice(-6)}</span>
        <Badge bg={getStatusColor(job.status)}>{job.status}</Badge>
      </Card.Header>
      <Card.Body>
        <div className="mb-3">
          <small className="text-muted">
            Viscosity: {job.config?.kinematicViscosity} |
            Velocity: [{job.config?.inletVelocity?.join(', ')}] |
            Model: {job.config?.turbulenceModel}
          </small>
        </div>

        {chartData.length > 0 && (
          <div style={{ height: 200, width: '100%' }}>
            <ResponsiveContainer>
              <LineChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="step" label={{ value: 'Time Step', position: 'insideBottom', offset: -5 }} />
                <YAxis scale="log" domain={['auto', 'auto']} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="error" stroke="#8884d8" name="Residual Error" dot={false} isAnimationActive={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {job.status === 'Completed' && (
          <div className="mt-3">
            <a href={`http://localhost:5000${job.resultsUrl}`} className="btn btn-outline-success btn-sm" download>Download Results</a>
          </div>
        )}
      </Card.Body>
    </Card>
  );
}

export default JobDetails;
