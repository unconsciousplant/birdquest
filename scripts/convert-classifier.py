"""
Converts the Bird-Classification model (PyTorch) to ONNX so it can run in
the browser, then checks the converted model against the original.

Source: https://github.com/Firefly-ZJ/Bird-Classification (MIT licence,
Copyright (c) 2025 Zhang Jun). See docs/classifier/README.md.

Needs a Python environment with: torch, numpy, pillow, onnxruntime
(this was run with torch 2.2.2, numpy 1.26.4, pillow 11.0.0, onnxruntime 1.16.3).

Usage (from the project folder):
  python scripts/convert-classifier.py \
      --repo   path/to/Bird-Classification      (folder with _BirdNet.py and species_list.csv)
      --weights path/to/model_v1base.pth
      --out    public/classifier/bird-classifier-v1base.onnx
      --check  photo1.png photo2.jpg ...        (optional: compare PyTorch and ONNX)
"""
import argparse
import csv
import importlib.util
import json
from pathlib import Path

import numpy as np
import onnxruntime as ort
import torch
from PIL import Image

MEAN = np.array([0.485, 0.456, 0.406], dtype=np.float32)
STD = np.array([0.229, 0.224, 0.225], dtype=np.float32)


def load_birdnet_module(repo: Path):
    """Imports _BirdNet.py from the repository folder (network definition only)."""
    spec = importlib.util.spec_from_file_location("_BirdNet", repo / "_BirdNet.py")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def preprocess(image_path: Path) -> np.ndarray:
    """Same steps as the repository: Resize(256) -> CenterCrop(224) -> ToTensor -> Normalize.
    Written with PIL + numpy, following torchvision 0.17's exact size and rounding rules."""
    img = Image.open(image_path).convert("RGB")
    w, h = img.size
    short, long = (w, h) if w <= h else (h, w)
    new_short, new_long = 256, int(256 * long / short)
    new_w, new_h = (new_short, new_long) if w <= h else (new_long, new_short)
    img = img.resize((new_w, new_h), Image.BILINEAR)
    top = int(round((new_h - 224) / 2.0))
    left = int(round((new_w - 224) / 2.0))
    img = img.crop((left, top, left + 224, top + 224))
    array = np.asarray(img, dtype=np.float32) / 255.0  # (224, 224, 3)
    array = (array - MEAN) / STD
    return array.transpose(2, 0, 1)[None, ...].astype(np.float32)  # (1, 3, 224, 224)


def softmax(logits: np.ndarray) -> np.ndarray:
    shifted = logits - logits.max()
    exp = np.exp(shifted)
    return exp / exp.sum()


def main():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--repo", type=Path, required=True)
    parser.add_argument("--weights", type=Path, required=True)
    parser.add_argument("--out", type=Path, required=True)
    parser.add_argument("--check", type=Path, nargs="*", default=[])
    parser.add_argument("--report", type=Path, help="optional: save check results as JSON")
    args = parser.parse_args()

    birdnet = load_birdnet_module(args.repo)
    # v1 base: dims (64, 128, 256, 512), layers (3, 4, 6, 3), 384 outputs
    net = birdnet.BirdNet(dims=(64, 128, 256, 512), layers=(3, 4, 6, 3))
    # weights_only=True: load plain weight tables only, never run code from the file
    net.load_state_dict(torch.load(args.weights, map_location="cpu", weights_only=True))
    net.eval()

    with open(args.repo / "species_list.csv", encoding="utf-8") as file:
        species = [row["scientific_name"] for row in csv.DictReader(file)]
    print(f"Species in list: {len(species)} | model outputs: {net.getClassNum()}")

    args.out.parent.mkdir(parents=True, exist_ok=True)
    torch.onnx.export(
        net,
        torch.zeros(1, 3, 224, 224),
        str(args.out),
        input_names=["image"],
        output_names=["logits"],
        opset_version=17,
        do_constant_folding=True,
    )
    print(f"Wrote {args.out} ({args.out.stat().st_size / 1e6:.1f} MB)")

    session = ort.InferenceSession(str(args.out), providers=["CPUExecutionProvider"])
    report = []
    for image_path in args.check:
        x = preprocess(image_path)
        with torch.no_grad():
            torch_logits = net(torch.from_numpy(x)).numpy()[0]
        onnx_logits = session.run(["logits"], {"image": x})[0][0]
        probs = softmax(torch_logits)
        top3 = np.argsort(-probs)[:3]
        same_top3 = list(top3) == list(np.argsort(-softmax(onnx_logits))[:3])
        unknown_mass = probs[len(species):].sum()
        print(f"\n{image_path.name}: max |PyTorch - ONNX| logit difference = {np.abs(torch_logits - onnx_logits).max():.2e}, "
              f"same top 3: {same_top3}, probability on unused outputs: {unknown_mass:.4f}")
        for rank, index in enumerate(top3, start=1):
            name = species[index] if index < len(species) else "Unknown"
            print(f"  {rank}. [{index}] {name}: {probs[index] * 100:.2f}%")
        report.append({
            "image": image_path.name,
            "top3": [{"index": int(i), "scientificName": species[i] if i < len(species) else None,
                      "probability": float(probs[i])} for i in top3],
            "maxLogitDifference": float(np.abs(torch_logits - onnx_logits).max()),
        })

    if args.report:
        args.report.write_text(json.dumps(report, indent=2))


if __name__ == "__main__":
    main()
