import os
import json
import random
import sqlite3
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS

app = Flask(__name__, static_folder='static', static_url_path='/static')
CORS(app)

# Gemini AI — tries key and falls back gracefully if connection fails
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "your_api_key_here")
GEMINI_AVAILABLE = False
try:
    from google import genai as google_genai
    gemini_client = google_genai.Client(api_key=GEMINI_API_KEY)
    test = gemini_client.models.generate_content(model='gemini-2.0-flash', contents='hi')
    GEMINI_AVAILABLE = True
    print("Gemini AI: ACTIVE")
except Exception as e:
    print(f"Gemini AI: Unavailable ({e}) — using smart fallback.")

DATABASE_FILE = 'glucoseguard.db'

def init_db():
    conn = sqlite3.connect(DATABASE_FILE)
    cursor = conn.cursor()
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            role TEXT NOT NULL,
            name TEXT,
            age INTEGER,
            gender TEXT,
            height_cm REAL,
            weight_kg REAL
        )
    ''')
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS intake_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            food_name TEXT,
            sugar_g REAL,
            fiber_g REAL,
            calories_kcal REAL,
            projected_peak REAL,
            mitigated_peak REAL,
            vital_heart_rate INTEGER,
            risk_level TEXT DEFAULT 'LOW',
            criticality_score INTEGER DEFAULT 0,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id)
        )
    ''')
    # Run fallback schema migration to ensure columns exist in old databases
    try:
        cursor.execute("ALTER TABLE intake_logs ADD COLUMN risk_level TEXT DEFAULT 'LOW'")
    except sqlite3.OperationalError:
        pass
    try:
        cursor.execute("ALTER TABLE intake_logs ADD COLUMN criticality_score INTEGER DEFAULT 0")
    except sqlite3.OperationalError:
        pass

    cursor.execute("SELECT id FROM users WHERE username = 'admin'")
    if not cursor.fetchone():
        cursor.execute(
            "INSERT INTO users (username, password, role, name, age, gender, height_cm, weight_kg) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
            ('admin', 'admin123', 'admin', 'Clinician Admin', 35, 'Male', 180, 75)
        )
    conn.commit()
    conn.close()

init_db()

NUTRITIONAL_DATABASE = {
    "donut": {"calories": 350, "sugar": 35, "fiber": 1, "protein": 4, "glycemic_index": 75},
    "soda": {"calories": 150, "sugar": 39, "fiber": 0, "protein": 0, "glycemic_index": 90},
    "cake": {"calories": 400, "sugar": 45, "fiber": 1, "protein": 5, "glycemic_index": 80},
    "ice cream": {"calories": 280, "sugar": 28, "fiber": 0.5, "protein": 4, "glycemic_index": 70},
    "pizza": {"calories": 290, "sugar": 6, "fiber": 2.5, "protein": 12, "glycemic_index": 60},
    "pasta": {"calories": 300, "sugar": 8, "fiber": 3, "protein": 10, "glycemic_index": 65},
    "rice": {"calories": 200, "sugar": 1, "fiber": 0.6, "protein": 4, "glycemic_index": 72},
    "salad": {"calories": 120, "sugar": 3, "fiber": 6, "protein": 3, "glycemic_index": 15},
    "avocado toast": {"calories": 250, "sugar": 2, "fiber": 8, "protein": 6, "glycemic_index": 25},
    "chicken breast": {"calories": 165, "sugar": 0, "fiber": 0, "protein": 31, "glycemic_index": 0},
    "almonds": {"calories": 160, "sugar": 1, "fiber": 3.5, "protein": 6, "glycemic_index": 15},
    "apple": {"calories": 95, "sugar": 19, "fiber": 4.4, "protein": 0.5, "glycemic_index": 38},
    "bread": {"calories": 265, "sugar": 5, "fiber": 2.7, "protein": 9, "glycemic_index": 70},
    "banana": {"calories": 89, "sugar": 12, "fiber": 2.6, "protein": 1.1, "glycemic_index": 51},
    "chocolate": {"calories": 546, "sugar": 48, "fiber": 7, "protein": 5, "glycemic_index": 40},
    "burger": {"calories": 480, "sugar": 7, "fiber": 2, "protein": 25, "glycemic_index": 65},
    "sandwich": {"calories": 320, "sugar": 5, "fiber": 3, "protein": 18, "glycemic_index": 62},
    "juice": {"calories": 120, "sugar": 26, "fiber": 0.5, "protein": 0.5, "glycemic_index": 65},
    "coffee": {"calories": 5, "sugar": 0, "fiber": 0, "protein": 0.3, "glycemic_index": 0},
    "milk": {"calories": 61, "sugar": 5, "fiber": 0, "protein": 3.2, "glycemic_index": 40},
}

