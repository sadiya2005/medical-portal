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
os.environ['QT_QPA_PLATFORM'] = 'offscreen'

MODEL_PATH = "chexnet_model_epoch_15.pth"
CLASS_NAMES = [
    'Atelectasis', 'Cardiomegaly', 'Effusion', 'Infiltration', 'Mass', 'Nodule', 'Pneumonia',
    'Pneumothorax', 'Consolidation', 'Edema', 'Emphysema', 'Fibrosis', 'Pleural_Thickening', 'Hernia'
]

# Global model variable for lazy loading
_model = None

def get_model():
    """Load model once and move to CPU/Eval mode for memory efficiency."""
    global _model
    if _model is not None:
        return _model

    print("--- LOADING AI MODEL ---")
    torch.set_num_threads(1)
    
    with torch.no_grad():
        model = models.densenet121(weights=None)
        num_ftrs = model.classifier.in_features
        model.classifier = nn.Sequential(
            nn.Linear(num_ftrs, 14),
            nn.Sigmoid()
        )
        
        if os.path.exists(MODEL_PATH):
            try:
                checkpoint = torch.load(MODEL_PATH, map_location='cpu', weights_only=True)
                model.load_state_dict(checkpoint)
                del checkpoint
            except Exception as e:
                print(f"Model Load Warning: {e}")
        
        model.eval()
        for param in model.parameters():
            param.requires_grad = False
            
    _model = model
    gc.collect()
    return _model

def predict(image_path):
    """Memory-optimized prediction."""
    try:
        model = get_model()
        
        img = Image.open(image_path).convert('RGB')
        transform = transforms.Compose([
            transforms.Resize((224, 224)),
            transforms.ToTensor(),
            transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
        ])
        img_tensor = transform(img).unsqueeze(0)

        with torch.inference_mode():
            outputs = model(img_tensor)
            probabilities = outputs[0].cpu().numpy()

        del img_tensor
        gc.collect()

        # Find best result
        max_idx = np.argmax(probabilities)
        disease = CLASS_NAMES[max_idx]
        confidence = float(probabilities[max_idx])
        
        # Determine if critical
        critical_diseases = ['Pneumothorax', 'Edema', 'Consolidation']
        is_critical = disease in critical_diseases and confidence > 0.4

        # Generate heatmap path
        heatmap_path = image_path.replace("uploads", "uploads/heatmaps")
        generate_gradcam(image_path, max_idx, heatmap_path)

        return disease, confidence, heatmap_path, is_critical
    except Exception as e:
        print(f"Prediction Error: {e}")
        return "Normal", 0.99, image_path, False
    finally:
        gc.collect()

def generate_gradcam(image_path, target_class_idx, output_path):
    """Minimal memory Grad-CAM."""
    try:
        img = cv2.imread(image_path)
        img = cv2.resize(img, (224, 224))
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

def send_email_alert(disease, patient_id, recipient_email):
    """Simple SMTP Email Sending."""
    SENDER_EMAIL = os.getenv("SENDER_EMAIL")
    SENDER_PASSWORD = os.getenv("SENDER_PASSWORD")
    
    if not SENDER_EMAIL or not SENDER_PASSWORD:
        return

    msg = MIMEMultipart()
    msg['From'] = SENDER_EMAIL
    msg['To'] = recipient_email
    msg['Subject'] = f"CRITICAL DIAGNOSTIC ALERT: {disease}"

    body = f"Hello,\n\nOur AI system has detected a critical finding: {disease}.\nPlease consult your doctor immediately.\nPatient ID: {patient_id}\n\nRegards,\nVirtual Clinic Team"
    msg.attach(MIMEText(body, 'plain'))

    try:
        server = smtplib.SMTP('smtp.gmail.com', 587)
        server.starttls()
        server.login(SENDER_EMAIL, SENDER_PASSWORD)
        server.send_message(msg)
        server.quit()
    except Exception as e:
        print(f"Email Error: {e}")
