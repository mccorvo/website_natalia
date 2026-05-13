from __future__ import annotations

from collections import deque
from pathlib import Path

import numpy as np
from PIL import Image, ImageFilter


ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "assets" / "images" / "natalia-hero.jpg"
TARGET = ROOT / "assets" / "images" / "natalia-hero-cutout.png"


def main() -> None:
    image = Image.open(SOURCE).convert("RGB")
    rgb = np.array(image).astype(np.int32)
    height, width = rgb.shape[:2]

    edge = np.concatenate(
        [
            rgb[:28].reshape(-1, 3),
            rgb[-28:].reshape(-1, 3),
            rgb[:, :28].reshape(-1, 3),
            rgb[:, -28:].reshape(-1, 3),
        ]
    )
    edge_luma = edge.mean(axis=1)
    edge_sat = edge.max(axis=1) - edge.min(axis=1)
    edge = edge[(edge_luma > 95) & (edge_sat < 125)]
    palette = np.array(
        [np.percentile(edge, q, axis=0) for q in [3, 8, 15, 25, 40, 55, 70, 85, 95, 98]],
        dtype=np.int32,
    )

    flat = rgb.reshape(-1, 3)
    distances = np.sqrt(((flat[:, None, :] - palette[None, :, :]).astype(np.float32) ** 2).sum(axis=2))
    distances = distances.min(axis=1).reshape(height, width)
    brightness = rgb.mean(axis=2)
    saturation = rgb.max(axis=2) - rgb.min(axis=2)
    y_grid, x_grid = np.ogrid[:height, :width]

    green_background = (
        (rgb[:, :, 1] > rgb[:, :, 0] - 18)
        & (rgb[:, :, 1] > rgb[:, :, 2] - 8)
        & (brightness > 85)
        & (saturation < 135)
    )
    edge_background = ((x_grid < width * 0.16) | (x_grid > width * 0.84)) & (brightness > 80) & (saturation < 150)
    can_be_background = (distances < 68) | ((brightness > 172) & (saturation < 82)) | green_background | edge_background

    center_zone = ((x_grid - width * 0.5) / (width * 0.43)) ** 2 + ((y_grid - height * 0.51) / (height * 0.57)) ** 2 < 1
    skin_like = (
        (rgb[:, :, 0] > 118)
        & (rgb[:, :, 1] > 75)
        & (rgb[:, :, 2] > 55)
        & (rgb[:, :, 0] > rgb[:, :, 1] + 8)
        & (rgb[:, :, 0] > rgb[:, :, 2] + 22)
    )
    dark_subject = brightness < 135
    warm_hair = (
        (rgb[:, :, 0] > 90)
        & (rgb[:, :, 1] > 50)
        & (rgb[:, :, 2] < 90)
        & (rgb[:, :, 0] > rgb[:, :, 2] + 24)
    )
    protect_subject = center_zone & (skin_like | dark_subject | warm_hair)
    can_be_background[protect_subject] = False

    visited = np.zeros((height, width), dtype=bool)
    queue: deque[tuple[int, int]] = deque()
    for x in range(width):
        for y in (0, height - 1):
            if can_be_background[y, x]:
                visited[y, x] = True
                queue.append((y, x))
    for y in range(height):
        for x in (0, width - 1):
            if can_be_background[y, x] and not visited[y, x]:
                visited[y, x] = True
                queue.append((y, x))

    while queue:
        y, x = queue.popleft()
        for next_y, next_x in ((y - 1, x), (y + 1, x), (y, x - 1), (y, x + 1)):
            if 0 <= next_y < height and 0 <= next_x < width and can_be_background[next_y, next_x] and not visited[next_y, next_x]:
                visited[next_y, next_x] = True
                queue.append((next_y, next_x))

    mask = ~visited
    loose_background = ((distances < 78) | ((brightness > 158) & (saturation < 95)) | green_background | edge_background) & ~protect_subject
    green_blobs = (
        (rgb[:, :, 1] >= rgb[:, :, 0] - 40)
        & (rgb[:, :, 1] >= rgb[:, :, 2] - 45)
        & (brightness > 65)
        & (saturation < 175)
        & ~protect_subject
    )
    right_edge_background = (
        (x_grid > width * 0.80)
        & (y_grid < height * 0.62)
        & (brightness > 70)
        & (rgb[:, :, 1] >= rgb[:, :, 0] - 70)
        & (rgb[:, :, 1] >= rgb[:, :, 2] - 70)
        & ~protect_subject
    )
    mask[loose_background | green_blobs | right_edge_background] = False

    mask_image = Image.fromarray(mask.astype("uint8") * 255, "L")
    mask_image = mask_image.filter(ImageFilter.MaxFilter(5)).filter(ImageFilter.MedianFilter(7)).filter(ImageFilter.GaussianBlur(1.5))
    alpha = np.array(mask_image)
    alpha = np.where(alpha < 35, 0, alpha)
    alpha = np.where(alpha > 220, 255, alpha).astype("uint8")
    right_edge_noise = (
        (x_grid > width * 0.82)
        & (y_grid < height * 0.60)
        & (brightness > 70)
        & (rgb[:, :, 1] > rgb[:, :, 0] - 20)
        & (rgb[:, :, 1] > rgb[:, :, 2] - 30)
        & ~skin_like
    )
    alpha[right_edge_noise] = 0

    cutout = image.convert("RGBA")
    cutout.putalpha(Image.fromarray(alpha, "L"))
    cutout = cutout.crop((40, 48, 1042, 1600))
    cutout.save(TARGET)


if __name__ == "__main__":
    main()
