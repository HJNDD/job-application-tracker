from rest_framework import serializers
from .models import Job

class JobSerializer(serializers.ModelSerializer):
    owner = serializers.ReadOnlyField(source="owner.username")

    class Meta:
        model = Job
        fields = "__all__"

    def validate_status(self, value):
        # 创建时：不需要校验流转（因为还没有 instance）
        if self.instance is None:
            return value

        # 更新时：校验状态是否允许流转
        if not self.instance.can_transition_to(value):
            raise serializers.ValidationError(
                f"Invalid status transition: {self.instance.status} -> {value}"
            )
        return value