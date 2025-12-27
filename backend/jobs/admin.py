from django.contrib import admin
from .models import Job

@admin.register(Job)
class JobAdmin(admin.ModelAdmin):
    list_display = ("id", "company", "title", "status", "owner", "applied_at", "updated_at")
    list_filter = ("status",)
    search_fields = ("company", "title")
