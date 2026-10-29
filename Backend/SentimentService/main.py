# -*- coding: utf-8 -*-
import os
import sys

if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        pass

import numpy as np
import torch
import joblib
from typing import Optional, Dict
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from transformers import AutoTokenizer, AutoModel, AutoModelForSequenceClassification, pipeline

app = FastAPI(title="Share_Locations AI Sentiment & Moderation Microservice", version="5.0-Titan")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

BACKBONE_NAME = os.getenv("SENTIMENT_MODEL", "mr4/phobert-base-vi-sentiment-analysis")
TOXICITY_MODEL_NAME = os.getenv("TOXICITY_MODEL", "tsdocode/phobert-finetune-hatespeech")

MODELS_DIR = os.path.join(os.path.dirname(__file__), "models")
PLACE_SENTIMENT_MODEL_PATH = os.path.join(MODELS_DIR, "place_sentiment_model.joblib")
SARCASM_MODEL_PATH = os.path.join(MODELS_DIR, "sarcasm_detector.joblib")
ASPECT_MODELS_PATH = os.path.join(MODELS_DIR, "aspect_sentiment_model.joblib")

backbone_tokenizer = None
backbone_model = None
place_sentiment_payload = None
sarcasm_classifier = None
toxicity_classifier = None
aspect_models_payload = None

def get_backbone():
    global backbone_tokenizer, backbone_model
    if backbone_tokenizer is None or backbone_model is None:
        print(f"[*] Loading PhoBERT Sequence Classification Backbone: {BACKBONE_NAME} ...")
        backbone_tokenizer = AutoTokenizer.from_pretrained(BACKBONE_NAME)
        backbone_model = AutoModelForSequenceClassification.from_pretrained(BACKBONE_NAME)
        backbone_model.eval()
        print("[✓] PhoBERT Sequence Classification Backbone loaded successfully!")
    return backbone_tokenizer, backbone_model

def get_place_sentiment_model():
    global place_sentiment_payload
    if place_sentiment_payload is None and os.path.exists(PLACE_SENTIMENT_MODEL_PATH):
        try:
            place_sentiment_payload = joblib.load(PLACE_SENTIMENT_MODEL_PATH)
            try:
                print(f"[✓] Loaded {place_sentiment_payload.get('model_name', 'Place Sentiment Model')} (F1: {place_sentiment_payload.get('f1_macro', 0)*100:.2f}%)!")
            except Exception:
                pass
        except Exception as e:
            print(f"[X] Failed to load place sentiment model: {e}")
    return place_sentiment_payload

def get_sarcasm_classifier():
    global sarcasm_classifier
    if sarcasm_classifier is None and os.path.exists(SARCASM_MODEL_PATH):
        try:
            sarcasm_classifier = joblib.load(SARCASM_MODEL_PATH)
            try:
                print("[✓] Sarcasm Neural Classifier Head loaded successfully!")
            except Exception:
                pass
        except Exception as e:
            print(f"[X] Failed to load sarcasm classifier: {e}")
    return sarcasm_classifier

def get_aspect_models():
    global aspect_models_payload
    if aspect_models_payload is None and os.path.exists(ASPECT_MODELS_PATH):
        try:
            aspect_models_payload = joblib.load(ASPECT_MODELS_PATH)
            try:
                print(f"[✓] Loaded {len(aspect_models_payload)} Aspect Classifiers (Food, Service, Ambience, Price, Hygiene)!")
            except Exception:
                pass
        except Exception as e:
            print(f"[X] Failed to load aspect models: {e}")
    return aspect_models_payload

def get_toxicity_classifier():
    global toxicity_classifier
    if toxicity_classifier is None:
        print(f"[*] Loading ViHSD Toxicity/Hate-Speech Transformer: {TOXICITY_MODEL_NAME} ...")
        toxicity_classifier = pipeline(
            "text-classification",
            model=TOXICITY_MODEL_NAME,
            tokenizer=TOXICITY_MODEL_NAME,
            top_k=None
        )
        print("[✓] ViHSD Toxicity model loaded successfully!")
    return toxicity_classifier

class AnalyzeRequest(BaseModel):
    text: str

