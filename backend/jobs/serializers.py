from rest_framework import serializers
from .models import Job

class JobSerializer(serializers.ModelSerializer):
    owner = serializers.ReadOnlyField(source="owner.username")
    can_transition_to = serializers.SerializerMethodField()

    class Meta:
        model = Job
        fields = "__all__"
        read_only_fields = ("owner",)

    def get_can_transition_to(self, obj):
        # ✅ 过滤掉“原地踏步”按钮，只返回真正可变更的目标状态
        return [s for s in obj.allowed_transitions() if s != obj.status]

    def validate_status(self, value):
        # 创建时：不需要校验流转（因为还没有 instance）
        if self.instance is None:
            return value

        # 更新时：校验状态是否允许流转（兜底保险）
        if not self.instance.can_transition_to(value):
            raise serializers.ValidationError(
                f"Invalid status transition: {self.instance.status} -> {value}"
            )
        return value
