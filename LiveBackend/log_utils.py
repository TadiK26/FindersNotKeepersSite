from datetime import datetime
from extensions import db
from models import AuditLog, Report

def log_audit(userID,action,details=None):
    #Save  logins audit entries
    userlogsin=AuditLog(
        userID=userID,
        action=action,
        timestamp=datetime.utcnow(),
        details=details
    )
    db.session.add(userlogsin)
    db.session.commit()
    return userlogsin


#get the app audit logs,if the user id is given, filter by that user
def get_audit_logs(userID=None):
    query=AuditLog.query
    if userID:
        query=query.filter_by(userID=userID)
    return query.order_by(AuditLog.timestamp.desc()).all()


#Create a new report entry
def create_report(report_type, content):
    new_report=Report(
        reportType=report_type,
        content=content,
        dateGenerated=datetime.utcnow()
    )
    db.session.add(new_report)
    db.session.commit()
    return new_report

#View reports,if report id is given, return that specific report
def view_reports(report_id=None):
    if report_id:
        return Report.query.get(report_id)
    return Report.query.order_by(Report.dateGenerated.desc()).all()
