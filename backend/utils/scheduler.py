from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger

scheduler = BackgroundScheduler(daemon=True)


def init_scheduler(app):
    from routes.backup_routes import scheduled_backup, load_settings
    with app.app_context():
        settings = load_settings()
    auto = settings.get('auto_backup', {})
    if auto.get('enabled'):
        _add_job(auto)
    if not scheduler.running:
        scheduler.start()


def reschedule_backup(settings):
    auto = settings.get('auto_backup', {})
    try:
        scheduler.remove_job('auto_backup')
    except Exception:
        pass
    if auto.get('enabled'):
        _add_job(auto)


def _add_job(auto):
    from routes.backup_routes import scheduled_backup
    interval = auto.get('interval', 'daily')
    hour     = int(auto.get('hour', 2))
    minute   = int(auto.get('minute', 0))

    if interval == 'weekly':
        trigger = CronTrigger(day_of_week='mon', hour=hour, minute=minute)
    elif interval == 'monthly':
        trigger = CronTrigger(day=1, hour=hour, minute=minute)
    else:
        trigger = CronTrigger(hour=hour, minute=minute)

    scheduler.add_job(
        scheduled_backup,
        trigger,
        id='auto_backup',
        replace_existing=True,
        misfire_grace_time=3600,
    )
