from django.urls import path
from .admin_views import AdminStatsView, AdminLiveActivityView, AdminNotificationsView, AdminAllSwapsView

urlpatterns = [
    path('dashboard-stats/', AdminStatsView.as_view(), name='admin-dashboard-stats'),
    path('recent-activities/', AdminLiveActivityView.as_view(), name='admin-recent-activities'),
    path('notifications/', AdminNotificationsView.as_view(), name='admin-notifications'),
    path('swaps/', AdminAllSwapsView.as_view(), name='admin-swaps'),
]
