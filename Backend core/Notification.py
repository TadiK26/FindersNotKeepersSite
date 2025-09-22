class Notification:
    """Handles sending notifications to users."""
    
    def __init__(self, notificationType: int, listId = None, imageID = None, claimantID = None):
        if notificationType == 1:
            self.SendClaimNoti()
        elif notificationType == 2:
            self.SendMatchNoti()
        elif notificationType == 3:
            self.SendNewListingNoti(listId)
        elif notificationType == 4:
            self.SendAdminNoti()
        elif notificationType == 5:
            self.SendVerificationReq(imageID, listId, claimantID)

    def SendClaimNoti(self):
        """Send notification when someone claims an item."""
        pass
    
    def SendMatchNoti(self):
        """Send notification when a potential match is found."""
        pass
    
    def SendNewListingNoti(self, listID: int):
        """Send notification about new item listings."""
        pass
    
    def SendAdminNoti(self):
        """Send notification from administrators to user"""
        pass

    def SendVerificationReq(self, ImageID, ListingID, ClaimaintID):
        """Send notification to administrators requesting claim verification"""
        pass