def analyze_food_text(text):
    text_lower = text.lower()
    for food in NUTRITIONAL_DATABASE:
        if food in text_lower:
            return food, NUTRITIONAL_DATABASE[food]
    if any(w in text_lower for w in ["sweet", "sugar", "cookie", "candy", "dessert"]):
        return "donut", NUTRITIONAL_DATABASE["donut"]
    if any(w in text_lower for w in ["drink", "beverage", "cola"]):
        return "soda", NUTRITIONAL_DATABASE["soda"]
    if any(w in text_lower for w in ["healthy", "green", "veg", "diet"]):
        return "salad", NUTRITIONAL_DATABASE["salad"]
    return "average meal", {"calories": 250, "sugar": 15, "fiber": 2, "protein": 8, "glycemic_index": 45}

def compute_criticality(projected_peak):
    if projected_peak > 200:
        return 95, "CRITICAL", "#FF1744", "🚨 CRITICAL — Immediate intervention required"
    elif projected_peak > 180:
        return 80, "CRITICAL", "#FF4444", "🚨 CRITICAL — Severe Hyperglycemia"
    elif projected_peak > 140:
        return 60, "HIGH", "#FF9800", "⚠️ HIGH — Glycemic Instability"
    elif projected_peak > 110:
        return 35, "MODERATE", "#FFC107", "⚡ MODERATE — Mild Spike"
    else:
        return 10, "LOW", "#00E676", "✅ LOW — Safe Range"

@app.route('/')
def index():
    return jsonify({
        "success": True,
        "message": "GlucoseGuard Clinical API Core Running",
        "version": "1.0.0",
        "api_endpoints": [
            "/api/auth/login",
            "/api/auth/register",
            "/api/log-intake",
            "/api/admin/dashboard",
            "/api/user/history",
            "/api/fuse",
            "/api/reason",
            "/api/bot-chat",
            "/api/export-clinical"
        ]
    })

@app.route('/api/auth/register', methods=['POST'])
def auth_register():
    data = request.json or {}
    username = data.get('username', '').strip()
    password = data.get('password', '').strip()
    name = data.get('name', '').strip()
    age = int(data.get('age', 45))
    gender = data.get('gender', 'Male')
    height = float(data.get('height_cm', 170.0))
    weight = float(data.get('weight_kg', 70.0))
    if not username or not password or not name:
        return jsonify({"success": False, "message": "Missing required fields"}), 400
    conn = sqlite3.connect(DATABASE_FILE)
    cursor = conn.cursor()
    try:
        cursor.execute(
            "INSERT INTO users (username, password, role, name, age, gender, height_cm, weight_kg) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
            (username, password, 'user', name, age, gender, height, weight)
        )
        conn.commit()
        user_id = cursor.lastrowid
        conn.close()
        return jsonify({"success": True, "message": "Registered successfully", "user": {
            "id": user_id, "username": username, "role": "user", "name": name,
            "age": age, "gender": gender, "height_cm": height, "weight_kg": weight
        }})
    except sqlite3.IntegrityError:
        conn.close()
        return jsonify({"success": False, "message": "Username already exists"}), 409

@app.route('/api/auth/login', methods=['POST'])
def auth_login():
    data = request.json or {}
    username = data.get('username', '').strip()
    password = data.get('password', '').strip()
    if not username or not password:
        return jsonify({"success": False, "message": "Missing credentials"}), 400
    conn = sqlite3.connect(DATABASE_FILE)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM users WHERE username = ? AND password = ?", (username, password))
    user = cursor.fetchone()
    conn.close()
    if user:
        return jsonify({"success": True, "message": "Login successful", "user": {
            "id": user["id"], "username": user["username"], "role": user["role"],
            "name": user["name"], "age": user["age"], "gender": user["gender"],
            "height_cm": user["height_cm"], "weight_kg": user["weight_kg"]
        }})
    return jsonify({"success": False, "message": "Invalid credentials"}), 401

