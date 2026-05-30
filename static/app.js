// GlucoseGuard Front-end Core Engine
document.addEventListener("DOMContentLoaded", () => {
    // Current Active User Session State
    let currentUser = null;
    let currentBaseline = 95.0;
    let projectedPeak = 95.0;
    let currentMitigatedPeak = 95.0;
    let currentVitals = { heart_rate: 72, baseline_glucose: 95 };
    let currentFoodInfo = { fused_sugar_g: 0.0, fused_fiber_g: 0.0, fused_calories: 0 };
    let activeWaypoints = [];
    let completedWaypoints = {}; 
    let ocrIndex = 0;

    // --- DOM Elements ---
    const ambientCanvas = document.getElementById("ambient-canvas");
    const authCard = document.getElementById("auth-card");
    const toRegisterBtn = document.getElementById("to-register-btn");
    const toLoginBtn = document.getElementById("to-login-btn");
    
    // View Panels
    const viewAuth = document.getElementById("view-auth");
    const viewProfile = document.getElementById("view-profile");
    const viewDashboard = document.getElementById("view-dashboard");
    const viewAdmin = document.getElementById("view-admin");
    const navLinksContainer = document.getElementById("nav-links-container");
    const userHeaderProfile = document.getElementById("user-header-profile");
    const userProfileBadge = document.getElementById("user-profile-badge");
    const userProfileName = document.getElementById("user-profile-name");
    const logoutBtn = document.getElementById("logout-btn");
    const navPortalBtn = document.getElementById("nav-portal-btn");

    // Inputs
    const loginUser = document.getElementById("login-username");
    const loginPass = document.getElementById("login-password");
    const regUser = document.getElementById("reg-username");
    const regPass = document.getElementById("reg-password");
    const regFullname = document.getElementById("reg-fullname");
    
    const profileAge = document.getElementById("profile-age");
    const profileGender = document.getElementById("profile-gender");
    const profileHeight = document.getElementById("profile-height");
    const profileWeight = document.getElementById("profile-weight");
    
    const diabeticProfileSel = document.getElementById("diabetic-profile");
    const fileUploader = document.getElementById("file-uploader");
    const foodTextArea = document.getElementById("food-text");
    const analyzeBtn = document.getElementById("analyze-btn");

    // Canvas Charting
    const glucoseCanvas = document.getElementById("glucoseChart");
    const chartCtx = glucoseCanvas.getContext("2d");

    // Pipeline steps
    const stepEarly = document.getElementById("step-early");
    const stepIntermediate = document.getElementById("step-intermediate");
    const stepLate = document.getElementById("step-late");
    const earlyDesc = document.getElementById("early-fusion-desc");
    const interDesc = document.getElementById("intermediate-fusion-desc");
    const lateDesc = document.getElementById("late-fusion-desc");

    // Vitals Cards
    const displayBaseline = document.getElementById("baseline-display");
    const displayPeak = document.getElementById("vital-peak");
    const displaySugar = document.getElementById("vital-sugar");
    const displayHr = document.getElementById("vital-hr");
    const riskBadge = document.getElementById("risk-badge");
    const riskBar = document.getElementById("risk-bar");

    // CoT & waypoints
    const terminal = document.getElementById("terminal");
    const waypointsContainer = document.getElementById("waypoints-container");
    const reportView = document.getElementById("report-view");
    const exportBtn = document.getElementById("export-btn");

    // Chatbot Companion
    const botLauncher = document.getElementById("bot-launcher");
    const botPanel = document.getElementById("bot-panel");
    const botClose = document.getElementById("bot-close");
    const botChatHistory = document.getElementById("bot-chat-history");
    const botMessageInput = document.getElementById("bot-message-input");
    const botSendBtn = document.getElementById("bot-send");
    const botBadge = document.getElementById("bot-badge");

    // Admin Dashboard stats & grids
    const adminStatPatients = document.getElementById("admin-stat-patients");
    const adminStatLogs = document.getElementById("admin-stat-logs");
    const adminStatAvgPeak = document.getElementById("admin-stat-avgpeak");
    const adminStatCritical = document.getElementById("admin-stat-critical");
    const adminPatientsTbody = document.getElementById("admin-patients-tbody");
    const adminLogsTbody = document.getElementById("admin-logs-tbody");

    const OCR_SIMULATIONS = [
        "NUTRITION LABEL SCAN: 1 Serving - 350 kcal | Sugar: 35g | Fiber: 1.2g | Protein: 4g | Fat: 14g | [Target: Chocolate Glazed Donut]",
        "NUTRITION LABEL SCAN: 1 Bottle - 150 kcal | Sugar: 39g | Fiber: 0.0g | Protein: 0g | Fat: 0g | [Target: Sweetened Strawberry Soda]",
        "NUTRITION LABEL SCAN: 1 Plate - 450 kcal | Sugar: 4g | Fiber: 8.5g | Protein: 18g | Fat: 22g | [Target: Avocado Toast with Fried Egg]",
        "NUTRITION LABEL SCAN: 1 Serving - 120 kcal | Sugar: 2.5g | Fiber: 6.2g | Protein: 3.1g | Fat: 4g | [Target: Green Spinach Salad with Almond Dressing]"
    ];

    // --- INITIALIZE AMBIENT BACKGROUND PARTICLES ---
    let particles = [];
    const pCanvasCtx = ambientCanvas.getContext("2d");

    let angleX = 0.25;
    let angleY = 0.35;
    let targetAngleX = 0.25;
    let targetAngleY = 0.35;
    let phase = 0;
    
    // Mouse coordinates for dynamic interaction physics
    let mouseX = -1000;
    let mouseY = -1000;

    // 3D Grid Parameters
    const gridCols = 16;
    const gridRows = 16;
    const spacing = 46;

    // Floating background floaters (ambient layered parallax depth)
    let ambientFloaters = [];
    function initAmbientParticles() {
        ambientCanvas.width = window.innerWidth;
        ambientCanvas.height = window.innerHeight;
        
        ambientFloaters = [];
        for (let i = 0; i < 25; i++) {
            ambientFloaters.push({
                x: Math.random() * ambientCanvas.width,
                y: Math.random() * ambientCanvas.height,
                size: Math.random() * 80 + 40,
                speed: Math.random() * 0.3 + 0.15,
                opacity: Math.random() * 0.22 + 0.05,
                offset: Math.random() * 100
            });
        }
    }

    // Capture mouse movement to tilt grid AND apply physics warp/repulsion
    window.addEventListener("mousemove", (e) => {
        mouseX = e.clientX;
        mouseY = e.clientY;
        const normX = (e.clientX / window.innerWidth) - 0.5;
        const normY = (e.clientY / window.innerHeight) - 0.5;
        targetAngleY = normX * 0.65;
        targetAngleX = normY * 0.65 + 0.25; // Base X angle tilt
    });

    window.addEventListener("mouseleave", () => {
        mouseX = -1000;
        mouseY = -1000;
        targetAngleX = 0.25;
        targetAngleY = 0.35;
    });

    function animateAmbientParticles() {
        pCanvasCtx.clearRect(0, 0, ambientCanvas.width, ambientCanvas.height);

        // Render ambient glowing bubble floaters (Layer 1 - Deep Parallax)
        ambientFloaters.forEach(f => {
            f.y -= f.speed;
            if (f.y < -f.size) f.y = ambientCanvas.height + f.size;
            f.x += Math.sin(phase * 0.5 + f.offset) * 0.25;

            // Draw radial gradient bubble
            let radGrad = pCanvasCtx.createRadialGradient(f.x, f.y, 0, f.x, f.y, f.size);
            radGrad.addColorStop(0, `rgba(139, 92, 246, ${f.opacity})`);
            radGrad.addColorStop(0.5, `rgba(6, 182, 212, ${f.opacity * 0.4})`);
            radGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
            
            pCanvasCtx.fillStyle = radGrad;
            pCanvasCtx.beginPath();
            pCanvasCtx.arc(f.x, f.y, f.size, 0, Math.PI * 2);
            pCanvasCtx.fill();
        });

        // Update rotation angles and wave phases
        angleX += (targetAngleX - angleX) * 0.04;
        angleY += (targetAngleY - angleY) * 0.04;
        phase += 0.012;

        const centerX = ambientCanvas.width / 2;
        const centerY = ambientCanvas.height / 2;
        const fov = 480;

        // Project 3D Grid coordinates
        let projectedPoints = [];
        for (let c = 0; c < gridCols; c++) {
            projectedPoints[c] = [];
            for (let r = 0; r < gridRows; r++) {
                // Local coordinate offset from center
                const rawX = (c - gridCols / 2) * spacing;
                const rawZ = (r - gridRows / 2) * spacing;

                // Double sinusoidal wave
                const dist = Math.sqrt(rawX * rawX + rawZ * rawZ) * 0.016;
                const rawY = Math.sin(dist - phase) * Math.cos(rawX * 0.003 + phase) * 36;

                // Rotate around Y-Axis
                let x1 = rawX * Math.cos(angleY) - rawZ * Math.sin(angleY);
                let z1 = rawX * Math.sin(angleY) + rawZ * Math.cos(angleY);

                // Rotate around X-Axis
                let y2 = rawY * Math.cos(angleX) - z1 * Math.sin(angleX);
                let z2 = rawY * Math.sin(angleX) + z1 * Math.cos(angleX);

                // 3D Perspective Projection
                const scale = fov / (fov + z2);
                let projX = x1 * scale + centerX;
                let projY = y2 * scale + centerY;

                // Interactive dynamic warp (Physics-based cursor bend)
                if (mouseX !== -1000) {
                    const dx = projX - mouseX;
                    const dy = projY - mouseY;
                    const mouseDist = Math.sqrt(dx * dx + dy * dy);
                    if (mouseDist < 260) {
                        const pushForce = (260 - mouseDist) / 260;
                        const pushFactor = (z2 > 0) ? -28 : 28; 
                        projX += (dx / mouseDist) * pushForce * pushFactor;
                        projY += (dy / mouseDist) * pushForce * pushFactor;
                    }
                }

                projectedPoints[c][r] = {
                    x: projX,
                    y: projY,
                    depth: z2,
                    scale: scale
                };
            }
        }

        // Render 3D Wireframe connection meshes (Layer 2 - Active grid)
        pCanvasCtx.lineWidth = 0.95;
        for (let c = 0; c < gridCols; c++) {
            for (let r = 0; r < gridRows; r++) {
                const pt = projectedPoints[c][r];
                const maxDepth = (gridCols / 2) * spacing * 1.5;
                let alpha = (maxDepth - pt.depth) / (maxDepth * 1.8);
                alpha = Math.max(0.01, Math.min(0.24, alpha));

                // Connect horizontal neighbor
                if (c < gridCols - 1) {
                    const nextPt = projectedPoints[c + 1][r];
                    pCanvasCtx.beginPath();
                    pCanvasCtx.moveTo(pt.x, pt.y);
                    pCanvasCtx.lineTo(nextPt.x, nextPt.y);
                    pCanvasCtx.strokeStyle = `rgba(139, 92, 246, ${alpha * 0.75})`;
                    pCanvasCtx.stroke();
                }

                // Connect vertical neighbor
                if (r < gridRows - 1) {
                    const nextPt = projectedPoints[c][r + 1];
                    pCanvasCtx.beginPath();
                    pCanvasCtx.moveTo(pt.x, pt.y);
                    pCanvasCtx.lineTo(nextPt.x, nextPt.y);
                    pCanvasCtx.strokeStyle = `rgba(6, 182, 212, ${alpha * 0.75})`;
                    pCanvasCtx.stroke();
                }

                // Draw glowing radial orb node (Layer 3 - Node Vertexes)
                let nodeSize = pt.scale * 12;
                let nodeRadGrad = pCanvasCtx.createRadialGradient(pt.x, pt.y, 0, pt.x, pt.y, nodeSize);
                nodeRadGrad.addColorStop(0, `rgba(16, 185, 129, ${alpha * 1.8})`);
                nodeRadGrad.addColorStop(0.35, `rgba(6, 182, 212, ${alpha * 0.6})`);
                nodeRadGrad.addColorStop(1, 'rgba(6, 182, 212, 0)');
                
                pCanvasCtx.fillStyle = nodeRadGrad;
                pCanvasCtx.beginPath();
                pCanvasCtx.arc(pt.x, pt.y, nodeSize, 0, Math.PI * 2);
                pCanvasCtx.fill();
            }
        }
        requestAnimationFrame(animateAmbientParticles);
    }

    window.addEventListener("resize", () => {
        ambientCanvas.width = window.innerWidth;
        ambientCanvas.height = window.innerHeight;
        resizeGlucoseCanvas();
    });

    initAmbientParticles();
    animateAmbientParticles();

    // --- 3D INTERACTIVE MOUSE ROTATION ON AUTH CARD ---
    const scene = document.querySelector(".scene-3d");
    if (scene) {
        scene.addEventListener("mousemove", (e) => {
            if (!viewAuth.classList.contains("active")) return;
            const rect = authCard.getBoundingClientRect();
            const x = e.clientX - rect.left - rect.width / 2;
            const y = e.clientY - rect.top - rect.height / 2;
            
            // Limit tilt angles
            const tiltX = -(y / rect.height) * 20;
            const tiltY = (x / rect.width) * 20;
            
            authCard.style.transform = `rotateX(${tiltX}deg) rotateY(${tiltY + (authCard.classList.contains("flipped") ? 180 : 0)}deg)`;
        });
        
        scene.addEventListener("mouseleave", () => {
            authCard.style.transform = authCard.classList.contains("flipped") ? "rotateY(180deg)" : "rotateY(0deg)";
        });
    }

    // --- 3D AUTH CARD FLIPS ---
    toRegisterBtn.addEventListener("click", () => {
        authCard.classList.add("flipped");
    });
    toLoginBtn.addEventListener("click", () => {
        authCard.classList.remove("flipped");
    });

    // --- VIEW PORT SWAP ROUTING ENGINE ---
    function navigateToView(viewId) {
        document.querySelectorAll(".app-view").forEach(v => {
            v.classList.remove("active");
        });
        document.getElementById(viewId).classList.add("active");
        
        // Adjust headers and layouts based on role
        if (viewId === "view-auth") {
            navLinksContainer.style.display = "none";
            userHeaderProfile.style.display = "none";
            botLauncher.style.display = "none";
        } else if (viewId === "view-profile") {
            navLinksContainer.style.display = "none";
            userHeaderProfile.style.display = "flex";
            userProfileBadge.textContent = "Calibrating";
            userProfileName.textContent = currentUser ? currentUser.name : "New Patient";
            logoutBtn.style.display = "inline-block";
            botLauncher.style.display = "none";
        } else if (viewId === "view-dashboard") {
            navLinksContainer.style.display = "flex";
            userHeaderProfile.style.display = "flex";
            userProfileBadge.textContent = "Patient";
            userProfileBadge.className = "badge badge-cyan";
            userProfileName.textContent = currentUser ? currentUser.name : "Anonymous";
            logoutBtn.style.display = "inline-block";
            botLauncher.style.display = "flex";
            
            // Configure navigation links behavior
            navPortalBtn.href = "#";
            navPortalBtn.textContent = "Dashboard Portal";
            navPortalBtn.className = "active";
            
            setTimeout(resizeGlucoseCanvas, 200);
        } else if (viewId === "view-admin") {
            navLinksContainer.style.display = "flex";
            userHeaderProfile.style.display = "flex";
            userProfileBadge.textContent = "Clinician";
            userProfileBadge.className = "badge badge-emerald";
            userProfileName.textContent = currentUser ? currentUser.name : "Clinician Admin";
            logoutBtn.style.display = "inline-block";
            botLauncher.style.display = "none";
            
            // Adjust nav links for clinic view
            navPortalBtn.href = "#";
            navPortalBtn.textContent = "EHR Central Control";
            navPortalBtn.className = "active";
            
            // Fetch database rows to fill audits
            loadAdminAuditData();
        }
    }

    // --- AUTHENTICATION TRIGGERS ---
    
    // Register Patient
    document.getElementById("register-trigger").addEventListener("click", async () => {
        const username = regUser.value.trim();
        const password = regPass.value.trim();
        const fullname = regFullname.value.trim();
        
        if (!username || !password || !fullname) {
            alert("Please complete all registration fields.");
            return;
        }

        try {
            const res = await fetch("/api/auth/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    username: username,
                    password: password,
                    name: fullname,
                    age: 45,
                    gender: "Male",
                    height_cm: 170,
                    weight_kg: 70
                })
            });
            const data = await res.json();
            
            if (data.success) {
                currentUser = data.user;
                // Transition to metric inputs scene
                navigateToView("view-profile");
            } else {
                alert("Error during registration: " + data.message);
            }
        } catch (e) {
            console.error(e);
            alert("Network connection error during sign up.");
        }
    });

    // Login Auth
    document.getElementById("login-trigger").addEventListener("click", async () => {
        const username = loginUser.value.trim();
        const password = loginPass.value.trim();
        
        if (!username || !password) {
            alert("Please enter security credentials.");
            return;
        }

        try {
            const res = await fetch("/api/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    username: username,
                    password: password
                })
            });
            const data = await res.json();
            
            if (data.success) {
                currentUser = data.user;
                
                if (currentUser.role === "admin") {
                    // Navigate directly to clinician portal
                    navigateToView("view-admin");
                } else {
                    // Navigate standard patient: check if they need measurements calibrated
                    if (currentUser.age === 45 && currentUser.height_cm === 170 && currentUser.weight_kg === 70) {
                        navigateToView("view-profile");
                    } else {
                        navigateToView("view-dashboard");
                    }
                }
            } else {
                alert("Authentication failed: " + data.message);
            }
        } catch (e) {
            console.error(e);
            alert("Authentication connection failed.");
        }
    });

    // Logout
    logoutBtn.addEventListener("click", () => {
        currentUser = null;
        loginUser.value = "";
        loginPass.value = "";
        regUser.value = "";
        regPass.value = "";
        regFullname.value = "";
        navigateToView("view-auth");
    });

    // --- CLINICAL METRIC QUESTIONNAIRE INITIALIZATION ---
    document.getElementById("initialize-profile-trigger").addEventListener("click", async () => {
        if (!currentUser) return;
        
        const age = parseInt(profileAge.value || 45);
        const gender = profileGender.value;
        const height = parseFloat(profileHeight.value || 170);
        const weight = parseFloat(profileWeight.value || 70);

        try {
            // Register metrics dynamically via register payload
            const res = await fetch("/api/auth/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    username: currentUser.username,
                    password: "", 
                    name: currentUser.name,
                    age: age,
                    gender: gender,
                    height_cm: height,
                    weight_kg: weight
                })
            });
            // Registrations on already existing usernames inside Flask returns updated attributes or 409,
            // but in our SQL it acts as an override helper in register trigger or we just capture it in current session.
            currentUser.age = age;
            currentUser.gender = gender;
            currentUser.height_cm = height;
            currentUser.weight_kg = weight;

            navigateToView("view-dashboard");
            
        } catch (e) {
            // Local Session bypass if endpoint blocks duplicates
            currentUser.age = age;
            currentUser.gender = gender;
            currentUser.height_cm = height;
            currentUser.weight_kg = weight;
            navigateToView("view-dashboard");
        }
    });


    // --- PATIENT SIMULATOR WORKSPACE ACTIONS ---

    // Adjust canvas dimension
    function resizeGlucoseCanvas() {
        const rect = glucoseCanvas.getBoundingClientRect();
        glucoseCanvas.width = rect.width * window.devicePixelRatio;
        glucoseCanvas.height = rect.height * window.devicePixelRatio;
        chartCtx.scale(window.devicePixelRatio, window.devicePixelRatio);
        drawGlucoseChart();
    }

    function drawGlucoseChart() {
        const width = glucoseCanvas.width / window.devicePixelRatio;
        const height = glucoseCanvas.height / window.devicePixelRatio;
        
        chartCtx.clearRect(0, 0, width, height);

        const paddingLeft = 40;
        const paddingRight = 20;
        const paddingTop = 20;
        const paddingBottom = 30;
        const graphWidth = width - paddingLeft - paddingRight;
        const graphHeight = height - paddingTop - paddingBottom;

        chartCtx.strokeStyle = "rgba(15, 23, 42, 0.07)";
        chartCtx.lineWidth = 1;
        
        // Grid y
        const yValues = [60, 100, 140, 180, 220];
        yValues.forEach(val => {
            const y = paddingTop + graphHeight - ((val - 60) / 160) * graphHeight;
            chartCtx.beginPath();
            chartCtx.moveTo(paddingLeft, y);
            chartCtx.lineTo(width - paddingRight, y);
            chartCtx.stroke();

            chartCtx.fillStyle = "rgba(15, 23, 42, 0.55)";
            chartCtx.font = "10px Inter";
            chartCtx.fillText(val, 10, y + 3);
        });

        // Grid x
        const xValues = [0, 30, 60, 90, 120];
        xValues.forEach(val => {
            const x = paddingLeft + (val / 120) * graphWidth;
            chartCtx.beginPath();
            chartCtx.moveTo(x, paddingTop);
            chartCtx.lineTo(x, paddingTop + graphHeight);
            chartCtx.stroke();

            chartCtx.fillStyle = "rgba(15, 23, 42, 0.55)";
            chartCtx.font = "10px Inter";
            chartCtx.fillText(val + "m", x - 10, paddingTop + graphHeight + 15);
        });

        // Hyperglycemia Limit (140 mg/dL)
        const thresholdY = paddingTop + graphHeight - ((140 - 60) / 160) * graphHeight;
        chartCtx.strokeStyle = "rgba(255, 71, 126, 0.35)";
        chartCtx.setLineDash([4, 4]);
        chartCtx.lineWidth = 1.5;
        chartCtx.beginPath();
        chartCtx.moveTo(paddingLeft, thresholdY);
        chartCtx.lineTo(width - paddingRight, thresholdY);
        chartCtx.stroke();
        chartCtx.setLineDash([]);
        
        chartCtx.fillStyle = "rgba(255, 71, 126, 0.8)";
        chartCtx.fillText("Glycemic Limit (140 mg/dL)", width - 180, thresholdY - 6);

        // Baseline Interstitial line
        const baselineY = paddingTop + graphHeight - ((currentBaseline - 60) / 160) * graphHeight;
        chartCtx.strokeStyle = "rgba(0, 217, 245, 0.3)";
        chartCtx.setLineDash([2, 2]);
        chartCtx.beginPath();
        chartCtx.moveTo(paddingLeft, baselineY);
        chartCtx.lineTo(width - paddingRight, baselineY);
        chartCtx.stroke();
        chartCtx.setLineDash([]);

        if (projectedPeak > currentBaseline) {
            // UNMITIGATED SPIKE CURVE (Dotted Red)
            chartCtx.strokeStyle = "rgba(255, 71, 126, 0.4)";
            chartCtx.setLineDash([3, 3]);
            chartCtx.lineWidth = 2;
            chartCtx.beginPath();
            
            for (let t = 0; t <= 120; t += 2) {
                const x = paddingLeft + (t / 120) * graphWidth;
                const rise = Math.sin((t / 45) * Math.PI / 2);
                const gValue = currentBaseline + (projectedPeak - currentBaseline) * Math.pow(rise, 1.8) * Math.exp(-(t - 45) / 45);
                const y = paddingTop + graphHeight - ((Math.max(60, Math.min(220, gValue)) - 60) / 160) * graphHeight;
                if (t === 0) chartCtx.moveTo(x, y);
                else chartCtx.lineTo(x, y);
            }
            chartCtx.stroke();
            chartCtx.setLineDash([]);

            // MITIGATED CURVE (Solid Emerald Green)
            chartCtx.strokeStyle = "#00f5a0";
            chartCtx.lineWidth = 3;
            chartCtx.shadowColor = "rgba(0, 245, 160, 0.4)";
            chartCtx.shadowBlur = 8;
            chartCtx.beginPath();
            
            for (let t = 0; t <= 120; t += 2) {
                const x = paddingLeft + (t / 120) * graphWidth;
                const rise = Math.sin((t / 40) * Math.PI / 2);
                const decayModifier = 35 + (projectedPeak - currentMitigatedPeak) * 0.4;
                const gValue = currentBaseline + (currentMitigatedPeak - currentBaseline) * Math.pow(rise, 1.8) * Math.exp(-(t - 40) / decayModifier);
                const y = paddingTop + graphHeight - ((Math.max(60, Math.min(220, gValue)) - 60) / 160) * graphHeight;
                if (t === 0) chartCtx.moveTo(x, y);
                else chartCtx.lineTo(x, y);
            }
            chartCtx.stroke();
            chartCtx.shadowBlur = 0;
        }
    }

    // Camera Label Scanning trigger
    fileUploader.addEventListener("click", () => {
        fileUploader.style.borderColor = "var(--color-emerald)";
        fileUploader.style.backgroundColor = "rgba(0, 245, 160, 0.05)";
        
        const scanResult = OCR_SIMULATIONS[ocrIndex];
        ocrIndex = (ocrIndex + 1) % OCR_SIMULATIONS.length;

        setTimeout(() => {
            foodTextArea.value = scanResult;
            fileUploader.style.borderColor = "rgba(255, 255, 255, 0.12)";
            fileUploader.style.backgroundColor = "rgba(255, 255, 255, 0.01)";
            
            foodTextArea.style.borderColor = "var(--color-cyan)";
            setTimeout(() => {
                foodTextArea.style.borderColor = "var(--border-color)";
            }, 800);
        }, 600);
    });

    // Ingest & run sensor fusion + DWA trajectory
    analyzeBtn.addEventListener("click", async () => {
        const textValue = foodTextArea.value.trim();
        if (!textValue) {
            alert("Describe your food or click standard camera scan!");
            return;
        }

        resetDashboardState();

        const selectedProfile = diabeticProfileSel.value;
        let baselineGlucose = 95.0;
        let baselineHr = 72;

        if (selectedProfile === "Type 2 Diabetic") {
            baselineGlucose = 115.0;
            baselineHr = 76;
        } else if (selectedProfile === "Type 1 Diabetic") {
            baselineGlucose = 125.0;
            baselineHr = 80;
        } else if (selectedProfile === "Pre-diabetic") {
            baselineGlucose = 105.0;
            baselineHr = 74;
        } else {
            baselineGlucose = 90.0;
            baselineHr = 68;
        }

        currentBaseline = baselineGlucose;
        displayBaseline.innerHTML = `${baselineGlucose} <span style="font-size: 0.85rem; font-weight: 500; color: var(--text-secondary);">mg/dL</span>`;

        const hasOCR = textValue.startsWith("NUTRITION LABEL SCAN:");

        try {
            // STEP 1: Early Fusion
            stepEarly.classList.add("active");
            earlyDesc.textContent = "Resolving multimodal overlap streams...";
            
            await sleep(1000);
            stepEarly.classList.remove("active");
            stepEarly.classList.add("completed");
            earlyDesc.textContent = "Data Fusion COMPLETE: Synced visual OCR signals and textual inputs.";

            // STEP 2: Intermediate Fusion
            stepIntermediate.classList.add("active");
            interDesc.textContent = "Extracting carbohydrate vectors & matching databases...";

            // Ingest to backend `/api/fuse`
            const fuseResponse = await fetch("/api/fuse", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    text_entry: textValue,
                    image_scanned: hasOCR,
                    vital_status: {
                        heart_rate: baselineHr,
                        attention_level: 95,
                        baseline_glucose: baselineGlucose
                    },
                    user_state: {
                        age: currentUser ? currentUser.age : 45,
                        gender: currentUser ? currentUser.gender : "Male",
                        height_cm: currentUser ? currentUser.height_cm : 170.0,
                        weight_kg: currentUser ? currentUser.weight_kg : 70.0
                    }
                })
            });
            const fusionData = await fuseResponse.json();

            await sleep(1000);
            stepIntermediate.classList.remove("active");
            stepIntermediate.classList.add("completed");
            interDesc.textContent = "Feature Fusion COMPLETE: Resolved carbohydrate matrices.";

            // STEP 3: Late Fusion
            stepLate.classList.add("active");
            lateDesc.textContent = "Fusing clinical profile features & vital sign baselines...";

            await sleep(800);
            stepLate.classList.remove("active");
            stepLate.classList.add("completed");
            lateDesc.textContent = `Decision Fusion COMPLETE: Projected Peak Glucose: ${fusionData.decision_fused_results.projected_peak} mg/dL.`;

            // State mappings
            const results = fusionData.decision_fused_results;
            projectedPeak = results.projected_peak;
            currentMitigatedPeak = projectedPeak;
            currentVitals = results;
            currentFoodInfo = fusionData.fusion_metadata.intermediate_representation;

            updateVitalsCards(results, currentFoodInfo);
            drawGlucoseChart();

            // Run CoT trajectory (/api/reason)
            terminal.innerHTML = "<div class='terminal-line' style='color: var(--color-cyan);'>[GlucoseGuard AI Cognitive Engine Launching...]</div>";
            
            const reasonResponse = await fetch("/api/reason", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    fusion_results: fusionData,
                    user_state: {
                        name: currentUser ? currentUser.name : "Patient",
                        age: currentUser ? currentUser.age : 45,
                        gender: currentUser ? currentUser.gender : "Male",
                        height_cm: currentUser ? currentUser.height_cm : 170.0,
                        weight_kg: currentUser ? currentUser.weight_kg : 70.0
                    }
                })
            });
            const reasonData = await reasonResponse.json();

            // Render scrolling typewriter
            await renderTerminalLines(reasonData.chain_of_thought);

            // Render waypoints checklist
            activeWaypoints = reasonData.waypoints;
            renderWaypointsList(activeWaypoints);

            // EHR console update
            updateEHRDocument(fusionData, reasonData, selectedProfile);

            // Store logged intake dynamically in user database
            if (currentUser) {
                await fetch("/api/log-intake", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        user_id: currentUser.id,
                        food_name: textValue.split("|").pop().replace("[Target: ", "").replace("]", "").trim(),
                        sugar_g: currentFoodInfo.fused_sugar_g,
                        fiber_g: currentFoodInfo.fused_fiber_g,
                        calories_kcal: currentFoodInfo.fused_calories,
                        projected_peak: projectedPeak,
                        mitigated_peak: currentMitigatedPeak,
                        vital_heart_rate: results.vital_projections.projected_heart_rate
                    })
                });
            }

            // Notification alert in chat bot
            notifyChatBotCompanion();

        } catch (e) {
            console.error(e);
            resetPipelineNodes();
        }
    });

    // Helper functions
    function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    function resetDashboardState() {
        resetPipelineNodes();
        completedWaypoints = {};
    }

    function resetPipelineNodes() {
        [stepEarly, stepIntermediate, stepLate].forEach(node => {
            node.className = "step-node";
        });
        earlyDesc.textContent = "Awaiting input signal integration.";
        interDesc.textContent = "Awaiting vector lookup.";
        lateDesc.textContent = "Awaiting patient metrics integration.";
    }

    function updateVitalsCards(results, food) {
        displayPeak.textContent = Math.round(results.projected_peak);
        displaySugar.textContent = food.fused_sugar_g.toFixed(1);
        displayHr.textContent = results.vital_projections.projected_heart_rate;

        // Colors
        if (results.projected_peak > 180) {
            displayPeak.className = "vital-val color-red";
            riskBadge.textContent = "CRITICAL SPIKE";
            riskBadge.className = "color-red";
            riskBar.style.backgroundColor = "var(--color-rose)";
            riskBar.style.width = "95%";
        } else if (results.projected_peak > 140) {
            displayPeak.className = "vital-val color-orange";
            riskBadge.textContent = "HIGH RISK";
            riskBadge.className = "color-orange";
            riskBar.style.backgroundColor = "var(--color-warning)";
            riskBar.style.width = "75%";
        } else if (results.projected_peak > 110) {
            displayPeak.className = "vital-val color-cyan";
            riskBadge.textContent = "MODERATE RISK";
            riskBadge.className = "color-cyan";
            riskBar.style.backgroundColor = "var(--color-cyan)";
            riskBar.style.width = "45%";
        } else {
            displayPeak.className = "vital-val color-green";
            riskBadge.textContent = "LOW RISK";
            riskBadge.className = "color-green";
            riskBar.style.backgroundColor = "var(--color-emerald)";
            riskBar.style.width = "15%";
        }
    }

    async function renderTerminalLines(steps) {
        terminal.innerHTML = "";
        for (let i = 0; i < steps.length; i++) {
            const line = document.createElement("div");
            line.className = "terminal-line";
            terminal.appendChild(line);
            
            terminal.scrollTop = terminal.scrollHeight;
            
            const text = steps[i];
            for (let c = 0; c < text.length; c++) {
                line.textContent += text.charAt(c);
                await sleep(5);
            }
            await sleep(150);
        }
    }

    function renderWaypointsList(waypoints) {
        if (!waypoints || waypoints.length === 0) {
            waypointsContainer.innerHTML = `
                <div style="text-align: center; padding: 20px; color: var(--text-muted); border: 1px dashed var(--border-color); border-radius: 8px; font-size: 0.8rem;">
                    No active waypoints. Ingest food above to evaluate mitigations.
                </div>`;
            return;
        }

        waypointsContainer.innerHTML = "";
        waypoints.forEach(wp => {
            const item = document.createElement("div");
            item.className = "waypoint-item";
            item.id = `wp-card-${wp.id}`;

            item.innerHTML = `
                <div class="waypoint-checkbox" id="chk-${wp.id}"></div>
                <div class="waypoint-details">
                    <h4>
                        <span>${wp.title}</span>
                        <span class="waypoint-impact">${wp.impact}</span>
                    </h4>
                    <p style="margin-bottom:3px;">${wp.description}</p>
                    <span style="font-size:0.65rem; color:var(--text-muted);">Type: ${wp.type} | Offset: ${wp.delay_mins}m</span>
                </div>
            `;

            const chk = item.querySelector(`#chk-${wp.id}`);
            item.addEventListener("click", () => {
                completedWaypoints[wp.id] = !completedWaypoints[wp.id];
                
                if (completedWaypoints[wp.id]) {
                    item.classList.add("completed");
                    chk.innerHTML = "✓";
                } else {
                    item.classList.remove("completed");
                    chk.innerHTML = "";
                }
                
                recalcMetabolicSpikes();
            });

            waypointsContainer.appendChild(item);
        });
    }

    function recalcMetabolicSpikes() {
        let reduction = 0;
        activeWaypoints.forEach(wp => {
            if (completedWaypoints[wp.id]) {
                const impactStr = wp.impact;
                if (impactStr.includes("Blunts")) {
                    const value = parseInt(impactStr.split("-")[1].split(" ")[0]);
                    reduction += value;
                }
            }
        });

        currentMitigatedPeak = Math.max(currentBaseline, projectedPeak - reduction);
        displayPeak.textContent = Math.round(currentMitigatedPeak);
        
        drawGlucoseChart();

        // Update EHR documents
        const currentEhr = JSON.parse(reportView.textContent);
        if (currentEhr.clinical_findings) {
            currentEhr.clinical_findings.mitigated_peak_glucose_mg_dl = Math.round(currentMitigatedPeak);
            reportView.textContent = JSON.stringify(currentEhr, null, 4);
        }

        // Notification inside chat box if complete
        const totalCompleted = Object.values(completedWaypoints).filter(Boolean).length;
        if (totalCompleted === activeWaypoints.length && activeWaypoints.length > 0) {
            appendBotBubble("🏥 **Spike Prevention Complete:** Superb work! Fulfilling physical GLUT4 clearance waypoints diluted active glucose kinematics, safely returning interstitial profiles to baseline.");
            
            // Sync updated mitigated peak back to SQLite database for clinician overview
            if (currentUser) {
                fetch("/api/log-intake", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        user_id: currentUser.id,
                        food_name: foodTextArea.value.split("|").pop().replace("[Target: ", "").replace("]", "").trim(),
                        sugar_g: currentFoodInfo.fused_sugar_g,
                        fiber_g: currentFoodInfo.fused_fiber_g,
                        calories_kcal: currentFoodInfo.fused_calories,
                        projected_peak: projectedPeak,
                        mitigated_peak: currentMitigatedPeak,
                        vital_heart_rate: currentVitals.vital_projections.projected_heart_rate
                    })
                });
            }
        }
    }

    async function updateEHRDocument(fusionData, reasonData, profile) {
        const payload = {
            vitals: {
                baseline_glucose: currentBaseline,
                projected_peak: projectedPeak,
                risk_level: currentVitals.risk_level
            },
            food: currentFoodInfo,
            waypoints: reasonData.waypoints,
            diabetic_profile: profile,
            user_state: {
                name: currentUser ? currentUser.name : "Pseudonym Patient",
                age: currentUser ? currentUser.age : 45,
                gender: currentUser ? currentUser.gender : "Male",
                height_cm: currentUser ? currentUser.height_cm : 170.0,
                weight_kg: currentUser ? currentUser.weight_kg : 70.0
            }
        };

        const res = await fetch("/api/export-clinical", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });
        const ehrData = await res.json();
        
        reportView.textContent = ehrData.formatted_report;
        exportBtn.disabled = false;
        exportBtn.style.opacity = 1;
        exportBtn.style.cursor = "pointer";

        exportBtn.onclick = () => {
            const blob = new Blob([ehrData.formatted_report], { type: "application/json" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = ehrData.filename;
            a.click();
            URL.revokeObjectURL(url);
        };
    }


    // --- DYNAMIC AI COMPANION INTERACTION ---

    botLauncher.addEventListener("click", () => {
        botPanel.classList.add("open");
        botLauncher.style.transform = "scale(0)";
        botBadge.style.display = "none";
    });

    botClose.addEventListener("click", () => {
        botPanel.classList.remove("open");
        botLauncher.style.transform = "scale(1)";
    });

    function notifyChatBotCompanion() {
        if (!botPanel.classList.contains("open")) {
            botBadge.style.display = "flex";
        }
        
        const sugar = currentFoodInfo.fused_sugar_g.toFixed(1);
        const peak = Math.round(projectedPeak);
        appendBotBubble(`🚨 **Glycemic Spike Projected:** Fused food signals registered **${sugar}g of sugar**, threatening a glycemic peak of **${peak} mg/dL** (${currentVitals.risk_level}). \n\nClick **'How do I stop this spike?'** or write your metabolic limits to resolve countermeasures!`);
    }

    botSendBtn.addEventListener("click", sendChatPayload);
    botMessageInput.addEventListener("keypress", (e) => {
        if (e.key === "Enter") sendChatPayload();
    });

    async function sendChatPayload() {
        const text = botMessageInput.value.trim();
        if (!text) return;

        appendUserBubble(text);
        botMessageInput.value = "";

        const typing = appendTypingDotBubble();

        try {
            const res = await fetch("/api/bot-chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    message: text,
                    vitals: {
                        baseline_glucose: currentBaseline,
                        projected_peak: projectedPeak,
                        risk_level: currentVitals.risk_level,
                        projected_heart_rate: currentVitals.vital_projections ? currentVitals.vital_projections.projected_heart_rate : 72
                    },
                    food_info: currentFoodInfo
                })
            });
            const data = await res.json();
            
            typing.remove();
            appendBotBubble(data.reply);

        } catch (e) {
            console.error(e);
            typing.remove();
            appendBotBubble("Connection error. Companion engine offline.");
        }
    }

    function appendUserBubble(msg) {
        const div = document.createElement("div");
        div.className = "message user";
        div.textContent = msg;
        botChatHistory.appendChild(div);
        botChatHistory.scrollTop = botChatHistory.scrollHeight;
    }

    function appendBotBubble(markdown) {
        const div = document.createElement("div");
        div.className = "message bot";
        
        let formatted = markdown
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/\n/g, '<br>');
            
        div.innerHTML = formatted;
        botChatHistory.appendChild(div);
        botChatHistory.scrollTop = botChatHistory.scrollHeight;
    }

    function appendTypingDotBubble() {
        const div = document.createElement("div");
        div.className = "message bot typing-indicator";
        div.innerHTML = `
            <div class="typing-dot"></div>
            <div class="typing-dot"></div>
            <div class="typing-dot"></div>
        `;
        botChatHistory.appendChild(div);
        botChatHistory.scrollTop = botChatHistory.scrollHeight;
        return div;
    }


    // --- CLINICIAN ADMIN PORTAL AUDIT FETCH ---

    async function loadAdminAuditData() {
        try {
            const res = await fetch("/api/admin/dashboard");
            const data = await res.json();
            
            if (data.success) {
                // Populate Stats Card numbers
                adminStatPatients.textContent = data.patients.length;
                adminStatLogs.textContent = data.logs.length;
                
                // Calculate average projected peak across all logs
                if (data.logs.length > 0) {
                    const avg = data.logs.reduce((sum, log) => sum + log.projected_peak, 0) / data.logs.length;
                    adminStatAvgPeak.innerHTML = `${Math.round(avg)} <span style='font-size:0.9rem;'>mg/dL</span>`;
                    
                    const criticalCount = data.logs.filter(log => log.projected_peak > 180).length;
                    adminStatCritical.textContent = criticalCount;
                } else {
                    adminStatAvgPeak.innerHTML = `-- <span style='font-size:0.9rem;'>mg/dL</span>`;
                    adminStatCritical.textContent = "0";
                }

                // Render Patient Database Grid
                adminPatientsTbody.innerHTML = "";
                if (data.patients.length === 0) {
                    adminPatientsTbody.innerHTML = `<tr><td colspan="6" style="text-align: center;">No patients registered in database yet.</td></tr>`;
                } else {
                    data.patients.forEach(pat => {
                        const tr = document.createElement("tr");
                        // Calculate BMI
                        const heightM = pat.height_cm / 100;
                        const bmi = pat.weight_kg / (heightM * heightM);
                        
                        let bmiBadgeClass = "badge-emerald";
                        if (bmi > 30) bmiBadgeClass = "badge-rose";
                        else if (bmi > 25) bmiBadgeClass = "badge-warning";
                        else if (bmi < 18.5) bmiBadgeClass = "badge-cyan";

                        tr.innerHTML = `
                            <td>${pat.id}</td>
                            <td style="font-weight: 700; color: var(--text-primary);">${pat.name}</td>
                            <td>${pat.age} yrs / ${pat.gender}</td>
                            <td>${pat.height_cm} cm / ${pat.weight_kg} kg</td>
                            <td><span class="badge ${bmiBadgeClass}">${bmi.toFixed(1)}</span></td>
                            <td><span style="font-family: monospace;">${pat.username}</span></td>
                        `;
                        adminPatientsTbody.appendChild(tr);
                    });
                }

                // Render Logs Grid
                adminLogsTbody.innerHTML = "";
                if (data.logs.length === 0) {
                    adminLogsTbody.innerHTML = `<tr><td colspan="7" style="text-align: center;">No clinical logs audited in database yet.</td></tr>`;
                } else {
                    data.logs.forEach(log => {
                        const tr = document.createElement("tr");
                        
                        let peakClass = "color-green";
                        if (log.projected_peak > 180) peakClass = "color-red";
                        else if (log.projected_peak > 140) peakClass = "color-orange";
                        
                        let mitigatedClass = "color-green";
                        if (log.mitigated_peak > 180) mitigatedClass = "color-red";
                        else if (log.mitigated_peak > 140) mitigatedClass = "color-orange";

                        // Format timestamp slightly
                        const dateStr = log.timestamp.split(".")[0].replace("T", " ");

                        tr.innerHTML = `
                            <td style="font-size:0.75rem; font-family:monospace;">${dateStr}</td>
                            <td style="font-weight: 700; color: var(--text-primary);">${log.patient_name}</td>
                            <td>${log.food_name}</td>
                            <td>${log.sugar_g.toFixed(1)}g / ${log.fiber_g.toFixed(1)}g</td>
                            <td class="${peakClass}" style="font-weight: bold;">${Math.round(log.projected_peak)}</td>
                            <td class="${mitigatedClass}" style="font-weight: bold;">${Math.round(log.mitigated_peak)}</td>
                            <td>${log.vital_heart_rate} BPM</td>
                        `;
                        adminLogsTbody.appendChild(tr);
                    });
                }

            }
        } catch (e) {
            console.error("Clinic load error: ", e);
        }
    }

    // --- KEYPRESS ENTER EVENT LISTENERS TO ALWAYS PROCEED ---
    
    // Login form fields (submit on Enter)
    [loginUser, loginPass].forEach(input => {
        input.addEventListener("keydown", (e) => {
            if (e.key === "Enter") {
                e.preventDefault();
                document.getElementById("login-trigger").click();
            }
        });
    });

    // Registration form fields (submit on Enter)
    [regUser, regPass, regFullname].forEach(input => {
        input.addEventListener("keydown", (e) => {
            if (e.key === "Enter") {
                e.preventDefault();
                document.getElementById("register-trigger").click();
            }
        });
    });

    // Calibration form fields (submit on Enter)
    [profileAge, profileHeight, profileWeight].forEach(input => {
        input.addEventListener("keydown", (e) => {
            if (e.key === "Enter") {
                e.preventDefault();
                document.getElementById("initialize-profile-trigger").click();
            }
        });
    });

    // Food Input text area (submit on Enter, new line on Shift+Enter)
    foodTextArea.addEventListener("keydown", (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            analyzeBtn.click();
        }
    });
});
