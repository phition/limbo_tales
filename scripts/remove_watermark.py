"""
🎬 AI 영상 워터마크 제거 스크립트 (OpenCV Inpainting & Delogo)
사용법:
    python scripts/remove_watermark.py <input_video> [output_video] [--mode telea|ns|blur|patch]
"""

import sys
import os
import argparse
import cv2
import numpy as np

def remove_watermark(input_path, output_path=None, mode='telea', 
                     box_w_pct=15.0, box_h_pct=7.0, 
                     margin_r_pct=2.0, margin_b_pct=2.0,
                     feather=10):
    if not os.path.exists(input_path):
        print(f"❌ 입력 파일이 존재하지 않습니다: {input_path}")
        return False

    if output_path is None:
        base, ext = os.path.splitext(input_path)
        output_path = f"{base}_delogo{ext}"

    cap = cv2.VideoCapture(input_path)
    if not cap.isOpened():
        print(f"❌ 비디오를 열 수 없습니다: {input_path}")
        return False

    width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    fps = cap.get(cv2.CAP_PROP_FPS) or 30.0
    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))

    print(f"🎬 비디오 정보: {width}x{height} @ {fps:.2f}fps (총 {total_frames} 프레임)")
    print(f"⚙️ 제거 모드: {mode.upper()}")

    # 워터마크 바운딩 박스 계산 (오른쪽 하단 기본)
    bw = int(width * (box_w_pct / 100.0))
    bh = int(height * (box_h_pct / 100.0))
    mr = int(width * (margin_r_pct / 100.0))
    mb = int(height * (margin_b_pct / 100.0))

    bx = width - bw - mr
    by = height - bh - mb

    print(f"📍 워터마크 영역: X={bx}, Y={by}, W={bw}, H={bh} (우측 마진={mr}px, 하단 마진={mb}px)")

    # 인페인팅 마스크 생성
    mask = np.zeros((height, width), dtype=np.uint8)
    mask[by:by+bh, bx:bx+bw] = 255

    # 페더링 마스크 (부드러운 블렌딩용)
    if feather > 0:
        mask = cv2.dilate(mask, cv2.getStructuringElement(cv2.MORPH_RECT, (feather, feather)))

    # 비디오 라이터 준비 (mp4v 또는 avc1)
    fourcc = cv2.VideoWriter_fourcc(*'mp4v')
    out = cv2.VideoWriter(output_path, fourcc, fps, (width, height))

    frame_idx = 0
    while True:
        ret, frame = cap.read()
        if not ret:
            break

        processed = frame.copy()

        if mode == 'telea':
            # Fast Marching Method 기반 인페인팅
            sub_frame = frame[max(0, by-feather):min(height, by+bh+feather), max(0, bx-feather):min(width, bx+bw+feather)]
            sub_mask = mask[max(0, by-feather):min(height, by+bh+feather), max(0, bx-feather):min(width, bx+bw+feather)]
            inpainted_sub = cv2.inpaint(sub_frame, sub_mask, 5, cv2.INPAINT_TELEA)
            processed[max(0, by-feather):min(height, by+bh+feather), max(0, bx-feather):min(width, bx+bw+feather)] = inpainted_sub

        elif mode == 'ns':
            # Navier-Stokes 기반 유체역학 인페인팅
            sub_frame = frame[max(0, by-feather):min(height, by+bh+feather), max(0, bx-feather):min(width, bx+bw+feather)]
            sub_mask = mask[max(0, by-feather):min(height, by+bh+feather), max(0, bx-feather):min(width, bx+bw+feather)]
            inpainted_sub = cv2.inpaint(sub_frame, sub_mask, 5, cv2.INPAINT_NS)
            processed[max(0, by-feather):min(height, by+bh+feather), max(0, bx-feather):min(width, bx+bw+feather)] = inpainted_sub

        elif mode == 'patch':
            # 위쪽 깨끗한 영역 텍스처 복제 + 그라데이션 블렌드
            sample_y = max(0, by - bh)
            patch = frame[sample_y:sample_y+bh, bx:bx+bw]
            if patch.shape == (bh, bw, 3):
                # 가우시안 소프트 블렌딩
                alpha = np.linspace(0, 1, bh)[:, None, None]
                processed[by:by+bh, bx:bx+bw] = (patch * (1 - alpha*0.15) + processed[by:by+bh, bx:bx+bw] * (alpha*0.15)).astype(np.uint8)

        elif mode == 'blur':
            # 가우시안 블러
            roi = processed[by:by+bh, bx:bx+bw]
            ksize = (max(3, feather * 2 + 1), max(3, feather * 2 + 1))
            blurred = cv2.GaussianBlur(roi, ksize, 0)
            processed[by:by+bh, bx:bx+bw] = blurred

        out.write(processed)
        frame_idx += 1
        if frame_idx % 30 == 0 or frame_idx == total_frames:
            pct = (frame_idx / total_frames) * 100 if total_frames > 0 else 0
            print(f"⏳ 진행 중: {frame_idx}/{total_frames} ({pct:.1f}%)")

    cap.release()
    out.release()
    print(f"✅ 워터마크 제거 완료: {output_path}")
    return True

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description="AI 비디오 워터마크 제거 도구")
    parser.add_argument("input", help="입력 비디오 경로 (.mp4)")
    parser.add_argument("output", nargs="?", default=None, help="출력 비디오 경로")
    parser.add_argument("--mode", choices=['telea', 'ns', 'blur', 'patch'], default='telea', help="제거 알고리즘")
    parser.add_argument("--w", type=float, default=15.0, help="워터마크 너비 비율 (%%)")
    parser.add_argument("--h", type=float, default=7.0, help="워터마크 높이 비율 (%%)")
    parser.add_argument("--mr", type=float, default=2.0, help="우측 마진 비율 (%%)")
    parser.add_argument("--mb", type=float, default=2.0, help="하단 마진 비율 (%%)")
    parser.add_argument("--feather", type=int, default=10, help="페더링 반경 (px)")

    args = parser.parse_args()
    remove_watermark(args.input, args.output, args.mode, args.w, args.h, args.mr, args.mb, args.feather)