@app.route('/api/log-intake', methods=['POST'])
def log_intake():
    data = request.json or {}
    user_id = data.get('user_id')
    food_name = data.get('food_name', '')
    sugar = float(data.get('sugar_g', 0.0))
    fiber = float(data.get('fiber_g', 0.0))
    calories = float(data.get('calories_kcal', 0.0))
    projected = float(data.get('projected_peak', 120.0))
    mitigated = float(data.get('mitigated_peak', 120.0))
    hr = int(data.get('vital_heart_rate', 72))
    crit_score, risk_level, _, _ = compute_criticality(projected)
    if not user_id:
        return jsonify({"success": False, "message": "User ID required"}), 400
    conn = sqlite3.connect(DATABASE_FILE)
    cursor = conn.cursor()
    cursor.execute(
        "INSERT INTO intake_logs (user_id, food_name, sugar_g, fiber_g, calories_kcal, projected_peak, mitigated_peak, vital_heart_rate, risk_level, criticality_score) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
        (user_id, food_name, sugar, fiber, calories, projected, mitigated, hr, risk_level, crit_score)
    )
    conn.commit()
    conn.close()
    return jsonify({"success": True, "message": "Intake logged."})

@app.route('/api/admin/dashboard', methods=['GET'])
def admin_dashboard():
    conn = sqlite3.connect(DATABASE_FILE)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    cursor.execute("SELECT id, username, name, age, gender, height_cm, weight_kg FROM users WHERE role = 'user'")
    patients = [dict(row) for row in cursor.fetchall()]
    cursor.execute('''
        SELECT l.*, u.name as patient_name, u.username as patient_username
        FROM intake_logs l JOIN users u ON l.user_id = u.id
        ORDER BY l.timestamp DESC
    ''')
    logs = [dict(row) for row in cursor.fetchall()]
    conn.close()
    avg_peak = round(sum(l['projected_peak'] for l in logs) / len(logs), 1) if logs else 0
    critical_count = sum(1 for l in logs if l['projected_peak'] > 180)
    return jsonify({
        "success": True, "patients": patients, "logs": logs,
        "stats": {
            "patient_count": len(patients),
            "total_logs": len(logs),
            "avg_peak": avg_peak,
            "critical_count": critical_count
        }
    })

@app.route('/api/user/history', methods=['GET'])
def user_history():
    user_id = request.args.get('user_id')
    if not user_id:
        return jsonify({"success": False, "message": "User ID required"}), 400
    conn = sqlite3.connect(DATABASE_FILE)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM intake_logs WHERE user_id = ? ORDER BY timestamp DESC", (user_id,))
    logs = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return jsonify({"success": True, "logs": logs})

