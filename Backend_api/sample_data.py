from app import create_app
from extensions import db
from models import AuditLog, Report
from datetime import datetime, timedelta
import random

sample_users = [1, 2, 3]  # Replace with actual UserIDs in your Users table
sample_actions = ["LOGIN", "LOGOUT", "CREATE_REPORT", "DELETE_USER"]
sample_criteria = ["Monthly Activity", "userModel Login Stats", "Security Audit"]

def seed_audit_logs():
    for _ in range(10):
        log = AuditLog(
            userID=random.choice(sample_users),
            action=random.choice(sample_actions),
            timestamp=datetime.utcnow() - timedelta(days=random.randint(0, 30)),
            details=f"IP: 192.168.1.{random.randint(2,254)}, UA: Chrome"
        )
        db.session.add(log)
    db.session.commit()

def seed_report_logs():
    for _ in range(5):
        report = Report(
            reportType=random.choice(sample_criteria),
            content="Sample report content",
            dateGenerated=datetime.utcnow() - timedelta(days=random.randint(0,30))
        )
        db.session.add(report)
    db.session.commit()

if __name__ == "__main__":
    app = create_app()
    with app.app_context():
        seed_audit_logs()
        seed_report_logs()
        print("Seeded AuditLog and ReportLog successfully!")
