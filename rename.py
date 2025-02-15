import os
import shutil
import re

# 要处理的文件夹
folders = ['heart', 'wait', 'future', 'valentine']

# 获取当前脚本所在目录
current_dir = os.path.dirname(os.path.abspath(__file__))
photos_dir = os.path.join(current_dir, 'photos')

def natural_sort_key(s):
    # 提取数字部分进行自然排序
    return [int(text) if text.isdigit() else text.lower()
            for text in re.split('([0-9]+)', s)]

print(f'当前工作目录: {current_dir}')
print(f'照片目录: {photos_dir}')

# 确保基础目录存在
if not os.path.exists(photos_dir):
    os.makedirs(photos_dir)
    print(f'创建照片主目录: {photos_dir}')

# 处理每个文件夹
for folder in folders:
    folder_path = os.path.join(photos_dir, folder)
    
    # 确保文件夹存在
    if not os.path.exists(folder_path):
        os.makedirs(folder_path)
        print(f'创建文件夹: {folder_path}')
        continue
    
    print(f'\n处理 {folder} 文件夹:')
    
    # 获取所有图片文件
    files = []
    for file in os.listdir(folder_path):
        if file.lower().endswith(('.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp')):
            # 尝试从文件名中提取数字
            match = re.search(r'(\d+)', file)
            if match:
                number = int(match.group(1))
                files.append((number, file))
            else:
                files.append((float('inf'), file))  # 没有数字的文件放到最后
    
    # 按数字排序
    files.sort()
    files = [f[1] for f in files]  # 只保留文件名
    
    print(f'找到 {len(files)} 个图片文件')
    
    # 先创建临时文件夹
    temp_folder = os.path.join(folder_path, 'temp')
    if not os.path.exists(temp_folder):
        os.makedirs(temp_folder)
    
    # 先将文件复制到临时文件夹并重命名
    for index, old_name in enumerate(files, 1):  # 从1开始编号
        old_path = os.path.join(folder_path, old_name)
        new_name = f'{index}.jpg'
        temp_path = os.path.join(temp_folder, new_name)
        
        try:
            shutil.copy2(old_path, temp_path)
            print(f'复制到临时文件夹: {old_name} -> {new_name}')
        except Exception as e:
            print(f'复制失败 {old_name}: {str(e)}')
    
    # 删除原文件
    for file in files:
        try:
            os.remove(os.path.join(folder_path, file))
        except Exception as e:
            print(f'删除失败 {file}: {str(e)}')
    
    # 将临时文件夹中的文件移回原文件夹
    temp_files = sorted(os.listdir(temp_folder), key=natural_sort_key)
    for file in temp_files:
        try:
            shutil.move(
                os.path.join(temp_folder, file),
                os.path.join(folder_path, file)
            )
            print(f'移动到目标文件夹: {file}')
        except Exception as e:
            print(f'移动失败 {file}: {str(e)}')
    
    # 删除临时文件夹
    try:
        os.rmdir(temp_folder)
    except Exception as e:
        print(f'删除临时文件夹失败: {str(e)}')
    
    print(f'{folder} 文件夹处理完成，共处理 {len(files)} 个文件')

print('\n所有文件夹处理完成！') 