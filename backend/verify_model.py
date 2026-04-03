import os
import torch
import sys

# Add backend to path
sys.path.append(os.getcwd())

try:
    from real_model import model, predict
    print("SUCCESS: Model architecture defined and instantiated.")
    print(f"Model is on: {next(model.parameters()).device}")
    
    # Test loading weights (happens in real_model.py on import)
    print("SUCCESS: Weights loaded onto model.")
    
except Exception as e:
    print(f"FAILURE: {e}")
    sys.exit(1)
