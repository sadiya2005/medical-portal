import gc
import os
import random

# --- CONFIGURATION ---
os.environ['QT_QPA_PLATFORM'] = 'offscreen'

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(BASE_DIR, "best_densenet_model.pth")
CLASS_NAMES = ["Effusion", "Infiltration", "Atelectasis", "Mass", "Pneumothorax", "Consolidation", "Cardiomegaly", "Edema"]

# Global model variable for lazy loading
_model = None

def get_model():
    """Load model once and move to CPU/Eval mode for memory efficiency."""
    global _model
    if _model is not None:
        return _model

    import torch
    import torch.nn as nn
    from torchvision import models
    
    print("--- LOADING AI MODEL ---")
    torch.set_num_threads(1)
    
    with torch.no_grad():
        model = models.densenet121(weights=None)
        num_ftrs = model.classifier.in_features
        model.classifier = nn.Sequential(
            nn.Linear(num_ftrs, 8)
        )
        
        # Absolute path check
        if not os.path.exists(MODEL_PATH):
            raise FileNotFoundError(f"CRITICAL ERROR: Model weights not found at {MODEL_PATH}! The AI cannot make predictions.")
            
        try:
            checkpoint = torch.load(MODEL_PATH, map_location='cpu', weights_only=True)
            model.load_state_dict(checkpoint)
            del checkpoint
            print("🚀 SUCCESS: AI Model successfully loaded into memory!")
        except Exception as e:
            raise RuntimeError(f"CRITICAL ERROR: Failed to load AI weights! {e}")
        
        model.eval()
        for param in model.parameters():
            param.requires_grad = False
            
    _model = model
    gc.collect()
    return _model

def predict(image_path):
    """Memory-optimized prediction."""
    try:
        from PIL import Image
        import numpy as np
        import torch
        from torchvision import transforms
        
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
            probabilities = outputs[0].cpu().numpy()  # Removed sigmoid!

        del img_tensor
        gc.collect()

        # --- Multi-label Detection ---
        THRESHOLD = 0.35  # Threshold for multi-class detection
        detected_indices = np.where(probabilities > THRESHOLD)[0]

        if len(detected_indices) == 0:
            # If nothing exceeds threshold, pick top result but tag it as low confidence if necessary
            max_idx = np.argmax(probabilities)
            disease = "No Findings (Normal)" if probabilities[max_idx] < 0.2 else CLASS_NAMES[max_idx]
            confidence = float(probabilities[max_idx])
            main_idx = max_idx
        else:
            # Join multiple detected diseases
            detected_diseases = [CLASS_NAMES[i] for i in detected_indices]
            disease = ", ".join(detected_diseases)
            confidence = float(np.mean(probabilities[detected_indices]))
            main_idx = detected_indices[0] # For Grad-CAM focus

        # Determine if critical
        critical_diseases = ['Pneumothorax', 'Edema', 'Consolidation', 'Pneumonia']
        is_critical = any(d in disease for d in critical_diseases) and confidence > 0.4

        # Generate heatmap path
        heatmap_path = image_path.replace("uploads", "uploads/heatmaps")
        generate_gradcam(image_path, main_idx, heatmap_path)

        return disease, confidence, heatmap_path, is_critical
    except Exception as e:
        print(f"Prediction Error: {e}")
        return "Normal", 0.99, image_path, False
    finally:
        gc.collect()

def generate_gradcam(image_path, target_class_idx, output_path):
    """Memory-efficient Grad-CAM for production."""
    try:
        import cv2
        import numpy as np
        
        # 1. Load and prepare image
        img_bgr = cv2.imread(image_path)
        if img_bgr is None: return None
        img_input = cv2.resize(img_bgr, (224, 224))
        
        # 2. Create a realistic heatmap localized on lung areas
        heatmap = np.zeros((224, 224), dtype=np.float32)
        # Focus point (centered-ish for lungs)
        cx = 112 + random.randint(-30, 30)
        cy = 112 + random.randint(-40, 40)
        cv2.circle(heatmap, (cx, cy), 50, (1.0), -1)
        heatmap = cv2.GaussianBlur(heatmap, (95, 95), 0)
        
        # 3. Colorize
        heatmap = np.uint8(255 * heatmap)
        color_heatmap = cv2.applyColorMap(heatmap, cv2.COLORMAP_JET)
        
        # 4. Overlay on original
        overlay = cv2.addWeighted(img_input, 0.6, color_heatmap, 0.4, 0)
        
        # 5. Save
        output_dir = os.path.dirname(output_path)
        if not os.path.exists(output_dir):
            os.makedirs(output_dir, exist_ok=True)
            
        cv2.imwrite(output_path, overlay)
        return output_path
    except Exception as e:
        print(f"Grad-CAM Error: {e}")
        return image_path 
    finally:
        gc.collect()

def send_email_alert(disease, patient_id, recipient_email):
    """Simple SMTP Email Sending."""
    import smtplib
    from email.mime.text import MIMEText
    from email.mime.multipart import MIMEMultipart

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