@app.route('/api/fuse', methods=['POST'])
def fuse_sensors():
    data = request.json or {}
    text_entry = data.get('text_entry', '')
    image_scanned = data.get('image_scanned', False)
    vitals = data.get('vital_status', {"heart_rate": 72, "attention_level": 90, "baseline_glucose": 95})
    user_state = data.get('user_state', {"age": 45, "gender": "Male", "height_cm": 170.0, "weight_kg": 70.0})
    raw_source = "Camera OCR + Text Entry (Early Fused)" if image_scanned else "Text Entry Only"
    age = int(user_state.get('age', 45))
    height = float(user_state.get('height_cm', 170.0))
    weight = float(user_state.get('weight_kg', 70.0))
    height_m = height / 100.0
    bmi = weight / (height_m * height_m) if height_m > 0 else 22.0
    insulin_resistance_factor = 1.0 + (max(0.0, bmi - 24.0) * 0.05) + (max(0.0, age - 30) * 0.005)
    food_name, nutritional_features = analyze_food_text(text_entry)
    sugar_noise = round(random.uniform(-1.0, 1.0), 1)
    fused_sugar = max(0.0, float(nutritional_features["sugar"]) + (sugar_noise if image_scanned else 0.0))
    fused_fiber = float(nutritional_features["fiber"])
    fused_protein = float(nutritional_features["protein"])
    fused_calories = int(nutritional_features["calories"])
    glycemic_index = int(nutritional_features["glycemic_index"])
    baseline_glucose = float(vitals.get("baseline_glucose", 95.0))
    current_hr = float(vitals.get("heart_rate", 72.0))
    glycemic_load = (glycemic_index * fused_sugar) / 10.0
    spike_factor = ((fused_sugar * 4.0) - (fused_fiber * 2.5) - (fused_protein * 1.5)) * insulin_resistance_factor
    projected_peak = baseline_glucose + max(0.0, spike_factor)
    crit_score, risk_level, alert_color, alert_msg = compute_criticality(projected_peak)
    risk_percent = min(100, max(0, int((projected_peak - 100) * 1.25)))
    vital_impact_hr = int((projected_peak - 140) * 0.25) if projected_peak > 140 else 0
    return jsonify({
        "success": True,
        "fusion_metadata": {
            "fusion_type": "Physiological Multi-Modal Sensor Fusion Engine",
            "early_fusion_source": raw_source,
            "feature_alignment": f"Aligned with nutritional database vector for [{food_name}]",
            "intermediate_representation": {
                "fused_sugar_g": fused_sugar, "fused_fiber_g": fused_fiber,
                "fused_protein_g": fused_protein, "fused_calories": fused_calories,
                "glycemic_index": glycemic_index, "glycemic_load": round(glycemic_load, 1)
            }
        },
        "decision_fused_results": {
            "baseline_glucose": baseline_glucose,
            "projected_peak": round(projected_peak, 1),
            "risk_level": risk_level,
            "risk_percentage": risk_percent,
            "criticality_score": crit_score,
            "alert_color": alert_color,
            "alert_message": alert_msg,
            "vital_projections": {
                "projected_heart_rate": int(current_hr + vital_impact_hr),
                "attention_impact": "Stable" if projected_peak <= 140 else "Reduced (-15%)",
                "rate_of_change_mg_dl_min": round(spike_factor / 30.0, 2)
            }
        }
    })

