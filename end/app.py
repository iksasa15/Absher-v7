import cv2
import time
import torch
import numpy as np
import os
import sys
from datetime import datetime
from threading import Thread, Lock
from ultralytics import YOLO
from PIL import Image
import flask
from flask import Flask, request, render_template, jsonify, send_from_directory
import base64
import json
import random
import uuid
from flask_socketio import SocketIO, emit
import logging




# إعداد السجل
logging.basicConfig(level=logging.INFO, 
                   format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
                   handlers=[logging.StreamHandler()])
logger = logging.getLogger('surveillance-app')




# الحصول على المسار المطلق للدليل الذي يحتوي على app.py
base_dir = os.path.abspath(os.path.dirname(__file__))
parent_dir = os.path.dirname(base_dir)  # الدليل الأب




logger.info(f"المسار الأساسي: {base_dir}")
logger.info(f"المسار الأب: {parent_dir}")




# التأكد من وجود المجلدات المطلوبة
required_folders = [
    os.path.join(parent_dir, "static"),
    os.path.join(parent_dir, "static/uploads"),
    os.path.join(parent_dir, "static/processed"),
    os.path.join(parent_dir, "static/captures")
]




for folder in required_folders:
    if not os.path.exists(folder):
        os.makedirs(folder)
        logger.info(f"تم إنشاء المجلد: {folder}")
    else:
        logger.info(f"المجلد موجود بالفعل: {folder}")




# محاولة استيراد CLIP
try:
    from transformers import CLIPProcessor, CLIPModel
    USE_OPENAI_CLIP = False
    logger.info("✅ استخدام CLIPProcessor من transformers")
except ImportError:
    try:
        from transformers import CLIPFeatureExtractor as CLIPProcessor, CLIPModel
        USE_OPENAI_CLIP = False
        logger.info("✅ استخدام CLIPFeatureExtractor بدلاً من CLIPProcessor")
    except ImportError:
        try:
            import clip
            USE_OPENAI_CLIP = True
            logger.info("✅ استخدام مكتبة CLIP الأصلية من OpenAI")
        except ImportError:
            logger.error("❌ فشل استيراد أي إصدار من CLIP. يرجى تثبيت إحدى هذه المكتبات:")
            logger.error("   pip install transformers pillow torch")
            logger.error("   أو: pip install git+https://github.com/openai/CLIP.git")
            USE_OPENAI_CLIP = False




# إعداد تطبيق Flask مع دليل الأب كدليل للقوالب والملفات الثابتة
app = Flask(__name__, 
            static_folder=os.path.join(parent_dir, 'static'),
            static_url_path='/static',
            template_folder=parent_dir)




# تهيئة Socket.IO مع دعم CORS
socketio = SocketIO(app, cors_allowed_origins="*")




# إعدادات المعالجة
PROCESS_WIDTH = 640
PROCESS_HEIGHT = 360




# إعدادات YOLO
YOLO_CONF = 0.35
YOLO_IOU = 0.35




# تحديد المجلدات الإضافية
UPLOADS_FOLDER = os.path.join(parent_dir, "static/uploads")
PROCESSED_FOLDER = os.path.join(parent_dir, "static/processed")
CAPTURES_FOLDER = os.path.join(parent_dir, "static/captures")




# إنشاء المجلدات إذا لم تكن موجودة
os.makedirs(UPLOADS_FOLDER, exist_ok=True)
os.makedirs(PROCESSED_FOLDER, exist_ok=True)
os.makedirs(CAPTURES_FOLDER, exist_ok=True)




# فئات COCO
PERSON_ID = 0
BAG_IDS = {24: "Bag", 26: "Bag", 28: "Bag"}
WEAPON_CLASSES = {43: "Knife", 76: "Scissors"}




# تسميات CLIP - تم تغيير الترتيب
CLIP_LABELS = ["face with mask", "face without mask"]




# الألوان (BGR)
C_GREEN = (0, 255, 0)      # قناع
C_RED = (0, 0, 255)        # بدون قناع / أسلحة
C_ORANGE = (0, 165, 255)   # طائرة بدون طيار
C_YELLOW = (0, 255, 255)   # حقائب
C_BLUE = (255, 150, 0)     # أشخاص
C_CYAN = (255, 255, 0)     # FPS
C_WHITE = (255, 255, 255)
C_BLACK = (0, 0, 0)




# متغيرات عالمية للنماذج
global_models = None




# تتبع المهام
tasks = {}




# حالة البث
stream_active = False
stream_thread = None
stream_lock = Lock()
active_streams = {}  # تتبع عدة بث




def get_dynamic_sizes(width):
    """حساب أحجام الرسم بناءً على عرض الإطار"""
    if width >= 1280:
        return 3, 0.9, 2
    elif width >= 960:
        return 2, 0.7, 2
    else:
        return 2, 0.6, 2




def enhance_face(face_img):
    """تحسين صورة الوجه لتحسين دقة CLIP"""
    try:
        # تحويل إلى LAB
        lab = cv2.cvtColor(face_img, cv2.COLOR_BGR2LAB)
        l, a, b = cv2.split(lab)
        
        # تعزيز قناة السطوع
        l = cv2.equalizeHist(l)
        
        # دمج القنوات
        enhanced = cv2.merge([l, a, b])
        return cv2.cvtColor(enhanced, cv2.COLOR_LAB2BGR)
    except Exception as e:
        logger.error(f"خطأ في تحسين الوجه: {str(e)}")
        return face_img




def draw_box(frame, x1, y1, x2, y2, color, label, thickness, font_scale, font_thick):
    try:
        cv2.rectangle(frame, (x1, y1), (x2, y2), color, thickness)
        size = cv2.getTextSize(label, cv2.FONT_HERSHEY_SIMPLEX, font_scale, font_thick)[0]
        cv2.rectangle(frame, (x1, y1 - size[1] - 12), (x1 + size[0] + 12, y1), color, -1)
        cv2.putText(frame, label, (x1 + 6, y1 - 6), cv2.FONT_HERSHEY_SIMPLEX, font_scale, C_WHITE, font_thick)
    except Exception as e:
        logger.error(f"خطأ في رسم المربع: {str(e)}")




