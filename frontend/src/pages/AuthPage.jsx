import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { Container, Row, Col, Form, Button, Alert, Card } from 'react-bootstrap';

function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const endpoint = isLogin ? '/auth/login' : '/auth/register';
      const response = await api.post(endpoint, { email, password });
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Authentication failed');
    }
  };

  return (
    <Container className="d-flex align-items-center justify-content-center" style={{ minHeight: "100vh" }}>
      <div className="w-100" style={{ maxWidth: "400px" }}>
        <Card>
          <Card.Body>
            <h2 className="text-center mb-4">{isLogin ? 'Log In' : 'Sign Up'}</h2>
            {error && <Alert variant="danger">{error}</Alert>}
            <Form onSubmit={handleSubmit}>
              <Form.Group id="email" className="mb-3">
                <Form.Label>Email</Form.Label>
                <Form.Control type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
              </Form.Group>
              <Form.Group id="password" className="mb-4">
                <Form.Label>Password</Form.Label>
                <Form.Control type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
              </Form.Group>
              <Button className="w-100" type="submit">
                {isLogin ? 'Log In' : 'Sign Up'}
              </Button>
            </Form>
          </Card.Body>
        </Card>
        <div className="w-100 text-center mt-2">
          {isLogin ? "Need an account? " : "Already have an account? "}
          <Button variant="link" className="p-0 m-0" onClick={() => setIsLogin(!isLogin)}>
            {isLogin ? 'Sign Up' : 'Log In'}
          </Button>
        </div>
      </div>
    </Container>
  );
}

export default AuthPage;