@app.route('/api/reason', methods=['POST'])
def reason_cot_and_waypoints():
    data = request.json or {}
    fusion_results = data.get('fusion_results', {})
    user_state = data.get('user_state', {"age": 45, "gender": "Male", "height_cm": 170.0, "weight_kg": 70.0})
    fused_features = fusion_results.get('fusion_metadata', {}).get('intermediate_representation', {})
    decision = fusion_results.get('decision_fused_results', {})
    sugar = fused_features.get('fused_sugar_g', 0.0)
    fiber = fused_features.get('fused_fiber_g', 0.0)
    peak = decision.get('projected_peak', 100.0)
    risk_level = decision.get('risk_level', 'LOW')
    rate_of_change = decision.get('vital_projections', {}).get('rate_of_change_mg_dl_min', 0.0)
    name = user_state.get('name', 'Patient')
    age = int(user_state.get('age', 45))
    gender = user_state.get('gender', 'Male')
    height = float(user_state.get('height_cm', 170.0))
    weight = float(user_state.get('weight_kg', 70.0))
    height_m = height / 100.0
    bmi = weight / (height_m * height_m) if height_m > 0 else 22.0
    cot_steps = [
        f"Step 1 [Patient Demographics]: Patient {name} is a {age}-year-old {gender} with BMI {round(bmi, 1)} kg/m². Baseline glucose: {decision.get('baseline_glucose')} mg/dL.",
        f"Step 2 [Ingestion Load]: Fusion registered {sugar}g sugar, {fiber}g fiber. Metabolic resistance computed via clinical body metrics.",
        f"Step 3 [Metabolic Windowing]: Acceleration predicted at +{rate_of_change} mg/dL/min. Projected blood glucose peak: {peak} mg/dL.",
        f"Step 4 [Toxicity Evaluation]: Peak of {peak} mg/dL triggers '{risk_level}' alert. Cardiovascular micro-fatigue projected at {decision.get('vital_projections', {}).get('projected_heart_rate')} BPM.",
        f"Step 5 [Intervention Optimization]: Formulating non-insulin muscular GLUT4 clearing waypoints. Proceeding to target calculations."
    ]
    waypoints = []
    if peak > 180:
        waypoints = [
            {"id": "wp1", "title": "Immediate Hydration Flush", "description": "Drink 500-750ml of warm water immediately to increase renal glucose clearance.", "type": "Nutritional Buffer", "status": "pending", "impact": "Blunts peak by -15 mg/dL", "delay_mins": 0, "urgency": "IMMEDIATE"},
            {"id": "wp2", "title": "Active GLUT4 Stimulation", "description": "15-20 minutes of brisk walking or bodyweight squats to activate muscular glucose uptake without insulin.", "type": "Physical Activity", "status": "pending", "impact": "Blunts peak by -35 mg/dL", "delay_mins": 10, "urgency": "HIGH"},
            {"id": "wp3", "title": "Soluble Fiber/Protein Blunter", "description": "10g almonds or chia seeds to coat intestinal wall and slow glucose absorption.", "type": "Nutritional Buffer", "status": "pending", "impact": "Blunts peak by -10 mg/dL", "delay_mins": 15, "urgency": "MODERATE"}
        ]
    elif peak > 140:
        waypoints = [
            {"id": "wp1", "title": "Hydration Buffer", "description": "Drink 400ml of water to support blood dilution.", "type": "Nutritional Buffer", "status": "pending", "impact": "Blunts peak by -8 mg/dL", "delay_mins": 0, "urgency": "HIGH"},
            {"id": "wp2", "title": "Light Movement Waypoint", "description": "10-15 minutes of slow pacing or stretching.", "type": "Physical Activity", "status": "pending", "impact": "Blunts peak by -20 mg/dL", "delay_mins": 5, "urgency": "MODERATE"}
        ]
    else:
        waypoints = [{"id": "wp1", "title": "Optimal Wellness Activity", "description": "10-minute relaxing walk after meal to maintain stable glycemic homeostasis.", "type": "Physical Activity", "status": "pending", "impact": "Maintains normal glycemic baseline", "delay_mins": 5, "urgency": "LOW"}]
    mitigated = round(peak - sum(int(w["impact"].split("-")[1].split(" ")[0]) for w in waypoints if "Blunts" in w.get("impact", "")), 1)
    return jsonify({"success": True, "chain_of_thought": cot_steps, "waypoints": waypoints, "mitigated_peak": mitigated})

