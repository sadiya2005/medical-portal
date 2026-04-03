import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

SENDER_EMAIL = "ssadiyasheeraj@gmail.com"
SENDER_PASSWORD = "wbsfrgehctpzcchw"
RECIPIENT_LOG = "ssadiyasheeraj@gmail.com" 
SMTP_SERVER = "smtp.gmail.com"
SMTP_PORT = 587

def test_send_email():
    try:
        print("Attempting to send test email...")
        msg = MIMEMultipart()
        msg['From'] = SENDER_EMAIL
        msg['To'] = RECIPIENT_LOG
        msg['Subject'] = "TEST: Email Alert System"

        body = "This is a test to verify the email alert system for the AI Healthcare Diagnostic system."
        msg.attach(MIMEText(body, 'plain'))

        server = smtplib.SMTP(SMTP_SERVER, SMTP_PORT)
        server.set_debuglevel(1) # See the communication
        server.starttls()
        server.login(SENDER_EMAIL, SENDER_PASSWORD)
        server.send_message(msg)
        server.quit()
        print("Success: Email sent successfully!")
    except Exception as e:
        print(f"Failure: {e}")

if __name__ == "__main__":
    test_send_email()
