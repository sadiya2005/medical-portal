import torch
import torch.nn as nn
from torchvision import models, transforms
from PIL import Image
import numpy as np
import os
import cv2
from dotenv import load_dotenv

load_dotenv()

# ==========================================
# 0. CONFIGURATION (User Credentials)
# ==========================================
SENDER_EMAIL = os.getenv("SENDER_EMAIL", "ssadiyasheeraj@gmail.com")
SENDER_PASSWORD = os.getenv("SENDER_PASSWORD", "wbsfrgehctpzcchw")
RECIPIENT_LOG = os.getenv("RECIPIENT_LOG", "ssadiyasheeraj@gmail.com") 
SMTP_SERVER = "smtp.gmail.com"
SMTP_PORT = 587

LABELS = [
    "Effusion", "Infiltration", "Atelectasis", "Mass", 
    "Pneumothorax", "Consolidation", "Cardiomegaly", "Edema"
]
CRITICAL_DISEASES = ["Pneumothorax", "Edema", "Consolidation"]

# ==========================================
# 1. DenseNet-121 Architecture
# ==========================================
class DenseNet121_8Class(nn.Module):
    def __init__(self, num_classes=8):
        super(DenseNet121_8Class, self).__init__()
        self.densenet = models.densenet121(weights=None)
        in_features = self.densenet.classifier.in_features
        self.densenet.classifier = nn.Sequential(
            nn.Linear(in_features, num_classes)
        )
        
    def forward(self, x):
        return self.densenet(x)

# ==========================================
# 2. Bulletproof Grad-CAM Implementation
# ==========================================
class GradCAM:
    def __init__(self, model, target_layer):
        self.model = model
        self.target_layer = target_layer
        self.gradient = None
        self.activation = None
        
        # I. Disable all in-place RELU in the entire model
        for module in self.model.modules():
            if isinstance(module, nn.ReLU):
                module.inplace = False

        # II. Forward Hook to capture Activations AND use register_hook on the tensor for gradients
        # This is the industry-standard fix for "BackwardHookFunctionBackward view modified in-place"
        self.target_layer.register_forward_hook(self.save_activation_and_hook)

    def save_activation_and_hook(self, module, input, output):
        # We must clone the activation to keep it safe from graph changes
        self.activation = output.detach().clone()
        
        # 🔥 CRITICAL FIX: Only register hook if the tensor actually requires gradients
        if output.requires_grad:
            def hook_grad(grad):
                self.gradient = grad.detach().clone()
            output.register_hook(hook_grad)
            
        return output

    def generate_heatmap(self, image_tensor, target_class_idx):
        self.model.zero_grad()
        
        # Forward pass (Gradients must be enabled here)
        logits = self.model(image_tensor)
        target_score = logits[0, target_class_idx]
        
        # Backward pass triggers the hooks we set in __init__
        target_score.backward()
        
        if self.gradient is None or self.activation is None:
            return None, torch.sigmoid(logits)

        # Average pool the gradients and generate CAM
        gradients = self.gradient.cpu().data.numpy()[0]
        activations = self.activation.cpu().data.numpy()[0]
        
        weights = np.mean(gradients, axis=(1, 2))
        cam = np.zeros(activations.shape[1:], dtype=np.float32)
        
        for i, weight in enumerate(weights):
            cam += weight * activations[i]
            
        cam = np.maximum(cam, 0)
        # Prevent division by zero
        denom = np.max(cam) - np.min(cam)
        if denom == 0: denom = 1e-8
        cam = (cam - np.min(cam)) / denom
        
        return cam, torch.sigmoid(logits)

# ==========================================
# 3. Initialization
# ==========================================
device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
model = DenseNet121_8Class(num_classes=8)
model_path = os.path.join(os.path.dirname(__file__), "best_densenet_model.pth")

try:
    checkpoint = torch.load(model_path, map_location=device)
    state_dict = checkpoint['model_state_dict'] if 'model_state_dict' in checkpoint else checkpoint
    model.load_state_dict(state_dict, strict=False)
except Exception as e:
    print(f"Weights Warning: {e}")

model.to(device)
model.eval()

# ✅ One-time Grad-CAM setup to avoid overlapping hooks
grad_cam_tool = GradCAM(model, target_layer=model.densenet.features.norm5)

def send_email_alert(diagnosis, patient_id, recipient_email=None):
    """Sends a professional clinical alert via Gmail."""
    # 🏥 Fallback to Log if no specific recipient provided
    target_email = recipient_email or RECIPIENT_LOG
    
    if not SENDER_EMAIL or not SENDER_PASSWORD or not target_email:
        print("⚠️ Email credentials missing. Skipping alert.")
        return

    try:
        from email.mime.multipart import MIMEMultipart
        from email.mime.text import MIMEText
        import smtplib

        msg = MIMEMultipart()
        msg['From'] = SENDER_EMAIL
        msg['To'] = target_email
        msg['Subject'] = f"CRITICAL: X-Ray Alert for Patient ID #{patient_id}"

        body = f"URGENT CLINICAL NOTICE:\n\nA high-risk diagnostic finding ({diagnosis}) has been detected for Patient ID: {patient_id}.\n\nPlease log in to the portal to review the diagnostic heatmap and patient history immediately."
        msg.attach(MIMEText(body, 'plain'))

        server = smtplib.SMTP(SMTP_SERVER, SMTP_PORT)
        server.starttls()
        server.login(SENDER_EMAIL, SENDER_PASSWORD)
        server.send_message(msg)
        server.quit()
        print(f"📧 Alert successfully sent to: {target_email}")
    except Exception as e:
        print(f"Email Warning: {e}")

# ==========================================
# 4. Final Prediction Pipeline
# ==========================================
def predict(image_path, patient_id=0):
    try:
        # Load and transform
        img_pil = Image.open(image_path).convert('RGB')
        transform = transforms.Compose([
            transforms.Resize((224, 224)),
            transforms.ToTensor(),
            transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
        ])
        input_tensor = transform(img_pil).unsqueeze(0).to(device)

        # 1. First pass (Winning prediction)
        with torch.no_grad():
            outputs = model(input_tensor)
            probs = torch.sigmoid(outputs).cpu().numpy()[0]
        
        max_idx = int(np.argmax(probs))
        disease = LABELS[max_idx]
        max_prob = float(probs[max_idx])

        # 2. Second pass (Grad-CAM Heatmap)
        heatmap, _ = grad_cam_tool.generate_heatmap(input_tensor, max_idx)
        
        if heatmap is not None:
            heatmap_resized = cv2.resize(heatmap, (224, 224))
            heatmap_color = cv2.applyColorMap(np.uint8(255 * heatmap_resized), cv2.COLORMAP_JET)
            heatmap_color = cv2.cvtColor(heatmap_color, cv2.COLOR_BGR2RGB)
            original_np = np.array(img_pil.resize((224, 224)))
            superimposed = np.uint8(heatmap_color * 0.4 + original_np * 0.6)
            
            heatmap_filename = f"heatmap_{os.path.basename(image_path)}"
            heatmap_path = os.path.join(os.path.dirname(image_path), heatmap_filename)
            Image.fromarray(superimposed).save(heatmap_path)
        else:
            heatmap_path = image_path

        # 3. Decision Support & Alerting
        is_critical = disease in CRITICAL_DISEASES and max_prob > 0.3
        # Note: app.py will handle calling send_email_alert with the correct recipient

        if max_prob < 0.2:
            return "Normal / No Finding", 0.0, image_path, False

        return disease, max_prob, heatmap_path, is_critical

    except Exception as e:
        import traceback
        return f"Error: {str(e)}", 0.0, image_path, False
