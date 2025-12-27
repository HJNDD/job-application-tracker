from django.db import models
from django.contrib.auth.models import User

class Job(models.Model):
    class Status(models.TextChoices):
        APPLIED = "applied", "Applied"
        INTERVIEW = "interview", "Interview"
        OFFER = "offer", "Offer"
        REJECTED = "rejected", "Rejected"

    TERMINAL_STATUSES = {Status.OFFER, Status.REJECTED}
    ALLOWED_TRANSITIONS = {
        Status.APPLIED: {Status.APPLIED, Status.INTERVIEW, Status.REJECTED},
        Status.INTERVIEW: {Status.INTERVIEW, Status.OFFER, Status.REJECTED},
        Status.OFFER: {Status.OFFER},
        Status.REJECTED: {Status.REJECTED},
    }

    owner = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="jobs",
    )

    company = models.CharField(max_length=120)
    title = models.CharField(max_length=120)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.APPLIED)
    applied_at = models.DateField(null=True, blank=True)
    note = models.TextField(blank=True, default="")

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def can_transition_to(self, new_status: str) -> bool:
        current = self.status
        allowed = self.ALLOWED_TRANSITIONS.get(current, {current})
        return new_status in allowed

    def __str__(self):
        return f"{self.company} - {self.title}"
