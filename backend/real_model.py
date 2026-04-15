import os
import random

CLASS_NAMES = ["Effusion", "Infiltration", "Atelectasis", "Mass", "Pneumothorax", "Consolidation", "Cardiomegaly", "Edema"]

def predict(image_path):
    """Zero-memory fake prediction for cloud presentations."""
    try:
        # Determine disease
        is_normal = random.random() < 0.3 # 30% chance of Normal
        if is_normal:
            disease = "No Findings (Normal)"
            confidence = round(random.uniform(0.85, 0.99), 2)
        else:
            disease = random.choice(CLASS_NAMES)
            confidence = round(random.uniform(0.65, 0.95), 2)

        # Determine if critical
        critical_diseases = ['Pneumothorax', 'Edema', 'Consolidation']
        is_critical = any(d in disease for d in critical_diseases) and confidence > 0.8
        
        # Determine Heatmap (Just return original image for zero-memory, OR you could add PIL logic here)
        heatmap_path = image_path.replace("uploads", "uploads/heatmaps")
        generate_gradcam(image_path, heatmap_path)

        return disease, confidence, heatmap_path, is_critical

    except Exception as e:
        print(f"Prediction Error: {e}")
        return "Normal", 0.99, image_path, False

def generate_gradcam(image_path, output_path):
    """Zero-memory mock Grad-CAM using purely PIL, removing the 100MB OpenCV dependency."""
    try:
        from PIL import Image, ImageDraw
        img = Image.open(image_path).convert('RGB')
        
        # Create a semi-transparent red overlay
        overlay = Image.new('RGBA', img.size, (255, 0, 0, 0))
        draw = ImageDraw.Draw(overlay)
        
        # Draw a blurry-looking targeted circle to look like a heatmap
        w, h = img.size
        cx = w // 2 + random.randint(-40, 40)
        cy = h // 2 + random.randint(-40, 40)
        radius = w // 4
        
        draw.ellipse((cx - radius, cy - radius, cx + radius, cy + radius), fill=(255, 50, 50, 120))
        
        # Combine
        img = img.convert('RGBA')
        final_img = Image.alpha_composite(img, overlay).convert('RGB')
        
        output_dir = os.path.dirname(output_path)
        if not os.path.exists(output_dir):
            os.makedirs(output_dir, exist_ok=True)
            
        final_img.save(output_path)
    except Exception as e:
        print(f"Mock Grad-CAM Error: {e}")

def send_email_alert(disease, patient_id, recipient_email):
    """Unchanged"""
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
