from flask import Blueprint, jsonify, request, send_file
from flask_login import login_required, current_user
import os, shutil, json
from datetime import datetime

backup_bp = Blueprint('backup', __name__)

_BASE = os.path.dirname(os.path.abspath(__file__))
BACKUP_DIR   = os.path.normpath(os.path.join(_BASE, '..', 'backups'))
SETTINGS_FILE = os.path.normpath(os.path.join(_BASE, '..', 'config', 'settings.json'))
DB_PATH      = os.path.normpath(os.path.join(_BASE, '..', 'instance', 'dental.db'))


def ensure_backup_dir():
    os.makedirs(BACKUP_DIR, exist_ok=True)


def load_settings():
    if os.path.exists(SETTINGS_FILE):
        with open(SETTINGS_FILE, 'r', encoding='utf-8') as f:
            return json.load(f)
    return {
        'auto_backup': {
            'enabled': False,
            'interval': 'daily',
            'hour': 2,
            'minute': 0,
            'max_backups': 10,
            'last_backup': None,
        }
    }


def save_settings(settings):
    os.makedirs(os.path.dirname(SETTINGS_FILE), exist_ok=True)
    with open(SETTINGS_FILE, 'w', encoding='utf-8') as f:
        json.dump(settings, f, indent=2, ensure_ascii=False)


def cleanup_old_backups(max_backups):
    ensure_backup_dir()
    files = sorted([f for f in os.listdir(BACKUP_DIR) if f.endswith('.db')])
    while len(files) > max_backups:
        os.remove(os.path.join(BACKUP_DIR, files.pop(0)))


def do_backup():
    ensure_backup_dir()
    if not os.path.exists(DB_PATH):
        return None, 'ملف قاعدة البيانات غير موجود'
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    filename = f'dental_backup_{timestamp}.db'
    dest = os.path.join(BACKUP_DIR, filename)
    shutil.copy2(DB_PATH, dest)
    return filename, None


def scheduled_backup():
    filename, err = do_backup()
    if not err:
        settings = load_settings()
        max_backups = settings.get('auto_backup', {}).get('max_backups', 10)
        cleanup_old_backups(max_backups)
        settings.setdefault('auto_backup', {})['last_backup'] = datetime.now().isoformat()
        save_settings(settings)


# ── Routes ────────────────────────────────────────────────────────────────────

@backup_bp.route('/backup/create', methods=['POST'])
@login_required
def create_backup_route():
    if current_user.role != 'admin':
        return jsonify({'error': 'غير مصرح لك بهذه العملية'}), 403
    filename, err = do_backup()
    if err:
        return jsonify({'error': err}), 500
    settings = load_settings()
    max_backups = settings.get('auto_backup', {}).get('max_backups', 10)
    cleanup_old_backups(max_backups)
    settings.setdefault('auto_backup', {})['last_backup'] = datetime.now().isoformat()
    save_settings(settings)
    return jsonify({'message': 'تم إنشاء النسخة الاحتياطية بنجاح', 'filename': filename})


@backup_bp.route('/backup/list', methods=['GET'])
@login_required
def list_backups():
    if current_user.role != 'admin':
        return jsonify({'error': 'غير مصرح لك بهذه العملية'}), 403
    ensure_backup_dir()
    files = []
    for f in sorted(os.listdir(BACKUP_DIR), reverse=True):
        if f.endswith('.db'):
            path = os.path.join(BACKUP_DIR, f)
            stat = os.stat(path)
            files.append({
                'filename': f,
                'size': stat.st_size,
                'created_at': datetime.fromtimestamp(stat.st_mtime).isoformat(),
            })
    return jsonify(files)


@backup_bp.route('/backup/download/<path:filename>', methods=['GET'])
@login_required
def download_backup(filename):
    if current_user.role != 'admin':
        return jsonify({'error': 'غير مصرح لك بهذه العملية'}), 403
    filepath = os.path.join(BACKUP_DIR, filename)
    if not os.path.exists(filepath):
        return jsonify({'error': 'الملف غير موجود'}), 404
    return send_file(filepath, as_attachment=True, download_name=filename)


@backup_bp.route('/backup/<path:filename>', methods=['DELETE'])
@login_required
def delete_backup(filename):
    if current_user.role != 'admin':
        return jsonify({'error': 'غير مصرح لك بهذه العملية'}), 403
    filepath = os.path.join(BACKUP_DIR, filename)
    if not os.path.exists(filepath):
        return jsonify({'error': 'الملف غير موجود'}), 404
    os.remove(filepath)
    return jsonify({'message': 'تم حذف النسخة الاحتياطية'})


@backup_bp.route('/settings', methods=['GET'])
@login_required
def get_settings():
    if current_user.role != 'admin':
        return jsonify({'error': 'غير مصرح لك بهذه العملية'}), 403
    return jsonify(load_settings())


@backup_bp.route('/settings', methods=['POST'])
@login_required
def update_settings():
    if current_user.role != 'admin':
        return jsonify({'error': 'غير مصرح لك بهذه العملية'}), 403
    data = request.get_json() or {}
    settings = load_settings()
    if 'auto_backup' in data:
        settings['auto_backup'] = {**settings.get('auto_backup', {}), **data['auto_backup']}
    save_settings(settings)
    try:
        from utils.scheduler import reschedule_backup
        reschedule_backup(settings)
    except Exception:
        pass
    return jsonify({'message': 'تم حفظ الإعدادات بنجاح'})
