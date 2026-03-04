import os
import json
import time
import logging
from pymongo import MongoClient
import redis
from bson.objectid import ObjectId
import threading
from src.fenics_simulation import run_simulation

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

MONGO_URI = os.getenv('MONGO_URI', 'mongodb://127.0.0.1:27017/fluxnode')
REDIS_HOST = os.getenv('REDIS_HOST', '127.0.0.1')
REDIS_PORT = int(os.getenv('REDIS_PORT', 6379))

# Setup MongoDB
mongo_client = MongoClient(MONGO_URI)
db = mongo_client.get_database()
jobs_collection = db['simulationjobs']

# Setup Redis (Listening to Bull queue)
# Bull queue default prefix is 'bull' and queue name is 'cfd-jobs'
r = redis.Redis(host=REDIS_HOST, port=REDIS_PORT, db=0)
QUEUE_KEY = 'bull:cfd-jobs:wait'

def process_job(job_id_str):
    try:
        # Bull stores job data in hashes with key bull:cfd-jobs:jobId
        job_data_bytes = r.hget(f'bull:cfd-jobs:{job_id_str}', 'data')

        if not job_data_bytes:
            logging.warning(f"Could not find data for redis job {job_id_str}")
            return

        job_data = json.loads(job_data_bytes.decode('utf-8'))
        mongo_job_id = job_data.get('jobId')
        config = job_data.get('config', {})

        if not mongo_job_id:
            logging.error(f"Redis job {job_id_str} is missing MongoDB jobId")
            return

        logging.info(f"Starting MongoDB job {mongo_job_id}")

        # Update status to 'Running'
        jobs_collection.update_one(
            {'_id': ObjectId(mongo_job_id)},
            {'$set': {'status': 'Running'}}
        )

        # Run FEniCSx simulation
        # In a real scenario, this would block or we use multiprocessing, but here it's simplified.
        success = run_simulation(mongo_job_id, config, jobs_collection)

        if success:
            jobs_collection.update_one(
                {'_id': ObjectId(mongo_job_id)},
                {'$set': {'status': 'Completed'}}
            )
            logging.info(f"Job {mongo_job_id} Completed")
        else:
            jobs_collection.update_one(
                {'_id': ObjectId(mongo_job_id)},
                {'$set': {'status': 'Failed'}}
            )
            logging.info(f"Job {mongo_job_id} Failed")

    except Exception as e:
        logging.error(f"Error processing job: {str(e)}")
        # Try to mark as failed if possible
        try:
            if 'mongo_job_id' in locals():
                jobs_collection.update_one(
                    {'_id': ObjectId(mongo_job_id)},
                    {'$set': {'status': 'Failed'}}
                )
        except:
            pass

def poll_queue():
    logging.info("Worker started, waiting for jobs...")
    while True:
        try:
            # BLPOP blocks until a job is available in the wait queue
            # Bull pushes job IDs to the wait list
            result = r.blpop(QUEUE_KEY, timeout=5)
            if result:
                queue_name, job_id = result
                job_id_str = job_id.decode('utf-8')
                logging.info(f"Received job from Redis queue: {job_id_str}")

                # Move job to active (simplification of Bull's state management)
                r.lpush('bull:cfd-jobs:active', job_id)

                # Process the job in a separate thread so worker isn't blocked
                # (in a robust setup, use Celery/RQ or process pool)
                t = threading.Thread(target=process_job, args=(job_id_str,))
                t.start()

        except redis.ConnectionError:
            logging.error("Redis connection error, retrying in 5 seconds...")
            time.sleep(5)
        except Exception as e:
            logging.error(f"Error in poll loop: {str(e)}")
            time.sleep(5)

if __name__ == '__main__':
    # Give services time to start up in Docker Compose
    time.sleep(5)
    poll_queue()