class AspectDetail(BaseModel):
    sentiment: str  # POS, NEG, NEU
    score: float  # [-1.0, +1.0]
    confidence: float

class AnalyzeResponse(BaseModel):
    # PhoBERT Place Sentiment (Trained Domain Deep Model)
    label: str  # POS, NEG, NEU
    score: float  # Normalized [-1.0, +1.0]
    confidence: float
    positive: float
    neutral: float
    negative: float

    # ViHSD Hate Speech / Toxicity Moderation AI
    is_toxic: bool
    toxicity_label: str  # CLEAN, OFFENSIVE, HATE
    toxicity_score: float
    toxicity_reason: str | None = None

    # PhoBERT Deep Sarcasm / Irony Detection (Trained Deep Model)
    is_sarcastic: bool = False
    sarcasm_score: float = 0.0
    sarcasm_reason: str | None = None

    # PhoBERT ABSA 5 Core Travel/Place Aspects
    aspects: Optional[Dict[str, AspectDetail]] = None

@app.on_event("startup")
async def startup_event():
    try:
        get_backbone()
        get_place_sentiment_model()
        get_sarcasm_classifier()
        get_aspect_models()
        get_toxicity_classifier()
    except Exception as e:
        print(f"Model startup loading error: {e}")

@app.get("/health")
def health():
    return {
        "status": "ok",
        "engine": "Pure Deep Learning (Titan 1,536-D Dual-Pooled Representation, Zero Regex)",
        "backbone": BACKBONE_NAME,
        "sentiment_engine": "PhoBERT-1536D Deep Neural Ensemble (Trained on 12,000+ real place reviews)",
        "sarcasm_engine": "PhoBERT-1536D Deep Sarcasm Ensemble (Trained on 5,400+ balanced samples)",
        "aspect_engine": "PhoBERT-1536D Multi-Aspect ABSA (Food, Service, Ambience, Price, Hygiene)",
        "toxicity_engine": TOXICITY_MODEL_NAME
    }

TOXIC_LABEL_MAP = {
    "label_0": "CLEAN",
    "label_1": "OFFENSIVE",
    "label_2": "HATE"
}

