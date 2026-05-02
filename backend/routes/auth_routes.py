from functools import wraps
from flask import Blueprint, request, jsonify
from flask_login import login_user, logout_user, login_required, current_user
from models import User, VALID_ROLES, Professional
from database import db

auth_bp = Blueprint("auth", __name__)


def admin_required(f):
    @wraps(f)
    @login_required
    def decorated(*args, **kwargs):
        if current_user.role != 'admin':
            return jsonify({"message": "Admin access required"}), 403
        return f(*args, **kwargs)
    return decorated


@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.get_json()
    username = data.get("username")
    password = data.get("password")
    user = User.query.filter_by(username=username).first()
    if user and user.check_password(password):
        login_user(user)
        profs = Professional.query.filter_by(user_id=user.id).all()
        return jsonify({
            "message":          "Logged in successfully",
            "username":         user.username,
            "role":             user.role,
            "professional_ids": [p.id for p in profs],
        }), 200
    return jsonify({"message": "بيانات الدخول غير صحيحة"}), 401


@auth_bp.route("/logout", methods=["POST"])
@login_required
def logout():
    logout_user()
    return jsonify({"message": "Logged out successfully"}), 200


@auth_bp.route("/register", methods=["POST"])
def register():
    data     = request.get_json()
    username = data.get("username", "").strip()
    password = data.get("password", "")
    role     = data.get("role", "doctor")

    if not username or not password:
        return jsonify({"message": "اسم المستخدم وكلمة المرور مطلوبان"}), 400

    if User.query.filter_by(username=username).first():
        return jsonify({"message": "اسم المستخدم موجود مسبقاً"}), 400

    user_count = User.query.count()
    if user_count == 0:
        role = 'admin'          # First user ever → admin automatically
    else:
        if not current_user.is_authenticated or current_user.role != 'admin':
            return jsonify({"message": "فقط المدير يمكنه إنشاء حسابات جديدة"}), 403
        if role not in VALID_ROLES:
            return jsonify({"message": "الصلاحية غير صالحة"}), 400

    user = User(username=username, role=role)
    user.set_password(password)
    db.session.add(user)
    db.session.commit()
    return jsonify({"message": "تم إنشاء الحساب", "role": role}), 201


# ── User Management (admin only) ─────────────────────────────────────────────

@auth_bp.route("/users", methods=["GET"])
@admin_required
def list_users():
    users = User.query.order_by(User.created_at).all()
    return jsonify([u.to_dict() for u in users])


@auth_bp.route("/users/<int:user_id>", methods=["PUT"])
@admin_required
def update_user(user_id):
    user = User.query.get_or_404(user_id)
    data = request.get_json()

    if 'role' in data:
        if data['role'] not in VALID_ROLES:
            return jsonify({"message": "الصلاحية غير صالحة"}), 400
        if user.id == current_user.id and data['role'] != 'admin':
            return jsonify({"message": "لا يمكنك تغيير صلاحيتك"}), 400
        user.role = data['role']

    if data.get('password'):
        user.set_password(data['password'])

    db.session.commit()
    return jsonify(user.to_dict())


@auth_bp.route("/users/<int:user_id>", methods=["DELETE"])
@admin_required
def delete_user(user_id):
    if user_id == current_user.id:
        return jsonify({"message": "لا يمكنك حذف حسابك الخاص"}), 400
    user = User.query.get_or_404(user_id)
    db.session.delete(user)
    db.session.commit()
    return jsonify({"message": "تم حذف المستخدم"})


@auth_bp.route("/users/<int:user_id>/link-professional", methods=["PUT"])
@admin_required
def link_professional(user_id):
    User.query.get_or_404(user_id)
    data             = request.get_json()
    professional_ids = data.get("professional_ids", [])  # list of IDs

    # Clear all previous links for this user
    Professional.query.filter_by(user_id=user_id).update({"user_id": None})

    blocked = []
    for prof_id in professional_ids:
        prof = Professional.query.get(prof_id)
        if not prof:
            continue
        if prof.user_id and prof.user_id != user_id:
            blocked.append(prof_id)
            continue
        prof.user_id = user_id

    db.session.commit()
    if blocked:
        return jsonify({"message": f"بعض الملفات مرتبطة بمستخدمين آخرين: {blocked}"}), 400
    return jsonify({"professional_ids": professional_ids})
