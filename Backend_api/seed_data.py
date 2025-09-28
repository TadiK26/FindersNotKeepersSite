from app import create_app
from extensions import db
from models import AuditLog, Report, userModel
from datetime import datetime, timedelta
import random

def seed_audit_logs():
    users=userModel.query.all()
    if not users:
        print("No users found! Please register users first.")
        return
    
    sample_actions=["LOGIN","LOGOUT","CREATE_REPORT","DELETE_USER"]
    
    for _ in range(10):
        user=random.choice(users)
        log=AuditLog(
            userID=user.userID,
            action=random.choice(sample_actions),
            timestamp=datetime.utcnow()-timedelta(days=random.randint(0,30)),
            details=f"IP: 192.168.1.{random.randint(2,254)}, UA: Chrome"
        )
        db.session.add(log)
    db.session.commit()
    print("Audit logs seeded succcessfuly")

def seed_report_logs():
    sample_criteria=["Monthly Activity","userModel Login Stats","Security Audit"]
    
    for _ in range(5):
        report=Report(
            reportType=random.choice(sample_criteria),
            content="Sample report content",
            dateGenerated=datetime.utcnow()
        )
        db.session.add(report)
    db.session.commit()
    print("Report logs seeded successfully")

if __name__ == "__main__":
    app = create_app()
    with app.app_context():
        seed_audit_logs()
        seed_report_logs()
        print("Seeding completed.")
