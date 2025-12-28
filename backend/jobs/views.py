from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Job
from .serializers import JobSerializer
from rest_framework import filters

class JobViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = JobSerializer

    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ("company", "title", "note")
    ordering_fields = ("created_at", "updated_at", "applied_at", "status")
    ordering = ("-updated_at",)

    def get_queryset(self):
        return Job.objects.filter(owner=self.request.user)

    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)

    @action(detail=True, methods=["post"])
    def transition(self, request, pk=None):
        job = self.get_object()
        to_status = request.data.get("to_status")

        if not to_status:
            return Response({"to_status": "This field is required."}, status=400)

        if not job.can_transition_to(to_status):
            return Response(
                {"detail": f"Invalid status transition: {job.status} -> {to_status}"},
                status=400,
            )

        job.status = to_status
        job.save(update_fields=["status", "updated_at"])
        return Response(JobSerializer(job).data, status=status.HTTP_200_OK)