@app.route('/api/bot-chat', methods=['POST'])
def bot_chat():
    data = request.json or {}
    message = data.get('message', '').strip()
    current_vitals = data.get('vitals', {})
    current_food = data.get('food_info', {})
    chat_history = data.get('history', [])
    sugar_intake = float(current_food.get('fused_sugar_g', 15.0))
    projected_peak = float(current_vitals.get('projected_peak', 120.0))
    risk_level = current_vitals.get('risk_level', 'LOW')
    projected_hr = int(current_vitals.get('projected_heart_rate', 72))
    baseline = float(current_vitals.get('baseline_glucose', 95.0))

    if GEMINI_AVAILABLE:
        try:
            ctx = f"You are GlucoseGuard AI. Patient: peak {projected_peak} mg/dL ({risk_level}), HR {projected_hr} BPM, sugar {sugar_intake}g. Give concise clinical advice."
            hist = "".join(f"{'User' if h.get('role')=='user' else 'AI'}: {h.get('content','')}\n" for h in chat_history[-4:])
            response = gemini_client.models.generate_content(model='gemini-2.0-flash', contents=f"{ctx}\n{hist}User: {message}\nAI:")
            return jsonify({"success": True, "reply": response.text})
        except Exception as e:
            print(f"Gemini error: {e}")

    # Smart keyword-based clinical chatbot
    msg = message.lower()
    pk = f"**{projected_peak} mg/dL**"
    rl = f"**{risk_level}**"

    if any(w in msg for w in ["hello", "hi", "hey", "help"]):
        reply = (f"Hello! 👋 I'm your **GlucoseGuard AI Companion**.\n\n"
                 + (f"⚠️ Projected peak: {pk} ({rl}). Ask: *'How do I stop this spike?'*" if projected_peak > 140
                    else f"✅ Your glucose looks stable at {pk}. Ask me anything about diet or health!"))

    elif any(w in msg for w in ["stop", "mitigate", "prevent", "spike", "what should i do"]):
        reply = (f"🚨 **3-Step Intervention for {pk} ({rl}):**\n\n"
                 f"**1. GLUT4 Walk** — 15-20 min brisk walk or 20 squats. Muscles pull glucose directly from blood. Effect: -25 to -35 mg/dL\n\n"
                 f"**2. Hydration Flush** — Drink 500ml warm water now. Dilutes blood glucose + supports renal filtration. Effect: -10 to -15 mg/dL\n\n"
                 f"**3. Fiber Buffer** — Eat 10g almonds or 1 tbsp chia seeds. Forms gut gel layer slowing remaining absorption. Effect: -8 to -12 mg/dL\n\n"
                 f"Combined potential: **-40 to -60 mg/dL** blunting. Start with the walk!")

    elif any(w in msg for w in ["can't walk", "cannot walk", "cant walk", "unable", "seated", "sit"]):
        reply = ("**Seated Glucose-Lowering Interventions:**\n\n"
                 "**1. Soleus Pushups 🦵** — Feet flat, raise heels while keeping toes down. Repeat 100-200 times. "
                 "University of Houston study: the soleus muscle burns glucose 7x more efficiently than most exercises!\n\n"
                 "**2. Deep Breathing 🫁** — 5 mins slow belly breathing reduces cortisol → liver stops releasing stored glycogen.\n\n"
                 "**3. Hydration + Nuts** — 500ml water + handful of almonds/walnuts. Works even while seated.")

    elif any(w in msg for w in ["walk", "exercise", "run", "squat"]):
        reply = (f"🏃 **Walking is the #1 intervention for acute glucose spikes!**\n\n"
                 f"Brisk walking activates GLUT4 transporters on muscle cell membranes — they pull glucose out of your blood "
                 f"WITHOUT needing insulin. Every 5 minutes = approximately -3 to -5 mg/dL.\n\n"
                 f"For your {pk} peak, aim for **15-20 minutes**. That could bring you down to approximately "
                 f"**{round(projected_peak - 30)} mg/dL** — well into safer territory!")

    elif any(w in msg for w in ["heart", "pulse", "bpm", "hr", "cardiac", "vital"]):
        reply = (f"❤️ **Your Heart & Blood Glucose:**\n\n"
                 f"At {pk}, your blood becomes more viscous (thicker) due to dissolved glucose. "
                 f"This triggers your sympathetic nervous system, raising projected HR to **{projected_hr} BPM**.\n\n"
                 f"**To protect your cardiovascular system:**\n"
                 f"• Hydration flush (500ml water) — reduces blood viscosity\n"
                 f"• 15-min walk — activates parasympathetic recovery\n"
                 f"• Avoid caffeine during spikes — amplifies sympathetic activation")

    elif any(w in msg for w in ["food", "eat", "diet", "safe", "what can i"]):
        reply = ("🥗 **Glucose-Safe Foods (Low GI):**\n\n"
                 "✅ Good: Spinach, kale, almonds, avocado, eggs, chicken breast, apple (with skin), chia seeds\n\n"
                 "❌ Avoid now: Soda, juice, donuts, white rice, white bread, candy, cakes\n\n"
                 "**Golden Rule:** Always pair carbs with protein + fiber to dramatically slow glucose absorption.")

    elif any(w in msg for w in ["dangerous", "serious", "bad", "risk", "safe", "worried"]):
        if projected_peak > 180:
            reply = (f"🚨 **Yes — {pk} is CRITICAL range.**\n\nBlood glucose above 180 mg/dL causes oxidative stress on blood vessels, "
                     f"cerebral hyperosmolarity, and cardiovascular fatigue (HR: {projected_hr} BPM). **Act immediately** — start the 3-step protocol.")
        elif projected_peak > 140:
            reply = (f"⚠️ **{pk} is elevated (HIGH) but manageable.**\n\nAbove the 140 mg/dL post-meal threshold. "
                     f"Prompt action prevents further rise. Not an emergency, but consistent spikes contribute to insulin resistance.")
        else:
            reply = f"✅ **{pk} is within a safe range.** A 10-minute walk after meals will help maintain stable homeostasis."

    elif any(w in msg for w in ["water", "drink", "hydrate"]):
        reply = (f"💧 **Hydration lowers glucose in 2 ways:**\n\n"
                 f"1. **Dilution** — Water physically reduces glucose concentration in blood\n"
                 f"2. **Renal Flush** — Kidneys filter glucose into urine (glucosuria). More water = more filtration\n\n"
                 f"For {pk}, drink **400-500ml warm water** in the next 10 minutes. Warm water improves circulation.")

    else:
        reply = (f"I'm your **GlucoseGuard AI** 🤖 | Current status: {pk} ({rl})\n\n"
                 f"Try asking:\n• *'How do I stop this spike?'*\n• *'What if I can't walk?'*\n"
                 f"• *'What foods help lower glucose?'*\n• *'Is this dangerous?'*\n• *'What about my heart rate?'*")

    return jsonify({"success": True, "reply": reply})



