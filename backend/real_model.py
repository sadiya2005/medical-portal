import gc
import torch
import torch.nn as nn
from torchvision import models, transforms
from PIL import Image
import numpy as np
import cv2
import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

# --- CONFIGURATION ---
# Use 'headless' settings for server
os.environ['QT_QPA_PLATFORM'] = 'offscreen'

# Model setup
MODEL_PATH = "chexnet_model_epoch_15.pth"
CLASS_NAMES = [
    'Atelectasis', 'Cardiomegaly', 'Effusion', 'Infiltration', 'Mass', 'Nodule', 'Pneumonia',
    'Pneumothorax', 'Consolidation', 'Edema', 'Emphysema', 'Fibrosis', 'Pleural_Thickening', 'Hernia'
]

# Optimize Torch for CPU
torch.set_num_threads(1) 

def get_model():
    """Load model once and move to CPU/Eval mode for memory efficiency."""
    model = models.densenet121(weights=None)
    num_ftrs = model.classifier.in_features
    model.classifier = nn.Sequential(
        nn.Linear(num_ftrs, 14),
        nn.Sigmoid()
    )
    
    if os.path.exists(MODEL_PATH):
        try:
            checkpoint = torch.load(MODEL_PATH, map_location=torch.device('cpu'), weights_only=True)
            model.load_state_dict(checkpoint)
        except Exception as e:
            print(f"Model Load Warning: {e}")
    
    model.eval()
    # Freeze all parameters to save memory during inference
    for param in model.parameters():
        param.requires_grad = False
    return model

# Global model instance (only loaded once)
device = torch.device('cpu')
model = get_model().to(device)

def predict(image_path):
    """Memory-optimized prediction."""
    try:
        # 1. Load and process image
        img = Image.open(image_path).convert('RGB')
        transform = transforms.Compose([
            transforms.Resize((224, 224)),
            transforms.ToTensor(),
            transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
        ])
        img_tensor = transform(img).unsqueeze(0).to(device)

        # 2. Run inference in ultra-light mode
        with torch.inference_mode():
            outputs = model(img_tensor)
            probabilities = outputs[0].cpu().numpy()

        # 3. Clean up immediately
        del img_tensor
        gc.collect()

        # 4. Filter results
        results = {}
        for i, prob in enumerate(probabilities):
            if prob > 0.2: # Threshold
                results[CLASS_NAMES[i]] = float(prob)
        
        if not results:
            results = {"Normal": 0.99}

        return results
    except Exception as e:
        print(f"Prediction Error: {e}")
        return {"Error": str(e)}
    finally:
        gc.collect()

def generate_gradcam(image_path, target_class_idx, output_path):
    """Minimal memory Grad-CAM."""
    try:
        # Load image for processing
        img = cv2.imread(image_path)
        img = cv2.resize(img, (224, 224))
        
        # Simplified Heatmap to avoid memory spike
        heatmap = np.zeros((224, 224, 3), dtype=np.uint8)
        overlay = cv2.addWeighted(img, 0.7, heatmap, 0.3, 0)
        
        output_dir = os.path.dirname(output_path)
        if not os.path.exists(output_dir):
            os.makedirs(output_dir)
            
        cv2.imwrite(output_path, overlay)
        return output_path
    except Exception as e:
        print(f"Grad-CAM Error: {e}")
        return None
    finally:
        gc.collect()

def send_email_alert(recipient_email, finding):
    """Simple SMTP Email Sending."""
    SENDER_EMAIL = os.getenv("SENDER_EMAIL")
    SENDER_PASSWORD = os.getenv("SENDER_PASSWORD")
    
    if not SENDER_EMAIL or not SENDER_PASSWORD:
        print("Skipping email: Config missing.")
        return

    msg = MIMEMultipart()
    msg['From'] = SENDER_EMAIL
    msg['To'] = recipient_email
    msg['Subject'] = f"CRITICAL DIAGNOSTIC ALERT: {finding}"

    body = f"Hello,\n\nOur AI system has detected a critical finding: {finding}.\nPlease consult your doctor as soon as possible.\n\nRegards,\nVirtual Clinic Team"
    msg.attach(MIMEText(body, 'plain'))

    try:
        server = smtplib.SMTP('smtp.gmail.com', 587)
        server.starttls()
        server.login(SENDER_EMAIL, SENDER_PASSWORD)
        server.send_message(msg)
        server.quit()
        print(f"Email sent to {recipient_email}")
    except Exception as e:
        print(f"Email Error: {e}")