def draw_dashboard(frame, fps, stats, alert):
    try:
        h, w = frame.shape[:2]
        
        bg = (0, 0, 100) if alert else C_BLACK
        cv2.rectangle(frame, (0, 0), (w, 80), bg, -1)
        cv2.line(frame, (0, 80), (w, 80), C_WHITE, 2)
        
        # السطر الأول
        cv2.putText(frame, f"FPS: {fps:.1f}", (15, 30), cv2.FONT_HERSHEY_SIMPLEX, 0.7, C_CYAN, 2)
        cv2.putText(frame, f"Persons: {stats['persons']}", (140, 30), cv2.FONT_HERSHEY_SIMPLEX, 0.7, C_BLUE, 2)
        cv2.putText(frame, f"Bags: {stats['bags']}", (330, 30), cv2.FONT_HERSHEY_SIMPLEX, 0.7, C_YELLOW, 2)
        
        # السطر الثاني
        cv2.putText(frame, f"Mask: {stats['mask']}", (15, 65), cv2.FONT_HERSHEY_SIMPLEX, 0.65, C_GREEN, 2)
        cv2.putText(frame, f"NoMask: {stats['no_mask']}", (140, 65), cv2.FONT_HERSHEY_SIMPLEX, 0.65, C_RED, 2)
        cv2.putText(frame, f"Weapons: {stats['weapons']}", (290, 65), cv2.FONT_HERSHEY_SIMPLEX, 0.65, C_RED, 2)
        cv2.putText(frame, f"Drones: {stats['drones']}", (460, 65), cv2.FONT_HERSHEY_SIMPLEX, 0.65, C_ORANGE, 2)
    except Exception as e:
        logger.error(f"خطأ في رسم لوحة المعلومات: {str(e)}")




