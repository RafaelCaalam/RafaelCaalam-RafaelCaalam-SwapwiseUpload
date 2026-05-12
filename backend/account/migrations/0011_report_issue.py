from django.db import migrations, models
import django.db.models.deletion
from django.conf import settings


class Migration(migrations.Migration):

    dependencies = [
        ('account', '0010_booking_cancellation_confirmed_by_and_more'),
    ]

    operations = [
        migrations.AddField(
            model_name='report',
            name='category',
            field=models.CharField(choices=[('UI/UX Bug', 'UI/UX Bug'), ('Functional Issue', 'Functional Issue'), ('Harassment/Safety', 'Harassment/Safety'), ('Billing Question', 'Billing Question'), ('Other', 'Other')], default='Other', max_length=50),
        ),
        migrations.AddField(
            model_name='report',
            name='severity',
            field=models.CharField(choices=[('low', 'Low'), ('medium', 'Medium'), ('high', 'High')], default='low', max_length=20),
        ),
        migrations.AlterField(
            model_name='report',
            name='reported_user',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, related_name='reports_received', to=settings.AUTH_USER_MODEL),
        ),
    ]
