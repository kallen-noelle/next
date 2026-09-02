import os
from pathlib import Path

# 图片目录
img_dir = Path("动物")

# 获取所有图片文件（按名称排序）
image_extensions = {'.jpg', '.jpeg', '.png', '.gif', '.webp'}
images = sorted([f for f in img_dir.iterdir() 
                 if f.is_file() and f.suffix.lower() in image_extensions])

print(f"找到 {len(images)} 张图片")

# 先重命名为临时名称，避免冲突
temp_names = []
for i, img in enumerate(images):
    temp_name = img_dir / f"temp_{i}{img.suffix}"
    img.rename(temp_name)
    temp_names.append(temp_name)
    print(f"临时重命名: {img.name} -> {temp_name.name}")

# 获取统一扩展名（使用第一个图片的扩展名）
first_ext = temp_names[0].suffix

# 重命名为 1 到 n
for i, temp_name in enumerate(temp_names, 1):
    new_name = img_dir / f"{i}{first_ext}"
    temp_name.rename(new_name)
    print(f"重命名: {temp_name.name} -> {new_name.name}")

print(f"\n完成！共重命名 {len(images)} 张图片")