@app.post("/analyze", response_model=AnalyzeResponse)
def analyze(req: AnalyzeRequest):
    text = (req.text or "").strip()
    words = text.split()

    # Bảo vệ trải nghiệm gõ phím khi văn bản chưa hoàn chỉnh (< 2 ký tự)
    if not text or len(text) < 2:
        return AnalyzeResponse(
            label="NEU",
            score=0.0,
            confidence=1.0,
            positive=0.0,
            neutral=1.0,
            negative=0.0,
            is_toxic=False,
            toxicity_label="CLEAN",
            toxicity_score=0.0,
            toxicity_reason=None,
            is_sarcastic=False,
            sarcasm_score=0.0,
            sarcasm_reason=None,
            aspects=None
        )

    tok, backbone = get_backbone()

    # Trích xuất 1,536-D Dual-Pooled Representation từ PhoBERT
    inputs = tok(text, return_tensors="pt", truncation=True, max_length=128)
    with torch.no_grad():
        out = backbone(**inputs, output_hidden_states=True)
        hidden_states = out.hidden_states[-1]
        cls_vec = hidden_states[:, 0, :].cpu().numpy()
        
        # Mean pooling có xét attention mask
        attention_mask = inputs["attention_mask"].unsqueeze(-1).float()
        sum_embeddings = torch.sum(hidden_states * attention_mask, dim=1)
        sum_mask = torch.clamp(attention_mask.sum(dim=1), min=1e-9)
        mean_vec = (sum_embeddings / sum_mask).cpu().numpy()
        
        dual_emb = np.hstack([cls_vec, mean_vec])

        # Phân phối xác suất từ đầu phân loại nơ-ron 110M tham số của PhoBERT
        # id2label: {0: 'Tiêu cực', 1: 'Tích cực', 2: 'Trung tính'}
        raw_native_probs = torch.softmax(out.logits, dim=1).cpu().numpy()[0]
        # Quy chuẩn về mảng 3 chiều theo thứ tự [NEG, NEU, POS]
        phobert_native_probs = np.array([float(raw_native_probs[0]), float(raw_native_probs[2]), float(raw_native_probs[1])])

        # Khử nhiễu BPE do viết hoa chữ cái đầu câu trong ngữ pháp tiếng Việt (casing invariance)
        # Ví dụ: "Bảo vệ hung hăng" bị tách thành subword "Bảo@@" mang thiên kiến tích cực từ dữ liệu gốc,
        # trong khi "bảo vệ hung hăng" thể hiện chính xác 98% tiêu cực.
        if text[0].isupper() and len(text) > 1 and not text.isupper():
            try:
                lower_first_text = text[0].lower() + text[1:]
                inputs_lf = tok(lower_first_text, return_tensors="pt", truncation=True, max_length=128)
                with torch.no_grad():
                    out_lf = backbone(**inputs_lf, output_hidden_states=False)
                    raw_lf_probs = torch.softmax(out_lf.logits, dim=1).cpu().numpy()[0]
                    native_lf_probs = np.array([float(raw_lf_probs[0]), float(raw_lf_probs[2]), float(raw_lf_probs[1])])
                if native_lf_probs[0] > phobert_native_probs[0] and native_lf_probs[0] >= 0.50:
                    phobert_native_probs = native_lf_probs
                elif native_lf_probs[2] > phobert_native_probs[2] and native_lf_probs[2] >= 0.50:
                    phobert_native_probs = native_lf_probs
            except Exception as e:
                pass

    # Kiểm tra chiều đầu vào
    sent_payload = get_place_sentiment_model()
    sarc_clf = get_sarcasm_classifier()

    feat_for_inference = dual_emb
    if sent_payload and sent_payload.get("input_dim") == 768:
        feat_for_inference = cls_vec

    # =========================================================================
    # 1. PhoBERT Place Sentiment AI (Mô hình học sâu chuyên ngành Địa điểm)
    # =========================================================================
    if sent_payload is not None:
        s_model = sent_payload["model"]
        inv_map = sent_payload["inv_label_map"]
        req_dim = getattr(s_model, "n_features_in_", dual_emb.shape[1])
        f_vec = dual_emb if req_dim == 1536 else cls_vec
        
        domain_probs = s_model.predict_proba(f_vec)[0]  # [NEG, NEU, POS]

        p_native_pos = phobert_native_probs[2]
        p_native_neg = phobert_native_probs[0]
        p_native_neu = phobert_native_probs[1]

        # Deep Dual-Head Ensemble (Domain Model + Native Pretrained PhoBERT Head)
        # Tự động hóa xử lý các cấu trúc thành ngữ tiếng Việt và phủ định kép
        # Gating điều phối phân cấp thông minh:
        # 1. Nếu PhoBERT Native khẳng định tiêu cực cao (>= 0.70) và hầu như không có tích cực (< 0.20)
        #    -> Ưu tiên Native PhoBERT (xử lý triệt để: 'không bao giờ quay lại', 'không nhiệt tình', 'không nuốt nổi', 'né gấp', 'bảo vệ hung hăng')
        if p_native_neg >= 0.70 and p_native_pos < 0.20:
            probs = 0.15 * domain_probs + 0.85 * phobert_native_probs
        # 2. Nếu PhoBERT native khẳng định tích cực rất cao (>= 0.85) và Domain Model không thấy tiêu cực (domain_probs[0] < 0.20)
        #    -> Tối ưu cho thành ngữ phủ định kép khen ngợi ("không có gì để chê", "không thể không đến", "không thể bỏ qua")
        elif p_native_pos >= 0.85 and domain_probs[0] < 0.20:
            probs = 0.30 * domain_probs + 0.70 * phobert_native_probs
        # 3. Nếu mô hình chuyên ngành (Domain Head) phát hiện tín hiệu tích cực rõ nét (domain_probs[2] >= 0.50 và > NEG)
        #    -> Ưu tiên mô hình miền (xử lý chuẩn các tiếng lóng khen ngợi như "dính cứng ngắc", "quán ruột", "rộng quá")
        elif domain_probs[2] >= 0.50 and domain_probs[2] > domain_probs[0]:
            probs = 0.85 * domain_probs + 0.15 * phobert_native_probs
        # 4. Nếu mô hình chuyên ngành phát hiện tín hiệu tiêu cực rõ nét (domain_probs[0] >= 0.35)
        #    -> Ưu tiên mô hình miền (xử lý câu chê tương phản như 'tưởng ngon...', 'chẳng có gì để khen...')
        elif domain_probs[0] >= 0.35:
            probs = 0.85 * domain_probs + 0.15 * phobert_native_probs
        # 5. Nếu PhoBERT native khẳng định trung lập cao
        elif p_native_neu >= 0.80 and domain_probs[1] >= 0.35:
            probs = 0.30 * domain_probs + 0.70 * phobert_native_probs
        else:
            probs = 0.65 * domain_probs + 0.35 * phobert_native_probs

        neg = float(probs[0])
        neu = float(probs[1])
        pos = float(probs[2])
        best_class = int(np.argmax(probs))
        top_label = inv_map.get(best_class, "NEU")
        confidence = float(probs[best_class])
        if top_label == "NEU":
            # Khi nhãn dự đoán là Trung lập (NEU), điểm cảm xúc thực tế dao động hẹp quanh mốc 0.0
            # Tỷ lệ thiên lệch (pos - neg) được điều tiết bởi xác suất trung lập
            net_score = (pos - neg) * (1.0 - neu)
            # Khóa chặn biên an toàn cho nhãn NEU trong phạm vi [-0.20, +0.20]
            net_score = max(-0.20, min(0.20, net_score))
        else:
            net_score = pos - neg
    else:
        pos, neu, neg = 0.0, 1.0, 0.0
        top_label = "NEU"
        confidence = 1.0
        net_score = 0.0

    # =========================================================================
    # 2. PhoBERT Sarcasm / Irony AI (Mô hình học sâu phát hiện mỉa mai)
    # =========================================================================
    is_sarcastic = False
    sarcasm_reason = None
    sarcasm_prob = 0.0

    if sarc_clf is not None:
        try:
            req_dim_sarc = getattr(sarc_clf, "n_features_in_", dual_emb.shape[1])
            f_vec_sarc = dual_emb if req_dim_sarc == 1536 else cls_vec
            sarcasm_prob = float(sarc_clf.predict_proba(f_vec_sarc)[0][1])
            
            # Ngưỡng kích hoạt mỉa mai chuẩn xác:
            # Sarcasm thường sử dụng từ khen tích cực cực đại nhưng kèm hậu quả tiêu cực.
            # Vì vậy nếu sarcasm_prob >= 0.42, mô hình nơ-ron nhận diện có tín hiệu châm biếm rõ ràng.
            if (sarcasm_prob >= 0.42) or (sarcasm_prob >= 0.35 and domain_probs[0] >= 0.20):
                is_sarcastic = True
                sarcasm_reason = f"Mô hình AI phát hiện sắc thái châm biếm / mỉa mai (Độ tin cậy: {sarcasm_prob*100:.1f}%)."
        except Exception as e:
            print(f"Sarcasm neural inference error: {e}")

    # Nếu mô hình AI phát hiện châm biếm (khen giả vờ để chê sâu cay)
    if is_sarcastic:
        net_score = -0.85
        top_label = "NEG"
        confidence = max(0.85, round(sarcasm_prob, 2))
        neg = 0.90
        pos = 0.05
        neu = 0.05

    # =========================================================================
    # 3. PhoBERT Aspect-Based Sentiment Analysis (ABSA 5 Khía cạnh)
    # =========================================================================
    aspects_result = None
    asp_models = get_aspect_models()
    if asp_models:
        aspects_result = {}
        for asp_name, asp_meta in asp_models.items():
            try:
                clf_asp = asp_meta["model"]
                inv_m = asp_meta["inv_label_map"]
                req_d = getattr(clf_asp, "n_features_in_", dual_emb.shape[1])
                f_v = dual_emb if req_d == 1536 else cls_vec
                
                probs_asp = clf_asp.predict_proba(f_v)[0]
                neg_a, neu_a, pos_a = float(probs_asp[0]), float(probs_asp[1]), float(probs_asp[2])
                best_idx = int(np.argmax(probs_asp))
                best_lbl = inv_m.get(best_idx, "NEU")
                conf_a = float(probs_asp[best_idx])
                sc_a = pos_a - neg_a
                aspects_result[asp_name] = AspectDetail(
                    sentiment=best_lbl,
                    score=round(sc_a, 4),
                    confidence=round(conf_a, 4)
                )
            except Exception as e:
                pass

        # Tích hợp phân cấp Đa nhiệm (Hierarchical Multi-Task Deep Consensus):
        # 1. Khi các khía cạnh sâu (ABSA) đồng thuận đánh giá Tiêu cực (>= 4 khía cạnh NEG, 0 khía cạnh POS),
        #    mô hình điều chỉnh nhãn tổng thể sang NEG (đặc trưng của phê bình hạn chế / chê gián tiếp).
        # 2. Khi nhãn chính là NEG và đa số khía cạnh đồng thuận NEG, củng cố điểm số tiêu cực rõ rệt (-0.75).
        # 3. Khi đa số khía cạnh là NEU và không có POS/NEG lấn át, củng cố nhãn Trung lập.
        if aspects_result:
            neg_asps = sum(1 for a in aspects_result.values() if a.sentiment == "NEG")
            pos_asps = sum(1 for a in aspects_result.values() if a.sentiment == "POS")
            neu_asps = sum(1 for a in aspects_result.values() if a.sentiment == "NEU")
            if neg_asps >= 4 and pos_asps <= 1 and top_label == "POS":
                top_label = "NEG"
                net_score = -0.70
                neg = 0.85
                pos = 0.10
                confidence = 0.85
            elif neg_asps >= 3 and pos_asps <= 2 and top_label == "POS" and domain_probs[0] >= 0.35:
                top_label = "NEG"
                net_score = -0.70
                neg = 0.85
                pos = 0.10
                confidence = 0.85
            elif top_label == "NEG" and neg_asps >= 3 and pos_asps == 0:
                net_score = min(net_score, -0.75)
                neg = max(neg, 0.85)
                pos = min(pos, 0.10)
                confidence = max(confidence, 0.85)
            elif top_label == "POS" and pos_asps >= 4 and neg_asps == 0:
                net_score = max(net_score, 0.75)
                pos = max(pos, 0.85)
                neg = min(neg, 0.10)
                confidence = max(confidence, 0.85)
            elif neu_asps >= 3 and pos_asps == 0 and neg_asps <= 1:
                top_label = "NEU"
                net_score = 0.0
                neu = 0.85
                confidence = 0.85

    # =========================================================================
    # 4. ViHSD Hate Speech & Toxicity Moderation AI
    # =========================================================================
    t_clf = get_toxicity_classifier()
    t_raw = t_clf(text)[0]

    sorted_t = sorted(t_raw, key=lambda x: x["score"], reverse=True)
    top_t = sorted_t[0]
    raw_lbl = top_t["label"].lower()
    t_label = TOXIC_LABEL_MAP.get(raw_lbl, "CLEAN")
    t_score = round(float(top_t["score"]), 4)

    is_toxic = False
    toxicity_reason = None

    if t_label == "HATE" and t_score >= 0.65:
        is_toxic = True
        toxicity_reason = "Mô hình AI phát hiện nội dung mang tính thù địch, quấy rối hoặc công kích cá nhân."
    elif t_label == "OFFENSIVE" and t_score >= 0.90:
        is_toxic = True
        toxicity_reason = "Mô hình AI phát hiện ngôn từ khiếm nhã, thô lỗ hoặc mang tính lăng mạ."

    return AnalyzeResponse(
        label=top_label,
        score=round(net_score, 4),
        confidence=round(confidence, 4),
        positive=round(pos, 4),
        neutral=round(neu, 4),
        negative=round(neg, 4),
        is_toxic=is_toxic,
        toxicity_label=t_label,
        toxicity_score=t_score,
        toxicity_reason=toxicity_reason,
        is_sarcastic=is_sarcastic,
        sarcasm_score=round(sarcasm_prob, 4),
        sarcasm_reason=sarcasm_reason,
        aspects=aspects_result
    )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=5002, log_level="info")
