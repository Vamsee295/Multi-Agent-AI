"""
Vercel Serverless Function entrypoint.
Exposes the FastAPI application as `app`.
"""
import os
import sys

current_dir = os.path.dirname(os.path.abspath(__file__))
root_dir = os.path.dirname(current_dir)
backend_dir = os.path.join(root_dir, "backend")

if os.path.exists(backend_dir) and backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

if current_dir not in sys.path:
    sys.path.insert(0, current_dir)

# Ensure relative paths (e.g. vectorstore, knowledge_base) resolve properly
if os.path.exists(backend_dir):
    os.chdir(backend_dir)

from main import app
