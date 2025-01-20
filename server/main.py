from fastapi import FastAPI, status
from pydantic import BaseModel
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware

from transformers import AutoTokenizer
import onnxruntime as ort
import numpy as np

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class TextData(BaseModel):
    text: str

tokenizer = AutoTokenizer.from_pretrained("tsdocode/phobert-finetune-hatespeech")
ort_session = ort.InferenceSession("phobert.onnx")

def predict(text):
    inputs = tokenizer(text[:256], return_tensors="pt", truncation=True, max_length=256, padding="max_length")

    input_ids = inputs['input_ids'].numpy()
    attention_mask = inputs['attention_mask'].numpy()

    if input_ids.shape != attention_mask.shape:
        raise ValueError("Input sai")

    ort_inputs = {'input_ids': input_ids, 'attention_mask': attention_mask}
    ort_outs = ort_session.run(None, ort_inputs)
    
    logits = ort_outs[0]
    label = np.argmax(logits, axis=1)[0]

    return {"label": str(label)}

@app.post("/predict")
def predict_route(data: TextData):
    text = str(data.text)
    if not text:
        return JSONResponse(content={"error": "Không Data"}, status_code=status.HTTP_400_BAD_REQUEST)
    result = predict(text)
    
    return JSONResponse(content=result)
