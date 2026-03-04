import time
import logging
from bson.objectid import ObjectId
import numpy as np

# Try to import FEniCSx modules. If not running in the worker container, it will fail gracefully.
try:
    from dolfinx import mesh, fem
    from mpi4py import MPI
    import ufl
    import dolfinx.io
    HAS_FENICS = True
except ImportError:
    HAS_FENICS = False
    logging.warning("FEniCSx modules not found. Ensure this script is running in the worker container with fenicsx installed.")

def run_simulation(job_id, config, collection):
    """
    FEniCSx simulation function solving a simple 2D lid-driven cavity or similar Poisson problem
    as a proof-of-concept boilerplate.
    """
    logging.info(f"Starting FEniCSx simulation for Job ID: {job_id}")

    # 1. Meshing Step
    collection.update_one({'_id': ObjectId(job_id)}, {'$set': {'status': 'Meshing'}})
    logging.info("Generating mesh...")

    if HAS_FENICS:
        # Create a simple unit square mesh
        msh = mesh.create_unit_square(MPI.COMM_WORLD, 32, 32, mesh.CellType.triangle)
    else:
        # Fallback for development if run outside container
        time.sleep(2)

    # 2. Solving Step
    collection.update_one({'_id': ObjectId(job_id)}, {'$set': {'status': 'Solving'}})
    logging.info("Solving equations...")

    end_time = int(config.get('endTime', 10))
    nu = config.get('kinematicViscosity', 1.5e-5)

    if HAS_FENICS:
        # We will set up a simple Poisson problem: -div(grad(u)) = f
        # This is a placeholder for a more complex Navier-Stokes solver
        V = fem.functionspace(msh, ("Lagrange", 1))

        # Define boundary condition (u=0 on boundaries)
        def boundary(x):
            return np.logical_or(np.logical_or(np.isclose(x[0], 0), np.isclose(x[0], 1)),
                                 np.logical_or(np.isclose(x[1], 0), np.isclose(x[1], 1)))

        fdim = msh.topology.dim - 1
        boundary_facets = mesh.locate_entities_boundary(msh, fdim, boundary)
        u_D = fem.Function(V)
        u_D.x.array[:] = 0.0
        bc = fem.dirichletbc(u_D, fem.locate_dofs_topological(V, fdim, boundary_facets))

        # Define variational problem
        u = ufl.TrialFunction(V)
        v = ufl.TestFunction(V)
        from petsc4py.PETSc import ScalarType
        f = fem.Constant(msh, ScalarType(1.0))
        a = ufl.dot(ufl.grad(u), ufl.grad(v)) * ufl.dx
        L = f * v * ufl.dx

        problem = fem.petsc.LinearProblem(a, L, bcs=[bc], petsc_options={"ksp_type": "preonly", "pc_type": "lu"})

    # Loop over time steps and push residual updates
    for step in range(1, end_time + 1):
        if HAS_FENICS:
            # For a real transient simulation, you would solve for each time step.
            # Here we just run the linear problem and compute an artificial residual
            uh = problem.solve()

            # Compute mock error residual that decreases over time
            # In a real scenario, this would be the actual linear solver residual
            error = 1.0 / (step ** 1.5)

        else:
            time.sleep(1)
            error = 1.0 / (step ** 1.5)

        logging.info(f"Step {step}/{end_time} - Residual: {error:.5f}")

        # Push the new time step and error into the arrays in MongoDB
        collection.update_one(
            {'_id': ObjectId(job_id)},
            {
                '$push': {
                    'residuals.timeSteps': step,
                    'residuals.error': error
                }
            }
        )

    # 3. Post-Processing Step
    logging.info("Post-processing results (Generating VTK)...")

    results_url = f"/outputs/job_{job_id}_results.pvd"

    if HAS_FENICS:
        # Save to VTK format in the shared outputs volume
        import os
        os.makedirs("/app/outputs", exist_ok=True)
        output_filename = f"/app/outputs/job_{job_id}_results.pvd"
        with dolfinx.io.VTKFile(msh.comm, output_filename, "w") as vtk:
            vtk.write([uh._cpp_object])
        logging.info(f"Saved results to {output_filename}")

    # Set the final results URL
    collection.update_one(
        {'_id': ObjectId(job_id)},
        {'$set': {'resultsUrl': results_url}}
    )

    return True
