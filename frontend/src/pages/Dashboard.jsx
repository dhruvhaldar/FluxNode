import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Form, Modal, ListGroup, Navbar, Nav } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import JobDetails from '../components/JobDetails';

function Dashboard() {
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');

  const [config, setConfig] = useState({
    kinematicViscosity: 1.5e-5,
    inletVelocity: 10.0,
    turbulenceModel: 'kOmegaSST',
    endTime: 10
  });

  const navigate = useNavigate();

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const response = await api.get('/projects');
      setProjects(response.data);
    } catch (err) {
      if(err.response?.status === 401) navigate('/');
      console.error(err);
    }
  };

  const handleCreateProject = async () => {
    try {
      await api.post('/projects', { projectName: newProjectName });
      setNewProjectName('');
      setShowModal(false);
      fetchProjects();
    } catch (err) {
      console.error(err);
    }
  };

  const handleSelectProject = async (project) => {
    setSelectedProject(project);
    fetchJobs(project._id);
  };

  const fetchJobs = async (projectId) => {
    try {
      const response = await api.get(`/jobs/project/${projectId}`);
      setJobs(response.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleStartJob = async (e) => {
    e.preventDefault();
    if (!selectedProject) return;

    try {
      await api.post('/jobs/start', {
        projectId: selectedProject._id,
        config: {
          ...config,
          inletVelocity: [parseFloat(config.inletVelocity), 0, 0],
          kinematicViscosity: parseFloat(config.kinematicViscosity),
          endTime: parseFloat(config.endTime)
        }
      });
      fetchJobs(selectedProject._id);
    } catch (err) {
      console.error(err);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/');
  };

  return (
    <>
      <Navbar bg="dark" variant="dark">
        <Container>
          <Navbar.Brand>FluxNode Dashboard</Navbar.Brand>
          <Nav className="ms-auto">
            <Button variant="outline-light" onClick={handleLogout}>Logout</Button>
          </Nav>
        </Container>
      </Navbar>

      <Container className="mt-4">
        <Row>
          <Col md={3}>
            <Card>
              <Card.Header className="d-flex justify-content-between align-items-center">
                Projects
                <Button size="sm" onClick={() => setShowModal(true)}>+</Button>
              </Card.Header>
              <ListGroup variant="flush">
                {projects.map(proj => (
                  <ListGroup.Item
                    key={proj._id}
                    action
                    active={selectedProject?._id === proj._id}
                    onClick={() => handleSelectProject(proj)}
                  >
                    {proj.projectName}
                  </ListGroup.Item>
                ))}
              </ListGroup>
            </Card>
          </Col>

          <Col md={9}>
            {selectedProject ? (
              <Row>
                <Col md={12}>
                  <h4>{selectedProject.projectName} - Job Configuration</h4>
                  <Card className="mb-4">
                    <Card.Body>
                      <Form onSubmit={handleStartJob}>
                        <Row>
                          <Col md={6}>
                            <Form.Group className="mb-3">
                              <Form.Label>Kinematic Viscosity (m²/s)</Form.Label>
                              <Form.Control type="number" step="1e-6" value={config.kinematicViscosity} onChange={e => setConfig({...config, kinematicViscosity: e.target.value})} />
                            </Form.Group>
                          </Col>
                          <Col md={6}>
                            <Form.Group className="mb-3">
                              <Form.Label>Inlet Velocity X (m/s)</Form.Label>
                              <Form.Control type="number" value={config.inletVelocity} onChange={e => setConfig({...config, inletVelocity: e.target.value})} />
                            </Form.Group>
                          </Col>
                          <Col md={6}>
                            <Form.Group className="mb-3">
                              <Form.Label>End Time (s)</Form.Label>
                              <Form.Control type="number" value={config.endTime} onChange={e => setConfig({...config, endTime: e.target.value})} />
                            </Form.Group>
                          </Col>
                          <Col md={6}>
                            <Form.Group className="mb-3">
                              <Form.Label>Turbulence Model</Form.Label>
                              <Form.Select value={config.turbulenceModel} onChange={e => setConfig({...config, turbulenceModel: e.target.value})}>
                                <option value="kOmegaSST">k-omega SST</option>
                                <option value="kEpsilon">k-epsilon</option>
                                <option value="laminar">Laminar</option>
                              </Form.Select>
                            </Form.Group>
                          </Col>
                        </Row>
                        <Button variant="primary" type="submit">Start Simulation</Button>
                      </Form>
                    </Card.Body>
                  </Card>
                </Col>

                <Col md={12}>
                  <h4>Simulation Jobs</h4>
                  {jobs.map(job => (
                    <JobDetails key={job._id} jobId={job._id} initialStatus={job.status} />
                  ))}
                </Col>
              </Row>
            ) : (
              <div className="text-center mt-5 text-muted">
                <h4>Select or create a project to get started</h4>
              </div>
            )}
          </Col>
        </Row>
      </Container>

      {/* Create Project Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Create New Project</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group>
            <Form.Label>Project Name</Form.Label>
            <Form.Control
              type="text"
              placeholder="e.g. NACA0012 Airfoil"
              value={newProjectName}
              onChange={(e) => setNewProjectName(e.target.value)}
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
          <Button variant="primary" onClick={handleCreateProject}>Create</Button>
        </Modal.Footer>
      </Modal>
    </>
  );
}

export default Dashboard;
