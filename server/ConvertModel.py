import torch
from transformers import AutoTokenizer, AutoModelForSequenceClassification

model = AutoModelForSequenceClassification.from_pretrained("tsdocode/phobert-finetune-hatespeech", num_labels=3)
tokenizer = AutoTokenizer.from_pretrained("tsdocode/phobert-finetune-hatespeech")

dummy_input = tokenizer("text", return_tensors="pt", truncation=True, max_length=256, padding="max_length")
torch.onnx.export(
    model,
    (dummy_input['input_ids'], dummy_input['attention_mask']),
    "phobert.onnx",
    input_names=['input_ids', 'attention_mask'],
    output_names=['output'],
    dynamic_axes={'input_ids': {0: 'batch_size', 1: 'sequence_length'},
                  'attention_mask': {0: 'batch_size', 1: 'sequence_length'}}
)
print("Model exported to phobert.onnx")