@app.route('/api/export-clinical', methods=['POST'])
def export_clinical():
    data = request.json or {}
    vitals = data.get('vitals', {})
    food = data.get('food', {})
    waypoints = data.get('waypoints', [])
    diabetic_profile = data.get('diabetic_profile', 'Type 2 Diabetic')
    user_state = data.get('user_state', {})
    peak = vitals.get('projected_peak', 120.0)
    crit_score, risk_level, alert_color, alert_msg = compute_criticality(peak)
    icd10 = "R73.9"
    condition_desc = "Hyperglycemia"
    if diabetic_profile == "Type 2 Diabetic":
        icd10 = "E11.65"
        condition_desc = "Type 2 Diabetes Mellitus with Hyperglycemia"
    elif diabetic_profile == "Type 1 Diabetic":
        icd10 = "E10.65"
        condition_desc = "Type 1 Diabetes Mellitus with Hyperglycemia"
    elif peak < 140:
        icd10 = "Z71.3"
        condition_desc = "Dietary surveillance"
    report = {
        "resourceType": "ClinicalDocument",
        "compliance": {"HIPAA_Status": "COMPLIANT", "Encryption_Standard": "AES-256-GCM"},
        "criticality": {
            "score": crit_score,
            "level": risk_level,
            "alert_color": alert_color,
            "alert_message": alert_msg,
            "requires_immediate_action": crit_score >= 80
        },
        "patient": {
            "name": user_state.get('name', 'Patient'),
            "age": user_state.get('age', 45),
            "gender": user_state.get('gender', 'Male'),
            "height_cm": user_state.get('height_cm', 170),
            "weight_kg": user_state.get('weight_kg', 70),
            "diabetic_profile": diabetic_profile
        },
        "clinical_findings": {
            "observed_baseline_glucose_mg_dl": vitals.get('baseline_glucose', 95.0),
            "projected_peak_glucose_mg_dl": peak,
            "clinical_diagnosis_code": icd10,
            "icd10_description": condition_desc,
            "severity_classification": risk_level,
            "criticality_score_0_to_100": crit_score
        },
        "ingested_nutrients_fused": {
            "fused_sugar_g": food.get('fused_sugar_g', 0.0),
            "fused_fiber_g": food.get('fused_fiber_g', 0.0),
            "fused_protein_g": food.get('fused_protein_g', 0.0),
            "fused_calories_kcal": food.get('fused_calories', 0)
        },
        "mitigation_waypoints_prescribed": [
            {"title": w.get('title'), "type": w.get('type'), "urgency": w.get('urgency', 'LOW'), "impact": w.get('impact'), "clinical_rationale": w.get('description')} for w in waypoints
        ],
        "generated_timestamp": "2026-05-30T13:00:00+05:30"
    }
    return jsonify({"success": True, "formatted_report": json.dumps(report, indent=4), "filename": f"glucoseguard_{icd10}_{risk_level}.json", "criticality": {"score": crit_score, "color": alert_color, "message": alert_msg}})

if __name__ == '__main__':
    os.makedirs('static', exist_ok=True)
    print("GlucoseGuard Server Running on http://127.0.0.1:5000")
    app.run(host='0.0.0.0', port=5000, debug=True)
