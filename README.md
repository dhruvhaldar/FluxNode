# FluxNode

![React](https://img.shields.io/badge/react-%2320232a.svg?style=for-the-badge&logo=react&logoColor=%2361DAFB)
![Vite](https://img.shields.io/badge/vite-%23646CFF.svg?style=for-the-badge&logo=vite&logoColor=white)
![NodeJS](https://img.shields.io/badge/node.js-6DA55F?style=for-the-badge&logo=node.js&logoColor=white)
![Express.js](https://img.shields.io/badge/express.js-%23404d59.svg?style=for-the-badge&logo=express&logoColor=%2361DAFB)
![MongoDB](https://img.shields.io/badge/MongoDB-%234ea94b.svg?style=for-the-badge&logo=mongodb&logoColor=white)
![Redis](https://img.shields.io/badge/redis-%23DD0031.svg?style=for-the-badge&logo=redis&logoColor=white)
![Python](https://img.shields.io/badge/python-3670A0?style=for-the-badge&logo=python&logoColor=ffdd54)
![Docker](https://img.shields.io/badge/docker-%230db7ed.svg?style=for-the-badge&logo=docker&logoColor=white)

FluxNode is a cloud-based Computational Fluid Dynamics (CFD) Job Manager utilizing a decoupled microservices architecture. It allows users to manage, submit, and track CFD jobs seamlessly through a web interface, processing compute-heavy tasks asynchronously.

## 🏗 Architecture

FluxNode follows a decoupled microservices architecture to ensure scalability and separation of concerns:

- **Frontend:** A React Single Page Application (SPA) built with Vite and Bootstrap, providing an intuitive user interface for job management and visualization (using Recharts).
- **Backend API:** An Express.js/Node.js RESTful API that handles user requests, authentication, and job submissions.
- **Database:** MongoDB for persistent storage of user data, job metadata, and status updates.
- **Task Queue:** Redis, coupled with Bull, to manage asynchronous job queues efficiently.
- **Worker Engine:** A Python compute engine worker that processes the queued CFD jobs using the FEniCSx solver.

All services are containerized and orchestrated using Docker Compose.

## 📂 Project Structure

```text
fluxnode/
├── backend/            # Express.js backend API
│   ├── src/            # Source code for routes, models, and controllers
│   ├── Dockerfile      # Docker configuration for backend
│   └── package.json    # Backend dependencies
├── frontend/           # React frontend application (Vite)
│   ├── src/            # React components and pages
│   ├── Dockerfile      # Docker configuration for frontend
│   └── package.json    # Frontend dependencies
├── worker/             # Python compute engine
│   ├── src/            # Python worker scripts
│   ├── Dockerfile      # Docker configuration for worker
│   └── requirements.txt# Python dependencies
├── docker-compose.yml  # Docker Compose orchestration file
└── README.md           # Project documentation
```

## 🚀 Getting Started

### Prerequisites

Ensure you have the following installed on your machine:

- [Docker](https://www.docker.com/get-started)
- [Docker Compose](https://docs.docker.com/compose/install/)

### Installation & Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/yourusername/fluxnode.git
   cd fluxnode
   ```

2. **Start the application using Docker Compose:**
   ```bash
   docker-compose up --build
   ```
   This command will pull the required images (MongoDB, Redis), build the backend, frontend, and worker images, and start all services.

3. **Access the Application:**
   - **Frontend:** Open your browser and navigate to `http://localhost:5173`
   - **Backend API:** Accessible at `http://localhost:5000`

### Stopping the Application

To stop the running services, use:
```bash
docker-compose down
```
If you also want to remove the named volumes (which will delete the database data), run:
```bash
docker-compose down -v
```

## 🛠 Tech Stack Details

- **Frontend:** React 19, React Router DOM, React Bootstrap, Recharts, Vite
- **Backend:** Node.js, Express.js, Mongoose, Bull (Queue), JSON Web Token (JWT), bcryptjs
- **Worker:** Python, Redis, PyMongo, NumPy, FEniCSx (in the worker Docker image)
- **Infrastructure:** Docker, Docker Compose, MongoDB, Redis

## 📄 License

This project is licensed under the ISC License.