def draw_alert(frame, alert_type, blink):
    try:
        h, w = frame.shape[:2]
        color = C_ORANGE if "DRONE" in alert_type else C_RED
        
        if blink:
            cv2.rectangle(frame, (0, 0), (w, h), color, 15)
        
        cv2.rectangle(frame, (0, h-60), (w, h), color, -1)
        text = f"!! ALERT: {alert_type} !!"
        cv2.putText(frame, text, (w//2 - 180, h-20), cv2.FONT_HERSHEY_SIMPLEX, 1.0, C_WHITE, 2)
    except Exception as e:
        logger.error(f"خطأ في رسم التنبيه: {str(e)}")




def capture_frame(frame, detection_type, bbox):
    """
    التقاط وحفظ إطار مع الكشف
    
    المعلمات:
        frame: الإطار الحالي
        detection_type: نوع الكشف (Knife/Person/إلخ)
        bbox: إحداثيات الكشف (x1, y1, x2, y2)
    
    الإرجاع:
        مسار الملف المحفوظ
    """
    try:
        # إنشاء اسم الملف مع الطابع الزمني
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S_%f")[:-3]
        filename = f"{detection_type}_{timestamp}.jpg"
        filepath = os.path.join(CAPTURES_FOLDER, filename)
        
        # حفظ الصورة الكاملة مع صندوق أحمر
        x1, y1, x2, y2 = bbox
        frame_copy = frame.copy()
        
        # رسم مربع أحمر حول الكشف
        cv2.rectangle(frame_copy, (x1, y1), (x2, y2), (0, 0, 255), 4)
        
        # إضافة نص تحذير
        cv2.putText(frame_copy, f"DETECTED: {detection_type}", (x1, y1 - 15),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 0, 255), 2)
        
        # إضافة الطابع الزمني إلى الصورة
        time_text = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        cv2.putText(frame_copy, time_text, (10, frame_copy.shape[0] - 20),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 2)
        
        # حفظ الصورة
        cv2.imwrite(filepath, frame_copy)
        
        logger.info(f"⚠️  تم التقاط {detection_type}: {filepath}")
        
        # إرسال تنبيه إلى العملاء المتصلين
        alert_data = {
            'type': detection_type,
            'path': f"/static/captures/{filename}",
            'confidence': 98,  # مكان
            'timestamp': datetime.now().strftime("%H:%M:%S")
        }
        socketio.emit('alert', alert_data)
        
        return f"/static/captures/{filename}"
    except Exception as e:
        logger.error(f"خطأ في التقاط الإطار: {str(e)}")
        return ""




def load_models():
    """تحميل جميع نماذج الكشف"""
    global global_models
    
    # إذا كانت النماذج محملة بالفعل، أعدها
    if global_models is not None:
        return global_models
        
    logger.info("=" * 70)
    logger.info("   🔍 نظام المراقبة الشامل - وحدة تحليل الفيديو")
    logger.info("=" * 70)
    
    device = "cuda" if torch.cuda.is_available() else "cpu"
    logger.info(f"🖥️  الجهاز: {device.upper()}")
    logger.info("-" * 70)
    
    # تحميل YOLOv8
    logger.info("⏳ 1/2: تحميل YOLOv8 (الأشخاص + الحقائب + الأسلحة)...")
    yolo_path = os.path.join(parent_dir, "yolov8x.pt")
    try:
        if os.path.exists(yolo_path):
            logger.info(f"تم العثور على ملف yolo: {yolo_path}")
            yolo = YOLO(yolo_path)
            logger.info("✅ تم تحميل YOLOv8x!")
        else:
            logger.warning(f"ملف yolo غير موجود في: {yolo_path}, استخدام نموذج مضمن...")
            yolo = YOLO("yolov8n.pt")
            logger.info("✅ تم تحميل YOLOv8n!")
    except Exception as e:
        logger.error(f"خطأ في تحميل YOLO: {str(e)}")
        logger.warning("⚠️ YOLOv8x غير متوفر، استخدام YOLOv8n...")
        yolo = YOLO("yolov8n.pt")
        logger.info("✅ تم تحميل YOLOv8n!")
    
    # تحميل CLIP وتسلسل الوجه
    logger.info("⏳ 2/2: تحميل CLIP + Haar Cascade (الأقنعة)...")
    face_cascade = cv2.CascadeClassifier(
        cv2.data.haarcascades + 'haarcascade_frontalface_default.xml'
    )
    
    clip_model = None
    clip_proc = None
    use_openai_clip = False
    
    try:
        if USE_OPENAI_CLIP:
            # استخدام OpenAI CLIP الأصلي
            clip_model, clip_proc = clip.load("ViT-L/14", device=device)
            logger.info("✅ تم تحميل CLIP-Large (OpenAI)!")
            use_openai_clip = True
        else:
            try:
                clip_proc = CLIPProcessor.from_pretrained("openai/clip-vit-large-patch14")
                clip_model = CLIPModel.from_pretrained("openai/clip-vit-large-patch14")
                logger.info("✅ تم تحميل CLIP-Large (Transformers)!")
            except Exception as e:
                logger.warning(f"⚠️ CLIP-Large غير متوفر: {str(e)}, استخدام CLIP-Base...")
                clip_proc = CLIPProcessor.from_pretrained("openai/clip-vit-base-patch32")
                clip_model = CLIPModel.from_pretrained("openai/clip-vit-base-patch32")
                logger.info("✅ تم تحميل CLIP-Base (Transformers)!")
    except Exception as e:
        logger.error(f"❌ فشل تحميل CLIP: {str(e)}")
        logger.warning("⚠️ المتابعة بدون كشف القناع...")
    
    if not use_openai_clip and clip_model is not None:
        clip_model.to(device).eval()
    
    logger.info("-" * 70)
    logger.info("✅ تم تحميل جميع النماذج!")
    logger.info("=" * 70)
    
    global_models = {
        'yolo': yolo,
        'face_cascade': face_cascade,
        'clip_model': clip_model,
        'clip_proc': clip_proc,
        'device': device,
        'use_openai_clip': use_openai_clip
    }
    
    return global_models




def process_video_thread(video_path, task_id):
    """
    معالجة ملف فيديو في مؤشر ترابط خلفي وتحديث حالة المهمة
    
    المعلمات:
        video_path: مسار ملف الفيديو المدخل
        task_id: معرف المهمة لتتبع التقدم
    """
    # تحديث حالة المهمة إلى معالجة
    tasks[task_id]['status'] = 'processing'
    tasks[task_id]['progress'] = 0
    
    try:
        # التحقق من وجود ملف الفيديو
        if not os.path.exists(video_path):
            logger.error(f"خطأ: ملف الفيديو غير موجود: {video_path}")
            tasks[task_id]['status'] = 'error'
            tasks[task_id]['error'] = "ملف الفيديو غير موجود"
            return
        
        logger.info(f"بدء معالجة الفيديو: {video_path} للمهمة: {task_id}")
        
        # الحصول على النماذج
        models = load_models()
        
        # فتح الفيديو
        cap = cv2.VideoCapture(video_path)
        if not cap.isOpened():
            logger.error(f"تعذر فتح ملف الفيديو: {video_path}")
            tasks[task_id]['status'] = 'error'
            tasks[task_id]['error'] = "تعذر فتح ملف الفيديو"
            return
        
        # الحصول على معلومات الفيديو
        fps = cap.get(cv2.CAP_PROP_FPS)
        width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
        height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
        frame_count = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        
        logger.info(f"معلومات الفيديو: {width}x{height}, FPS: {fps}, الإطارات: {frame_count}")
        
        # إنشاء مسار الإخراج
        output_filename = f"processed_{os.path.basename(video_path)}"
        output_path = os.path.join(PROCESSED_FOLDER, output_filename)
        
        # إنشاء كاتب الفيديو
        fourcc = cv2.VideoWriter_fourcc(*'mp4v')
        out = cv2.VideoWriter(output_path, fourcc, fps, (width, height))
        
        # إعداد المعالجة
        box_thick, font_scale, font_thick = get_dynamic_sizes(width)
        
        # عوامل التحجيم لكشف YOLO
        scale_x = width / PROCESS_WIDTH
        scale_y = height / PROCESS_HEIGHT
        
        # عدادات الإحصائيات
        total_persons = 0
        total_bags = 0
        total_weapons = 0
        total_masks = 0
        total_no_masks = 0
        
        # تتبع العدد الفريد (تتبع بسيط)
        seen_persons = set()
        seen_bags = set()
        seen_weapons = set()
        
        # التقاطات للكشف
        captures = []
        
        # كشف الوجه - تحضير المتغيرات إذا كان CLIP متاحًا
        if models['clip_model'] is not None:
            face_detector = models['face_cascade']
            clip_model = models['clip_model']
            clip_proc = models['clip_proc']
            use_openai_clip = models['use_openai_clip']
            device = models['device']
        
        # معالجة الإطارات
        frame_idx = 0
        process_fps = 0
        start_time = time.time()
        
        # حالة التنبيه
        alert_active = False
        alert_type = ""
        blink = True
        blink_timer = time.time()
        
        # التقاط كل 3 ثوانٍ للكشف الفريد
        last_capture_time = 0
        CAPTURE_INTERVAL = 3  # ثوانٍ
        
        # إحصائيات لكل إطار
        stats = {
            'persons': 0,
            'bags': 0,
            'mask': 0,
            'no_mask': 0,
            'weapons': 0,
            'drones': 0  # مكان، غير منفذ في هذه النسخة
        }
        
        # حلقة المعالجة الرئيسية
        while True:
            ret, frame = cap.read()
            if not ret:
                break
            
            # تحديث FPS وحالة الوميض
            frame_idx += 1
            now = time.time()
            elapsed = now - start_time
            if elapsed > 1:
                process_fps = frame_idx / elapsed
            
            if now - blink_timer >= 0.3:
                blink = not blink
                blink_timer = now
            
            # تحديث التقدم
            progress = min(99, int((frame_idx / frame_count) * 100))
            tasks[task_id]['progress'] = progress
            
            # إرسال تحديث التقدم عبر Socket.IO
            if frame_idx % 10 == 0:  # إرسال التقدم كل 10 إطارات لتجنب الفيضان
                socketio.emit('task_progress', {
                    'task_id': task_id,
                    'progress': progress,
                    'stats': stats
                })
            
            # المعالجة باستخدام YOLO (تغيير الحجم للمعالجة الأسرع)
            small = cv2.resize(frame, (PROCESS_WIDTH, PROCESS_HEIGHT))
            results = models['yolo'](small, conf=YOLO_CONF, iou=YOLO_IOU, verbose=False)
            
            # إعادة تعيين إحصائيات الإطار
            stats = {
                'persons': 0,
                'bags': 0,
                'mask': 0,
                'no_mask': 0,
                'weapons': 0,
                'drones': 0
            }
            
            persons = []
            
            # معالجة نتائج YOLO
            for r in results:
                if r.boxes is None:
                    continue
                
                for box in r.boxes:
                    cid = int(box.cls[0])
                    # تغيير حجم الإحداثيات إلى الدقة الأصلية
                    x1 = int(box.xyxy[0][0] * scale_x)
                    y1 = int(box.xyxy[0][1] * scale_y)
                    x2 = int(box.xyxy[0][2] * scale_x)
                    y2 = int(box.xyxy[0][3] * scale_y)
                    conf = float(box.conf[0])
                    
                    # حساب المركز للتتبع
                    center_x = (x1 + x2) // 2
                    center_y = (y1 + y2) // 2
                    
                    # حقائب
                    if cid in BAG_IDS:
                        stats['bags'] += 1
                        total_bags += 1
                        seen_bags.add((center_x // 50, center_y // 50))  # إلغاء التكرار البسيط
                        
                        draw_box(frame, x1, y1, x2, y2, C_YELLOW, f"{BAG_IDS[cid]}: {conf:.2f}", 
                                box_thick, font_scale, font_thick)
                    
                    # أشخاص
                    elif cid == PERSON_ID:
                        stats['persons'] += 1
                        total_persons += 1
                        seen_persons.add((center_x // 50, center_y // 50))  # إلغاء التكرار البسيط
                        
                        cv2.rectangle(frame, (x1, y1), (x2, y2), C_BLUE, box_thick)
                        cv2.putText(frame, f"Person: {conf:.2f}", (x1, y2+20), 
                                    cv2.FONT_HERSHEY_SIMPLEX, font_scale, C_BLUE, font_thick)
                        
                        # إضافة إلى قائمة الأشخاص للكشف عن القناع
                        persons.append((x1, y1, x2, y2))
                    
                    # أسلحة
                    elif cid in WEAPON_CLASSES:
                        stats['weapons'] += 1
                        total_weapons += 1
                        weapon_type = WEAPON_CLASSES[cid]
                        seen_weapons.add((weapon_type, center_x // 50, center_y // 50))
                        
                        draw_box(frame, x1, y1, x2, y2, C_RED, f"{weapon_type}: {conf:.2f}", 
                                box_thick + 2, font_scale + 0.2, font_thick)
                        
                        alert_active = True
                        alert_type = weapon_type.upper()
                        
                        # التقاط الكشف إذا مر الفاصل الزمني
                        if now - last_capture_time >= CAPTURE_INTERVAL:
                            capture_path = capture_frame(frame, weapon_type, (x1, y1, x2, y2))
                            captures.append({
                                'type': weapon_type,
                                'path': capture_path,
                                'confidence': round(conf * 100),
                                'timestamp': datetime.now().strftime("%H:%M:%S")
                            })
                            last_capture_time = now
            
            # معالجة الوجوه للكشف عن القناع إذا كان CLIP متاحًا
            if models['clip_model'] is not None:
                for (px1, py1, px2, py2) in persons:
                    roi = frame[py1:py2, px1:px2]
                    if roi.size == 0:
                        continue
                    
                    gray = cv2.cvtColor(roi, cv2.COLOR_BGR2GRAY)
                    faces = face_detector.detectMultiScale(gray, 1.15, 3, minSize=(25, 25))
                    
                    for (fx, fy, fw, fh) in faces:
                        if fw < 30:
                            continue
                        
                        face = roi[fy:fy+fh, fx:fx+fw]
                        if face.size < 400:
                            continue
                        
                        # تحسين الصورة
                        face = enhance_face(face)
                        
                        small = cv2.resize(face, (56, 56))
                        rgb = cv2.cvtColor(small, cv2.COLOR_BGR2RGB)
                        pil = Image.fromarray(rgb)
                        
                        if use_openai_clip:
                            # استخدام OpenAI CLIP الأصلي
                            image = clip_proc(pil).unsqueeze(0).to(device)
                            text = clip.tokenize(CLIP_LABELS).to(device)
                            
                            with torch.no_grad():
                                logits_per_image, _ = clip_model(image, text)
                                probs = logits_per_image.softmax(dim=-1)
                        else:
                            # استخدام HuggingFace transformers CLIP
                            inputs = clip_proc(
                                text=CLIP_LABELS, images=pil,
                                return_tensors="pt", padding=True
                            ).to(device)
                            
                            with torch.no_grad():
                                out = clip_model(**inputs)
                                probs = out.logits_per_image.softmax(dim=1)
                        
                        idx = probs.argmax().item()
                        conf = probs[0][idx].item()
                        has_mask = (idx == 0)  # تم تغييره من 1 إلى 0 لأننا عكسنا ترتيب التسميات
                        
                        color = C_GREEN if has_mask else C_RED
                        label = "NO MASK" if has_mask else "MASK"
                        
                        # تحديث الإحصائيات
                        if has_mask:
                            stats['mask'] += 1
                            total_masks += 1
                        else:
                            stats['no_mask'] += 1
                            total_no_masks += 1
                            
                            # التقاط كشف بدون قناع إذا مر الفاصل الزمني
                            if now - last_capture_time >= CAPTURE_INTERVAL:
                                capture_path = capture_frame(frame, "NoMask", (px1+fx, py1+fy, px1+fx+fw, py1+fy+fh))
                                captures.append({
                                    'type': 'NoMask',
                                    'path': capture_path,
                                    'confidence': round(conf * 100),
                                    'timestamp': datetime.now().strftime("%H:%M:%S")
                                })
                                last_capture_time = now
                        
                        draw_box(frame, px1+fx, py1+fy, px1+fx+fw, py1+fy+fh, color, 
                                f"{label}: {conf:.2f}", box_thick, font_scale, font_thick)
            
            # رسم لوحة المعلومات
            draw_dashboard(frame, process_fps, stats, alert_active)
            
            # رسم التنبيه إذا كان نشطًا
            if alert_active:
                draw_alert(frame, alert_type, blink)
            
            # كتابة الإطار
            out.write(frame)
            
            # كل 30 إطارًا، إرسال إطار عبر Socket.IO
            if frame_idx % 30 == 0:
                _, buffer = cv2.imencode('.jpg', frame, [cv2.IMWRITE_JPEG_QUALITY, 80])
                frame_base64 = base64.b64encode(buffer).decode('utf-8')
                socketio.emit('video_frame', {
                    'task_id': task_id,
                    'frame': frame_base64,
                    'frame_number': frame_idx,
                    'stats': stats
                })
        
        # تحرير الموارد
        cap.release()
        out.release()
        
        # إعداد إحصائيات الملخص
        unique_persons = len(seen_persons)
        unique_bags = len(seen_bags)
        unique_weapons = len(seen_weapons)
        
        # إنشاء صورة مصغرة
        thumbnail_path = os.path.join(PROCESSED_FOLDER, f"thumb_{os.path.basename(video_path)}.jpg")
        cap = cv2.VideoCapture(output_path)
        ret, thumb = cap.read()
        if ret:
            cv2.imwrite(thumbnail_path, thumb)
        cap.release()
        
        # تحديث المهمة بالنتائج
        tasks[task_id].update({
            'status': 'completed',
            'progress': 100,
            'output_path': f"/static/processed/{output_filename}",
            'thumbnail': f"/static/processed/thumb_{os.path.basename(video_path)}.jpg",
            'captures': captures,
            'stats': {
                'duration': frame_idx/fps if fps > 0 else 0,
                'frames': frame_idx,
                'persons': {
                    'unique': unique_persons,
                    'total': total_persons
                },
                'bags': {
                    'unique': unique_bags,
                    'total': total_bags
                },
                'weapons': {
                    'unique': unique_weapons, 
                    'total': total_weapons
                },
                'mask': total_masks,
                'no_mask': total_no_masks,
                'fps': process_fps
            }
        })
        
        logger.info(f"اكتملت معالجة الفيديو للمهمة: {task_id}")
        
        # إرسال إشعار الاكتمال عبر Socket.IO
        socketio.emit('task_completed', {
            'task_id': task_id,
            'output_path': f"/static/processed/{output_filename}",
            'thumbnail': f"/static/processed/thumb_{os.path.basename(video_path)}.jpg",
            'stats': tasks[task_id]['stats']
        })
    
    except Exception as e:
        logger.error(f"خطأ في معالجة الفيديو للمهمة {task_id}: {str(e)}")
        import traceback
        logger.error(traceback.format_exc())
        tasks[task_id]['status'] = 'error'
        tasks[task_id]['error'] = str(e)
        socketio.emit('task_error', {
            'task_id': task_id,
            'error': str(e)
        })




def process_stream(stream_id, source_type, source_path=None, rtsp_url=None):
    """
    معالجة بث فيديو (كاميرا ويب، ملف، أو RTSP)
    
    المعلمات:
        stream_id: معرف فريد لهذا البث
        source_type: نوع المصدر ("webcam"، "file"، "rtsp")
        source_path: مسار ملف الفيديو (إذا كان source_type هو "file")
        rtsp_url: عنوان URL لـ RTSP (إذا كان source_type هو "rtsp")
    """
    try:
        # الحصول على النماذج
        models = load_models()
        
        # إعداد التقاط الفيديو بناءً على نوع المصدر
        if source_type == "webcam":
            cap = cv2.VideoCapture(0)  # استخدام الكاميرا الافتراضية
        elif source_type == "file" and source_path:
            if not os.path.exists(source_path):
                logger.error(f"ملف الفيديو غير موجود: {source_path}")
                active_streams[stream_id]['status'] = 'error'
                active_streams[stream_id]['error'] = f"ملف الفيديو غير موجود: {source_path}"
                return
            cap = cv2.VideoCapture(source_path)
        elif source_type == "rtsp" and rtsp_url:
            cap = cv2.VideoCapture(rtsp_url)
        else:
            active_streams[stream_id]['status'] = 'error'
            active_streams[stream_id]['error'] = "نوع مصدر غير صالح أو معلمات مفقودة"
            return
        
        if not cap.isOpened():
            active_streams[stream_id]['status'] = 'error'
            active_streams[stream_id]['error'] = f"فشل في فتح مصدر {source_type}"
            return
        
        # تعيين الدقة لكاميرا الويب
        if source_type == "webcam":
            cap.set(cv2.CAP_PROP_FRAME_WIDTH, 640)
            cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 360)
        
        # الحصول على أبعاد الفيديو
        width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
        height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
        box_thick, font_scale, font_thick = get_dynamic_sizes(width)
        
        # إعداد متغيرات المعالجة
        frame_count = 0
        process_fps = 0
        start_time = time.time()
        alert_active = False
        alert_type = ""
        blink = True
        blink_timer = time.time()
        last_capture_time = 0
        
        # إحصائيات للتتبع
        stats = {
            'persons': 0,
            'bags': 0,
            'mask': 0,
            'no_mask': 0,
            'weapons': 0,
            'drones': 0
        }
        
        # تحديث حالة البث
        active_streams[stream_id]['status'] = 'streaming'
        logger.info(f"✅ بدأ البث {stream_id} ({source_type})")
        
        # حلقة البث الرئيسية
        while stream_id in active_streams and active_streams[stream_id]['status'] == 'streaming':
            ret, frame = cap.read()
            
            if not ret:
                # للملفات، ارجع إلى البداية
                if source_type == "file":
                    cap.set(cv2.CAP_PROP_POS_FRAMES, 0)
                    continue
                else:
                    # لكاميرا الويب/RTSP، انتهي إذا لم نتمكن من الحصول على إطار
                    break
            
            # تحديث FPS
            frame_count += 1
            now = time.time()
            elapsed = now - start_time
            if elapsed >= 1:
                process_fps = frame_count / elapsed
                frame_count = 0
                start_time = now
            
            # تحديث مؤقت الوميض
            if now - blink_timer >= 0.3:
                blink = not blink
                blink_timer = now
            
            # معالجة باستخدام YOLO
            results = models['yolo'](frame, conf=YOLO_CONF, iou=YOLO_IOU, verbose=False)
            
            # إعادة تعيين الإحصائيات لهذا الإطار
            stats = {
                'persons': 0,
                'bags': 0,
                'mask': 0,
                'no_mask': 0,
                'weapons': 0,
                'drones': 0
            }
            
            persons = []
            
            # معالجة نتائج YOLO
            for r in results:
                if r.boxes is None:
                    continue
                
                for box in r.boxes:
                    cid = int(box.cls[0])
                    # الحصول على الإحداثيات
                    x1 = int(box.xyxy[0][0])
                    y1 = int(box.xyxy[0][1])
                    x2 = int(box.xyxy[0][2])
                    y2 = int(box.xyxy[0][3])
                    conf = float(box.conf[0])
                    
                    # حقائب
                    if cid in BAG_IDS:
                        stats['bags'] += 1
                        draw_box(frame, x1, y1, x2, y2, C_YELLOW, f"{BAG_IDS[cid]}: {conf:.2f}", 
                                box_thick, font_scale, font_thick)
                    
                    # أشخاص
                    elif cid == PERSON_ID:
                        stats['persons'] += 1
                        cv2.rectangle(frame, (x1, y1), (x2, y2), C_BLUE, box_thick)
                        cv2.putText(frame, f"Person: {conf:.2f}", (x1, y2+20), 
                                    cv2.FONT_HERSHEY_SIMPLEX, font_scale, C_BLUE, font_thick)
                        
                        # إضافة إلى قائمة الأشخاص للكشف عن القناع
                        persons.append((x1, y1, x2, y2))
                    
                    # أسلحة
                    elif cid in WEAPON_CLASSES:
                        stats['weapons'] += 1
                        weapon_type = WEAPON_CLASSES[cid]
                        
                        draw_box(frame, x1, y1, x2, y2, C_RED, f"{weapon_type}: {conf:.2f}", 
                                box_thick + 2, font_scale + 0.2, font_thick)
                        
                        alert_active = True
                        alert_type = weapon_type.upper()
                        
                        # التقاط الكشف إذا مر الفاصل الزمني
                        if now - last_capture_time >= 3:
                            capture_path = capture_frame(frame, weapon_type, (x1, y1, x2, y2))
                            last_capture_time = now
            
            # معالجة الوجوه للكشف عن القناع إذا كان CLIP متاحًا
            if models['clip_model'] is not None:
                face_detector = models['face_cascade']
                clip_model = models['clip_model']
                clip_proc = models['clip_proc']
                use_openai_clip = models['use_openai_clip']
                device = models['device']
                
                for (px1, py1, px2, py2) in persons:
                    roi = frame[py1:py2, px1:px2]
                    if roi.size == 0:
                        continue
                    
                    gray = cv2.cvtColor(roi, cv2.COLOR_BGR2GRAY)
                    faces = face_detector.detectMultiScale(gray, 1.15, 3, minSize=(25, 25))
                    
                    for (fx, fy, fw, fh) in faces:
                        if fw < 30:
                            continue
                        
                        face = roi[fy:fy+fh, fx:fx+fw]
                        if face.size < 400:
                            continue
                        
                        # تحسين الصورة
                        face = enhance_face(face)
                        
                        small = cv2.resize(face, (56, 56))
                        rgb = cv2.cvtColor(small, cv2.COLOR_BGR2RGB)
                        pil = Image.fromarray(rgb)
                        
                        if use_openai_clip:
                            # استخدام CLIP الأصلي من OpenAI
                            image = clip_proc(pil).unsqueeze(0).to(device)
                            text = clip.tokenize(CLIP_LABELS).to(device)
                            
                            with torch.no_grad():
                                logits_per_image, _ = clip_model(image, text)
                                probs = logits_per_image.softmax(dim=-1)
                        else:
                            # استخدام HuggingFace transformers CLIP
                            inputs = clip_proc(
                                text=CLIP_LABELS, images=pil,
                                return_tensors="pt", padding=True
                            ).to(device)
                            
                            with torch.no_grad():
                                out = clip_model(**inputs)
                                probs = out.logits_per_image.softmax(dim=1)
                        
                        idx = probs.argmax().item()
                        conf = probs[0][idx].item()
                        has_mask = (idx == 0)  # تم تغييره من 1 إلى 0 لأننا عكسنا ترتيب التسميات
                        
                        color = C_GREEN if has_mask else C_RED
                        label = "NO MASK" if has_mask else "MASK"
                        
                        # تحديث الإحصائيات
                        if has_mask:
                            stats['mask'] += 1
                        else:
                            stats['no_mask'] += 1
                            
                            # التقاط كشف بدون قناع إذا مر الفاصل الزمني
                            if now - last_capture_time >= 3:
                                capture_path = capture_frame(frame, "NoMask", (px1+fx, py1+fy, px1+fx+fw, py1+fy+fh))
                                last_capture_time = now
                        
                        draw_box(frame, px1+fx, py1+fy, px1+fx+fw, py1+fy+fh, color, 
                                f"{label}: {conf:.2f}", box_thick, font_scale, font_thick)
            
            # رسم لوحة المعلومات
            draw_dashboard(frame, process_fps, stats, alert_active)
            
            # رسم التنبيه إذا كان نشطًا
            if alert_active:
                draw_alert(frame, alert_type, blink)
            
            # إرسال إطار عبر Socket.IO
            _, buffer = cv2.imencode('.jpg', frame, [cv2.IMWRITE_JPEG_QUALITY, 70])
            frame_base64 = base64.b64encode(buffer).decode('utf-8')
            
            # الحصول على camera_id من معلومات البث
            camera_id = active_streams[stream_id].get('name', f"Stream {stream_id}")
            
            # بث الإطار مع camera_id لمطابقة توقعات الواجهة الأمامية
            socketio.emit('stream_frame', {
                'stream_id': stream_id,
                'camera_id': camera_id,  # مهم لتحديد الواجهة الأمامية
                'frame': frame_base64,
                'stats': stats,
                'fps': round(process_fps, 1),
                'detections': {
                    'person_count': stats['persons'],
                    'bag_count': stats['bags'],
                    'weapon_count': stats['weapons'],
                    'distance': random.randint(70, 120),  # مسافة محاكاة
                    'signal': random.randint(70, 95),     # قوة إشارة محاكاة
                    'confidence': {
                        'person': random.randint(88, 96), # ثقة محاكاة
                        'bag': random.randint(76, 89)     # ثقة محاكاة
                    }
                }
            })
            
            # بث أيضًا على قناة محددة
            socketio.emit(f'stream_frame_{stream_id}', {
                'frame': frame_base64,
                'stats': stats,
                'fps': round(process_fps, 1)
            })
            
            # تقليل سرعة البث لتجنب التحميل الزائد على Socket.IO
            time.sleep(0.05)
        
        # تحرير الموارد
        cap.release()
        
        # تحديث حالة البث
        if stream_id in active_streams:
            active_streams[stream_id]['status'] = 'stopped'
        
        logger.info(f"✅ توقف البث {stream_id}")
    
    except Exception as e:
        logger.error(f"خطأ في معالجة البث {stream_id}: {str(e)}")
        if stream_id in active_streams:
            active_streams[stream_id]['status'] = 'error'
            active_streams[stream_id]['error'] = str(e)
        
        socketio.emit(f'stream_error_{stream_id}', {'error': str(e)})
        socketio.emit('stream_error', {'stream_id': stream_id, 'camera_id': active_streams[stream_id].get('name', ''), 'message': str(e)})




def start_stream(source_type, source_path=None, rtsp_url=None, name=None):
    """
    بدء بث جديد وإرجاع معرفه
    
    المعلمات:
        source_type: نوع المصدر ("webcam"، "file"، "rtsp")
        source_path: مسار ملف الفيديو (إذا كان source_type هو "file")
        rtsp_url: عنوان URL لـ RTSP (إذا كان source_type هو "rtsp")
        name: اسم ودي اختياري للبث
    
    الإرجاع:
        معرف البث
    """
    stream_id = str(uuid.uuid4())
    
    # إنشاء إدخال البث
    stream_info = {
        'id': stream_id,
        'name': name or f"Stream {len(active_streams) + 1}",
        'type': source_type,
        'status': 'starting',
        'created': datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
    }
    
    if source_type == "file" and source_path:
        stream_info['source_path'] = source_path
    elif source_type == "rtsp" and rtsp_url:
        stream_info['rtsp_url'] = rtsp_url
    
    active_streams[stream_id] = stream_info
    
    # إخطار العملاء بأن البث بدأ
    socketio.emit('stream_started', {
        'stream_id': stream_id, 
        'camera_id': name,  # مهم لتحديد الواجهة الأمامية
        'status': 'starting'
    })
    
    # بدء مؤشر ترابط البث
    stream_thread = Thread(
        target=process_stream, 
        args=(stream_id, source_type, source_path, rtsp_url)
    )
    stream_thread.daemon = True
    stream_thread.start()
    
    return stream_id




def stop_stream(stream_id):
    """
    إيقاف بث حسب المعرف
    
    المعلمات:
        stream_id: معرف البث المراد إيقافه
        
    الإرجاع:
        True إذا نجح، False خلاف ذلك
    """
    if stream_id in active_streams:
        active_streams[stream_id]['status'] = 'stopping'
        time.sleep(0.5)  # إعطاء المؤشر الترابط وقتًا للخروج
        
        # إخطار العملاء بأن البث توقف
        socketio.emit('stream_stopped', {
            'stream_id': stream_id,
            'camera_id': active_streams[stream_id].get('name', ''),
            'status': 'stopped'
        })
        
        return True
    return False




# إضافة مسارات لملفات CSS و JS والصور
@app.route('/css/<path:filename>')
def serve_css(filename):
    return send_from_directory(os.path.join(parent_dir, 'css'), filename)




@app.route('/js/<path:filename>')
def serve_js(filename):
    return send_from_directory(os.path.join(parent_dir, 'js'), filename)




@app.route('/img/<path:filename>')
def serve_img(filename):
    return send_from_directory(os.path.join(parent_dir, 'img'), filename)




@app.route('/<path:filename>.png')
def serve_png(filename):
    return send_from_directory(parent_dir, f"{filename}.png")




@app.route('/weapon_captures/<path:filename>')
def serve_weapon_captures(filename):
    return send_from_directory(os.path.join(parent_dir, 'weapon_captures'), filename)




# مسارات الويب لجميع الصفحات
@app.route('/')
def index():
    """تقديم الصفحة الرئيسية"""
    return render_template('index.html')




@app.route('/live-broadcast.html')
def live_broadcast():
    """تقديم صفحة البث المباشر"""
    return render_template('live-broadcast.html')




@app.route('/analytics.html')
def analytics():
    """تقديم صفحة التحليلات"""
    return render_template('analytics.html')




@app.route('/alerts-log.html')
def alerts_log():
    """تقديم صفحة سجل التنبيهات"""
    return render_template('alerts-log.html')




@app.route('/drone-management.html')
def drone_management():
    """تقديم صفحة إدارة الطائرات بدون طيار"""
    return render_template('drone-management.html')




@app.route('/interactive-map.html')
def interactive_map():
    """تقديم صفحة الخريطة التفاعلية"""
    return render_template('interactive-map.html')




@app.route('/reports.html')
def reports():
    """تقديم صفحة التقارير"""
    return render_template('reports.html')




@app.route('/settings.html')
def settings():
    """تقديم صفحة الإعدادات"""
    return render_template('settings.html')




@app.route('/users.html')
def users():
    """تقديم صفحة المستخدمين"""
    return render_template('users.html')




# اختبار وظائف الخادم
@app.route('/test_server')
def test_server():
    """اختبار أن الخادم يعمل"""
    return jsonify({
        'status': 'ok',
        'message': 'Server is running',
        'time': datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
        'static_folder': app.static_folder,
        'upload_folder': UPLOADS_FOLDER,
        'processed_folder': PROCESSED_FOLDER,
        'captures_folder': CAPTURES_FOLDER
    })




@app.route('/test_upload', methods=['POST'])
def test_upload():
    """اختبار رفع الملفات"""
    try:
        logger.info("اختبار الرفع - استلام طلب")
        if 'file' not in request.files:
            logger.warning("اختبار الرفع - لا يوجد ملف في الطلب")
            return jsonify({'error': 'No file in request'}), 400
            
        test_file = request.files['file']
        if test_file.filename == '':
            logger.warning("اختبار الرفع - اسم الملف فارغ")
            return jsonify({'error': 'Empty filename'}), 400
        
        logger.info(f"اختبار الرفع - استلام الملف: {test_file.filename}, النوع: {test_file.content_type}")
        return jsonify({
            'success': True,
            'message': f'Received file: {test_file.filename}, type: {test_file.content_type}'
        })
    except Exception as e:
        logger.error(f"اختبار الرفع - حدث خطأ: {str(e)}")
        return jsonify({'error': str(e)}), 500




# نقاط نهاية API
@app.route('/api/streams', methods=['GET'])
def get_streams():
    """الحصول على جميع البث النشطة"""
    return jsonify({
        'streams': list(active_streams.values())
    })




@app.route('/api/start-stream', methods=['POST'])
def api_start_stream():
    """بدء بث جديد عبر API"""
    try:
        data = request.json or {}
        logger.info(f"بيانات طلب بدء البث: {data}")
        
        # التعامل مع كلا الشكلين (camera_id من الواجهة الأمامية أو source_type من الوثائق)
        camera_id = data.get('camera_id')
        source_type = data.get('source_type', 'webcam')
        source_path = data.get('source_path')
        rtsp_url = data.get('rtsp_url')
        name = data.get('name')
        
        # إذا تم توفير camera_id وبدون اسم، استخدمه كاسم
        if camera_id and not name:
            name = camera_id
        
        stream_id = start_stream(source_type, source_path, rtsp_url, name)
        
        logger.info(f"بدأ البث: {stream_id} للكاميرا: {name or camera_id}")
        
        return jsonify({
            'stream_id': stream_id,
            'status': 'starting',
            'message': f'Stream {source_type} started',
            'camera_id': camera_id  # إرجاع camera_id للرجوع إليه في الواجهة الأمامية
        })
    except Exception as e:
        logger.error(f"خطأ في بدء البث: {str(e)}")
        return jsonify({
            'error': str(e),
            'message': 'Failed to start stream'
        }), 500




@app.route('/api/stop-stream/<stream_id>', methods=['POST'])
def api_stop_stream(stream_id):
    """إيقاف بث عبر API"""
    if stream_id not in active_streams:
        return jsonify({'error': 'Stream not found'}), 404
    
    success = stop_stream(stream_id)
    
    if success:
        return jsonify({
            'status': 'success',
            'message': f'Stream {stream_id} stopped'
        })
    else:
        return jsonify({
            'error': 'Failed to stop stream'
        }), 500




@app.route('/api/stop-stream', methods=['POST'])
def api_stop_stream_by_data():
    """إيقاف بث عبر API باستخدام بيانات POST"""
    data = request.json or {}
    stream_id = data.get('stream_id')
    
    if not stream_id:
        return jsonify({'error': 'No stream_id provided'}), 400
        
    if stream_id not in active_streams:
        return jsonify({'error': 'Stream not found'}), 404
    
    success = stop_stream(stream_id)
    
    if success:
        return jsonify({
            'status': 'success',
            'message': f'Stream {stream_id} stopped'
        })
    else:
        return jsonify({
            'error': 'Failed to stop stream'
        }), 500




@app.route('/api/stream/<stream_id>', methods=['GET'])
def get_stream(stream_id):
    """الحصول على معلومات البث"""
    if stream_id not in active_streams:
        return jsonify({'error': 'Stream not found'}), 404
    
    return jsonify(active_streams[stream_id])




# API معالجة الفيديو
@app.route('/upload', methods=['POST'])
def upload_video():
    """معالجة رفع الفيديو"""
    try:
        logger.info("استلام طلب رفع فيديو")
        
        if 'video' not in request.files:
            logger.warning("لا يوجد ملف فيديو مقدم")
            return jsonify({'error': 'No video file provided'}), 400
        
        video_file = request.files['video']
        if video_file.filename == '':
            logger.warning("اسم ملف فارغ")
            return jsonify({'error': 'Empty filename'}), 400
        
        # طباعة معلومات الملف
        logger.info(f"استلام الملف: {video_file.filename}, النوع: {video_file.content_type}")
        
        # إنشاء معرف فريد وحفظ الملف
        task_id = str(uuid.uuid4())
        
        # التأكد من وجود مجلد التحميل
        os.makedirs(UPLOADS_FOLDER, exist_ok=True)
        
        video_path = os.path.join(UPLOADS_FOLDER, f"{task_id}_{video_file.filename}")
        logger.info(f"حفظ الملف في: {video_path}")
        
        video_file.save(video_path)
        logger.info(f"تم حفظ الملف: {video_path}")
        
        # إنشاء إدخال المهمة
        tasks[task_id] = {
            'id': task_id,
            'filename': video_file.filename,
            'upload_time': datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
            'status': 'uploaded',
            'progress': 0
        }
        
        # بدء مؤشر ترابط المعالجة
        processing_thread = Thread(target=process_video_thread, args=(video_path, task_id))
        processing_thread.daemon = True
        processing_thread.start()
        
        logger.info(f"بدأت معالجة المهمة: {task_id}")
        
        return jsonify({
            'task_id': task_id,
            'message': 'Video uploaded and processing started'
        })
    
    except Exception as e:
        logger.error(f"خطأ في رفع الفيديو: {str(e)}")
        import traceback
        logger.error(traceback.format_exc())
        return jsonify({'error': str(e)}), 500




@app.route('/task/<task_id>')
def get_task(task_id):
    """الحصول على حالة المهمة والنتائج"""
    if task_id not in tasks:
        return jsonify({'error': 'Task not found'}), 404
    
    return jsonify(tasks[task_id])




# معالجات أحداث Socket.IO
@socketio.on('connect')
def handle_connect():
    logger.info(f"✅ اتصل العميل: {request.sid}")




@socketio.on('disconnect')
def handle_disconnect():
    logger.info(f"❌ انقطع اتصال العميل: {request.sid}")




@socketio.on('start_stream')
def handle_start_stream(data):
    source_type = data.get('source_type', 'webcam')
    source_path = data.get('source_path')
    rtsp_url = data.get('rtsp_url')
    name = data.get('name')
    camera_id = data.get('camera_id')  # الحصول على camera_id إذا تم توفيره
    
    # إذا تم توفير camera_id ولكن ليس هناك اسم، استخدمه كاسم
    if camera_id and not name:
        name = camera_id
    
    logger.info(f"Socket.IO start_stream: {name} ({source_type})")
    
    stream_id = start_stream(source_type, source_path, rtsp_url, name)
    
    return {
        'stream_id': stream_id,
        'status': 'starting',
        'message': f'Stream {source_type} started',
        'camera_id': camera_id  # إرجاع camera_id للرجوع إليه في الواجهة الأمامية
    }




@socketio.on('stop_stream')
def handle_stop_stream(data):
    stream_id = data.get('stream_id')
    
    if not stream_id or stream_id not in active_streams:
        return {'status': 'error', 'message': 'Invalid stream ID'}
    
    success = stop_stream(stream_id)
    
    if success:
        return {'status': 'success', 'message': f'Stream {stream_id} stopped'}
    else:
        return {'status': 'error', 'message': 'Failed to stop stream'}




@socketio.on('get_streams')
def handle_get_streams():
    return {'streams': list(active_streams.values())}




@socketio.on('get_tasks')
def handle_get_tasks():
    return {'tasks': list(tasks.values())}




# بدء التطبيق
if __name__ == '__main__':
    # تحميل النماذج عند بدء التشغيل
    load_models()
    
    # تشغيل تطبيق Flask مع Socket.IO
    logger.info("🚀 بدء الخادم على المنفذ 5600...")
    socketio.run(app, host='0.0.0.0', port=5600, debug=True, allow_unsafe_werkzeug=True)