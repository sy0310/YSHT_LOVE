// 照片数组 - 按章节分类
const photosByChapter = {
    heart: Array.from({ length: 100 }, (_, i) => ({
        id: `heart${i + 1}`,
        url: `photos/heart/${i + 1}.jpg`,
        date: '2013-09-01'
    })),
    wait: Array.from({ length: 150 }, (_, i) => ({
        id: `wait${i + 1}`,
        url: `photos/wait/${i + 1}.jpg`,
        date: '2016-08-15'
    })),
    future: Array.from({ length: 100 }, (_, i) => ({
        id: `future${i + 1}`,
        url: `photos/future/${i + 1}.jpg`,
        date: '2025-02-14'
    })),
    valentine: [] // 初始化为空数组
};

// 修改情人节特辑数据结构
const valentinePhotos = {
    '2025': [],
    '2026': [],
    '2027': []
};

// 修改 GitHub API 配置
const githubConfig = {
    owner: 'sy0310',              // 你的 GitHub 用户名
    repo: 'YSHT_LOVE',           // 你的仓库名
    branch: 'main',               // 分支名
    token: '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'  // 使用新的 token
};

// 修改文件上传函数
async function uploadToGithub(file, chapter) {
    try {
        // 检查文件大小
        const maxSize = 100 * 1024 * 1024;
        if (file.size > maxSize) {
            throw new Error(`文件大小超过限制：${(file.size / 1024 / 1024).toFixed(2)}MB > 100MB`);
        }

        // 获取当前章节的照片数量，用于生成新的文件名
        let nextPhotoNumber = photosByChapter[chapter].length + 1;

        // 创建新的文件名：序号.jpg
        const newFileName = `${nextPhotoNumber}.jpg`;
        // 对于情人节特辑，直接存储在 photos/valentine/ 目录下
        const path = `photos/${chapter}/${newFileName}`;
        
        console.log('准备上传文件:', {
            originalName: file.name,
            newName: newFileName,
            path: path,
            size: `${(file.size / 1024 / 1024).toFixed(2)}MB`,
            type: file.type
        });

        // 使用配置中的 token
        const token = githubConfig.token;
        if (!token) {
            throw new Error('GitHub token not found');
        }

        // 构建 API URL
        const apiUrl = `https://api.github.com/repos/${githubConfig.owner}/${githubConfig.repo}/contents/${path}`;

        console.log('开始上传到 GitHub...');

        // 将文件转换为 base64
        const base64Content = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result.split(',')[1]);
            reader.onerror = (e) => reject(new Error('文件读取失败'));
            reader.readAsDataURL(file);
        });

        // 发送请求
        const response = await fetch(apiUrl, {
            method: 'PUT',
            headers: {
                'Authorization': `token ${token}`,  // 使用 token 认证
                'Content-Type': 'application/json',
                'Accept': 'application/vnd.github.v3+json'
            },
            body: JSON.stringify({
                message: `Upload ${newFileName} to ${chapter}`,
                content: base64Content,
                branch: githubConfig.branch
            })
        });

        // 添加更详细的错误处理
        if (!response.ok) {
            const errorData = await response.json();
            console.error('GitHub API 错误:', {
                status: response.status,
                statusText: response.statusText,
                error: errorData
            });
            
            if (response.status === 401) {
                throw new Error('GitHub Token 无效或已过期，请更新 token');
            } else if (response.status === 403) {
                throw new Error('没有权限访问该仓库，请检查 token 权限');
            } else if (response.status === 404) {
                throw new Error('找不到指定的仓库或路径，请检查配置');
            } else {
                throw new Error(errorData.message || `上传失败: HTTP ${response.status}`);
            }
        }

        const responseData = await response.json();

        console.log('文件上传成功:', responseData.content.download_url);

        // 上传成功后，更新照片数组
        photosByChapter.valentine.push({
            id: `valentine${nextPhotoNumber}`,
            url: responseData.content.download_url,
            type: file.type.startsWith('video/') ? 'video' : 'image',
            date: new Date().toISOString()
        });

        return {
            url: responseData.content.download_url,
            number: nextPhotoNumber
        };

    } catch (error) {
        console.error('上传错误详情:', error);
        throw error;
    }
}

// 修改文件上传处理函数
function handleFileUpload(chapter) {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.multiple = true;

    input.onchange = async (e) => {
        const files = Array.from(e.target.files);
        if (files.length === 0) return;

        // 创建进度显示
        const progressDiv = document.createElement('div');
        progressDiv.className = 'upload-progress';
        progressDiv.innerHTML = `
            <div class="upload-status">准备上传文件...</div>
            <div class="progress-bar">
                <div class="progress-fill"></div>
            </div>
        `;
        document.body.appendChild(progressDiv);
        progressDiv.style.display = 'block';
        
        const progressBar = progressDiv.querySelector('.progress-fill');
        const statusText = progressDiv.querySelector('.upload-status');

        try {
            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                
                // 更新进度
                const progress = ((i + 1) / files.length) * 100;
                progressBar.style.width = `${progress}%`;
                statusText.textContent = `正在上传第 ${i + 1}/${files.length} 个文件...`;

                // 上传到 GitHub
                const uploadResult = await uploadToGithub(file, chapter);
                
                // 添加到照片数组
                if (chapter === 'valentine') {
                    // 情人节特辑的照片已经在 uploadToGithub 中添加到 valentinePhotos
                    photosByChapter.valentine = Object.values(valentinePhotos)
                        .flat()
                        .sort((a, b) => new Date(b.date) - new Date(a.date));
                } else {
                    photosByChapter[chapter].push({
                        id: `${chapter}${uploadResult.number}`,
                        url: uploadResult.url,
                        date: new Date().toISOString()
                    });
                }
            }

            // 完成上传
            statusText.textContent = '上传完成！';
            progressBar.style.width = '100%';
            
            // 完成上传后的刷新显示
            if (chapter === 'valentine') {
                filterValentineMedia('all');
            } else {
                initSlideshow();
            }
            
            setTimeout(() => {
                progressDiv.remove();
            }, 2000);

        } catch (error) {
            console.error('上传失败:', error);
            statusText.textContent = error.message;
            progressBar.style.backgroundColor = '#ff4444';
            setTimeout(() => progressDiv.remove(), 5000);
        }
    };

    input.click();
}

// 初始化照片数组
async function initPhotoArrays() {
    // 清空现有数组
    for (let chapter in photosByChapter) {
        photosByChapter[chapter] = [];
    }
    
    // 遍历每个章节
    for (let chapter in photosByChapter) {
        // 从1开始，一直尝试到找不到图片为止
        let index = 1;
        const maxPhotos = chapter === 'wait' ? 150 : 100;
        
        while (index <= maxPhotos) {
            const url = `photos/${chapter}/${index}.jpg`;
            
            try {
                // 等待检查文件是否存在
                const response = await fetch(url, { method: 'HEAD' });
                if (response.ok) {
                    // 如果图片存在，添加到数组
                    photosByChapter[chapter].push({
                        id: `${chapter}${index}`,
                        url: url,
                        date: chapter === 'heart' ? '2013-09-01' :
                              chapter === 'wait' ? '2016-08-15' :
                              '2025-02-14'
                    });
                }
                
                index++;
            } catch (error) {
                console.log(`${chapter} 章节检测到 ${index-1} 张照片`);
                break;
            }
        }
        console.log(`${chapter} 章节共加载 ${photosByChapter[chapter].length} 张照片`);
    }
}

let currentChapter = 'heart';

// 评论存储
let comments = JSON.parse(localStorage.getItem('comments') || '{}');

// 将 currentSlide 移到函数外部，设为全局变量
let currentSlide = 0;

// 将 updateSlide 函数移到全局作用域
let updateSlide; // 声明为全局变量

// 显示评论
function displayComments(photoId) {
    const commentsContainer = document.querySelector('.comments-container');
    commentsContainer.innerHTML = '';
    
    if (comments[photoId]) {
        comments[photoId].forEach(comment => {
            commentsContainer.innerHTML += `
                <div class="comment" data-id="${comment.id}">
                    <div class="comment-content">
                        <div class="content">${comment.content}</div>
                        <div class="date">${comment.date}</div>
                    </div>
                    <div class="comment-actions">
                        <button class="like-btn" data-likes="${comment.likes}" onclick="toggleLike('${photoId}', ${comment.id})">
                            <span class="like-icon">❤</span>
                            <span class="like-count">${comment.likes > 0 ? comment.likes : ''}</span>
                        </button>
                        <button class="delete-btn" onclick="deleteComment('${photoId}', ${comment.id})">
                            <span class="delete-icon">🗑️</span>
                        </button>
                    </div>
                </div>
            `;
        });
    }
}

// 修改评论添加函数
function addComment(photoId, content) {
    if (!comments[photoId]) {
        comments[photoId] = [];
    }
    
    comments[photoId].push({
        id: Date.now(),
        content: content,
        date: new Date().toLocaleString('zh-CN'),
        likes: 0 // 只保留点赞数
    });
    
    localStorage.setItem('comments', JSON.stringify(comments));
    displayComments(photoId);
}

// 简化点赞功能
function toggleLike(photoId, commentId) {
    const commentIndex = comments[photoId].findIndex(c => c.id === commentId);
    if (commentIndex !== -1) {
        comments[photoId][commentIndex].likes += 1;
        localStorage.setItem('comments', JSON.stringify(comments));
        displayComments(photoId);
    }
}

// 添加删除功能
function deleteComment(photoId, commentId) {
    if (confirm('确定要删除这条评论吗？')) {
        comments[photoId] = comments[photoId].filter(c => c.id !== commentId);
        localStorage.setItem('comments', JSON.stringify(comments));
        displayComments(photoId);
    }
}

// 切换章节
function switchChapter(chapter) {
    // 移除所有章节的 active 类
    document.querySelectorAll('.story-chapters .chapter').forEach(ch => {
        ch.classList.remove('active');
    });
    
    // 为当前章节添加 active 类
    document.querySelector(`.story-chapters .chapter[data-chapter="${chapter}"]`).classList.add('active');
    
    currentChapter = chapter;
    
    // 显示幻灯片容器，因为情人节特辑不会使用这个函数
    document.querySelector('.slideshow-container').style.display = 'block';
    initSlideshow();
}

// 修改缩略图网格创建函数
function createThumbnailGrid(photos) {
    const gridContainer = document.createElement('div');
    gridContainer.className = 'thumbnail-grid';
    
    // 从第二张开始显示所有照片的缩略图
    photos.slice(1).forEach((photo, index) => {
        const thumbnail = document.createElement('div');
        thumbnail.className = 'grid-thumbnail';
        
        const img = createImage(photo);
        
        // 添加编号
        const number = document.createElement('div');
        number.className = 'thumbnail-number';
        number.textContent = index + 1;
        
        // 添加点击事件，跳转到对应的照片
        thumbnail.addEventListener('click', () => {
            updateSlide(index + 1);
        });
        
        thumbnail.appendChild(img);
        thumbnail.appendChild(number);
        gridContainer.appendChild(thumbnail);
    });
    
    return gridContainer;
}

// 修改图片创建函数
function createImage(photo) {
    const img = document.createElement('img');
    img.alt = '照片';
    img.src = photo.url;
    
    img.onerror = function() {
        // 图片加载失败时直接移除父元素（缩略图）
        if (this.parentElement && this.parentElement.className === 'grid-thumbnail') {
            this.parentElement.remove();
        }
    };
    
    return img;
}

// 创建校园风格背景
function createHeartChapterBg() {
    const container = document.createElement('div');
    container.className = 'heart-chapter-bg';
    
    // 创建樱花
    for (let i = 0; i < 10; i++) {
        const sakura = document.createElement('div');
        sakura.className = 'sakura';
        
        // 随机大小和延迟
        const size = Math.random() * 15 + 10;
        const delay = Math.random() * 10;
        const startX = Math.random() * 100;
        
        sakura.style.cssText = `
            width: ${size}px;
            height: ${size}px;
            left: ${startX}%;
            animation-delay: -${delay}s;
        `;
        
        container.appendChild(sakura);
    }
    
    // 创建纸飞机
    for (let i = 0; i < 3; i++) {
        const plane = document.createElement('div');
        plane.className = 'paper-plane';
        
        const delay = Math.random() * 10;
        const size = Math.random() * 10 + 15;
        
        plane.style.cssText = `
            width: ${size}px;
            height: ${size}px;
            animation-delay: -${delay}s;
        `;
        
        container.appendChild(plane);
    }
    
    return container;
}

// 创建等待章节背景
function createWaitChapterBg() {
    const container = document.createElement('div');
    container.className = 'wait-chapter-bg';
    
    // 创建沙漏
    const hourglass = document.createElement('div');
    hourglass.className = 'hourglass';
    container.appendChild(hourglass);
    
    // 创建时钟
    const clock = document.createElement('div');
    clock.className = 'clock';
    
    // 添加时钟指针
    const hourHand = document.createElement('div');
    hourHand.className = 'hour-hand';
    clock.appendChild(hourHand);
    
    const minuteHand = document.createElement('div');
    minuteHand.className = 'minute-hand';
    clock.appendChild(minuteHand);
    
    container.appendChild(clock);
    
    // 创建飘落的树叶
    for (let i = 0; i < 15; i++) {
        const leaf = document.createElement('div');
        leaf.className = 'falling-leaf';
        
        const size = Math.random() * 20 + 15;
        const delay = Math.random() * 10;
        const startX = Math.random() * 100;
        
        leaf.style.cssText = `
            width: ${size}px;
            height: ${size}px;
            left: ${startX}%;
            animation-delay: -${delay}s;
        `;
        
        container.appendChild(leaf);
    }
    
    return container;
}

// 创建未来章节背景
function createFutureChapterBg() {
    const container = document.createElement('div');
    container.className = 'future-chapter-bg';
    
    // 创建上升的气泡
    for (let i = 0; i < 15; i++) {
        const bubble = document.createElement('div');
        bubble.className = 'rising-bubble';
        
        const size = Math.random() * 30 + 20;
        const delay = Math.random() * 8;
        const startX = Math.random() * 100;
        
        bubble.style.cssText = `
            width: ${size}px;
            height: ${size}px;
            left: ${startX}%;
            animation-delay: -${delay}s;
        `;
        
        container.appendChild(bubble);
    }
    
    // 创建彩虹
    const rainbow = document.createElement('div');
    rainbow.className = 'rainbow';
    container.appendChild(rainbow);
    
    // 创建飞翔的鸟
    for (let i = 0; i < 5; i++) {
        const bird = document.createElement('div');
        bird.className = 'flying-bird';
        
        const delay = Math.random() * 5;
        const top = Math.random() * 60 + 10;
        
        bird.style.cssText = `
            top: ${top}%;
            animation-delay: -${delay}s;
        `;
        
        container.appendChild(bird);
    }
    
    return container;
}

// 修改情人节特辑网格创建函数
function createValentineGrid(photos) {
    const gridContainer = document.createElement('div');
    gridContainer.className = 'valentine-grid';
    
    if (photos.length === 0) {
        const emptyMessage = document.createElement('div');
        emptyMessage.className = 'empty-message';
        emptyMessage.innerHTML = `
            <div class="upload-hint">
                <div class="icon">📸</div>
                <div class="text">还没有照片或视频</div>
                <div class="sub-text">点击上方的上传按钮添加</div>
            </div>
        `;
        gridContainer.appendChild(emptyMessage);
        return gridContainer;
    }
    
    photos.forEach((item, index) => {
        const gridItem = document.createElement('div');
        gridItem.className = 'valentine-item';
        
        if (item.type === 'video') {
            const video = createVideo(item);
            gridItem.appendChild(video);
            gridItem.classList.add('video-item');
        } else {
            const img = createImage(item);
            gridItem.appendChild(img);
            gridItem.classList.add('image-item');
        }
        
        gridItem.addEventListener('click', () => {
            openLightbox(item, index);
        });
        
        gridContainer.appendChild(gridItem);
    });
    
    return gridContainer;
}

// 创建灯箱效果
function openLightbox(item, index) {
    const lightbox = document.createElement('div');
    lightbox.className = 'lightbox';
    
    const content = item.type === 'video' ? createVideo(item) : createImage(item);
    content.className = 'lightbox-content';
    
    // 添加关闭按钮
    const closeBtn = document.createElement('button');
    closeBtn.className = 'lightbox-close';
    closeBtn.innerHTML = '×';
    closeBtn.onclick = () => lightbox.remove();
    
    lightbox.appendChild(content);
    lightbox.appendChild(closeBtn);
    document.body.appendChild(lightbox);
    
    // 点击背景关闭
    lightbox.addEventListener('click', (e) => {
        if (e.target === lightbox) {
            lightbox.remove();
        }
    });
}

// 修改初始化幻灯片函数
function initSlideshow() {
    const slidesWrapper = document.querySelector('.slides-wrapper');
    const prevButton = document.getElementById('prevSlide');
    const nextButton = document.getElementById('nextSlide');
    
    // 获取当前章节的照片
    const photos = photosByChapter[currentChapter];
    
    // 清空现有内容
    slidesWrapper.innerHTML = '';
    
    if (!photos || photos.length === 0) {
        slidesWrapper.innerHTML = '<div class="error">还没有照片</div>';
        return;
    }

    // 显示导航按钮和返回按钮（情人节特辑不会进入这个函数）
    prevButton.style.display = 'block';
    nextButton.style.display = 'block';
    document.getElementById('backToGrid').style.display = 'block';
    
    // 添加照片
    photos.forEach((photo, index) => {
        const slide = document.createElement('div');
        slide.className = 'slide';
        slide.style.position = 'absolute';
        slide.style.left = `${index * 100}%`;
        
        if (index === 0) {
            slide.appendChild(createThumbnailGrid(photos));
        } else {
            const img = createImage(photo);
            slide.appendChild(img);
        }
        
        slidesWrapper.appendChild(slide);
    });

    // 更新 updateSlide 函数
    updateSlide = function(newIndex) {
        currentSlide = newIndex;
        slidesWrapper.style.transform = `translateX(-${currentSlide * 100}%)`;
        displayComments(photos[currentSlide].id);
    };

    // 初始化显示
    updateSlide(0);
}

// 创建背景动画元素
function createBackgroundElements() {
    const container = document.createElement('div');
    container.className = 'animated-bg';
    document.body.appendChild(container);
    
    // 创建气泡
    for (let i = 0; i < 15; i++) {
        const bubble = document.createElement('div');
        bubble.className = 'bubble';
        const size = Math.random() * 60 + 20;
        const startDelay = Math.random() * 20;
        
        bubble.style.cssText = `
            width: ${size}px;
            height: ${size}px;
            left: ${Math.random() * 100}vw;
            top: ${Math.random() * 100}vh;
            animation-delay: -${startDelay}s;
        `;
        
        container.appendChild(bubble);
    }
    
    // 创建星星
    for (let i = 0; i < 30; i++) {
        const star = document.createElement('div');
        star.className = 'star';
        star.style.cssText = `
            left: ${Math.random() * 100}vw;
            top: ${Math.random() * 100}vh;
            animation-delay: ${Math.random() * 1}s;
        `;
        container.appendChild(star);
    }
    
    // 创建扩散圆圈
    function createCircle() {
        const circle = document.createElement('div');
        circle.className = 'circle';
        const size = Math.random() * 100 + 50;
        circle.style.cssText = `
            width: ${size}px;
            height: ${size}px;
            left: ${Math.random() * 100}vw;
            top: ${Math.random() * 100}vh;
        `;
        
        container.appendChild(circle);
        circle.addEventListener('animationend', () => {
            circle.remove();
            createCircle();
        });
    }
    
    for (let i = 0; i < 5; i++) {
        createCircle();
    }
}

// 修改音乐播放器初始化
function initMusicPlayer() {
    const music = document.getElementById('bgMusic');
    const toggleButton = document.getElementById('musicToggle');
    const musicSelect = document.getElementById('musicSelect');
    
    // 监听歌曲播放结束
    music.addEventListener('ended', function() {
        const options = musicSelect.options;
        const currentIndex = musicSelect.selectedIndex;
        const nextIndex = (currentIndex + 1) % options.length;
        
        // 直接更新音源并播放
        musicSelect.selectedIndex = nextIndex;
        music.src = `music/${musicSelect.value}`;
        music.play().then(() => {
            console.log('自动播放下一首:', musicSelect.options[nextIndex].text);
        }).catch(error => {
            console.error('自动播放失败:', error);
        });
    });

    // 切换歌曲
    musicSelect.addEventListener('change', async () => {
        let wasPlaying = !music.paused;
        
        // 暂停当前播放
        if (!music.paused) {
            await pauseMusic();
        }
        
        // 更新音源
        music.querySelector('source').src = `music/${musicSelect.value}`;
        music.load();
        
        // 等待加载完成
        music.addEventListener('loadeddata', function onLoad() {
            if (wasPlaying) {
                playMusic();
            }
            music.removeEventListener('loadeddata', onLoad);
        });
    });

    // 播放函数
    async function playMusic() {
        try {
            await music.play();
            toggleButton.classList.add('playing');
            console.log('播放成功:', musicSelect.options[musicSelect.selectedIndex].text);
        } catch (error) {
            console.error('播放失败:', error);
            toggleButton.classList.remove('playing');
        }
    }

    // 暂停函数
    function pauseMusic() {
        music.pause();
        toggleButton.classList.remove('playing');
        console.log('暂停播放');
    }

    // 点击按钮控制播放/暂停
    toggleButton.addEventListener('click', (e) => {
        e.stopPropagation();
        if (music.paused) {
            playMusic();
        } else {
            pauseMusic();
        }
    });

    // 设置音量
    music.volume = 0.5;

    // 错误处理
    music.addEventListener('error', (e) => {
        console.error('音频加载错误:', {
            error: music.error,
            networkState: music.networkState,
            readyState: music.readyState,
            currentSrc: music.currentSrc
        });
    });
}

// 创建漂浮的爱心
function createFloatingHearts() {
    const container = document.querySelector('.floating-hearts');
    const heartCount = 20;
    
    for (let i = 0; i < heartCount; i++) {
        const heart = document.createElement('div');
        heart.className = 'heart';
        
        const size = Math.random() * 15 + 10;
        const startPosition = Math.random() * 100;
        const delay = Math.random() * 15;
        const duration = Math.random() * 15 + 10;
        
        heart.style.cssText = `
            left: ${startPosition}vw;
            width: ${size}px;
            height: ${size}px;
            animation-delay: ${delay}s;
            animation-duration: ${duration}s;
        `;
        
        heart.addEventListener('animationend', () => {
            heart.remove();
            createHeart();
        });
        
        container.appendChild(heart);
    }
}

// 创建单个爱心
function createHeart() {
    const container = document.querySelector('.floating-hearts');
    const heart = document.createElement('div');
    heart.className = 'heart';
    
    const size = Math.random() * 15 + 10;
    const startPosition = Math.random() * 100;
    const duration = Math.random() * 15 + 10;
    
    heart.style.cssText = `
        left: ${startPosition}vw;
        width: ${size}px;
        height: ${size}px;
        animation-duration: ${duration}s;
    `;
    
    heart.addEventListener('animationend', () => {
        heart.remove();
        createHeart();
    });
    
    container.appendChild(heart);
}

// 添加视频创建函数
function createVideo(item) {
    const video = document.createElement('video');
    video.src = item.url;
    video.controls = true;
    video.className = 'slide-video';
    return video;
}

// 添加照片移动功能
function addMovePhotoFeature() {
    // 添加选择模式切换按钮
    const selectModeBtn = document.createElement('button');
    selectModeBtn.className = 'select-mode-btn';
    selectModeBtn.innerHTML = '选择照片';
    document.querySelector('.slideshow-container').appendChild(selectModeBtn);

    let isSelectMode = false;
    let selectedPhotos = new Set();

    // 添加移动面板
    const movePanel = document.createElement('div');
    movePanel.className = 'move-panel';
    movePanel.innerHTML = `
        <div class="move-panel-content">
            <div class="selected-count">已选择: <span>0</span> 张照片</div>
            <div class="chapter-select">
                <label>移动到:</label>
                <select>
                    <option value="heart">三年心动</option>
                    <option value="wait">九年沉淀</option>
                    <option value="future">未来</option>
                    <option value="valentine">情人节特辑</option>
                </select>
            </div>
            <div class="move-actions">
                <button class="move-confirm">确认移动</button>
                <button class="move-cancel">取消</button>
            </div>
        </div>
    `;
    document.body.appendChild(movePanel);

    // 切换选择模式
    selectModeBtn.addEventListener('click', () => {
        isSelectMode = !isSelectMode;
        selectModeBtn.classList.toggle('active', isSelectMode);
        document.querySelector('.thumbnail-grid').classList.toggle('select-mode', isSelectMode);
        
        if (isSelectMode) {
            movePanel.style.display = 'block';
            selectModeBtn.innerHTML = '取消选择';
        } else {
            movePanel.style.display = 'none';
            selectModeBtn.innerHTML = '选择照片';
            selectedPhotos.clear();
            updateSelectedCount();
            clearPhotoSelection();
        }
    });

    // 更新选中数量显示
    function updateSelectedCount() {
        movePanel.querySelector('.selected-count span').textContent = selectedPhotos.size;
    }

    // 清除照片选择状态
    function clearPhotoSelection() {
        document.querySelectorAll('.grid-thumbnail').forEach(thumb => {
            thumb.classList.remove('selected');
        });
    }

    // 添加照片选择功能
    function addPhotoSelection() {
        document.querySelectorAll('.grid-thumbnail').forEach(thumb => {
            thumb.addEventListener('click', (e) => {
                if (!isSelectMode) return;
                e.stopPropagation(); // 阻止原有的点击事件

                const photoIndex = parseInt(thumb.querySelector('.thumbnail-number').textContent);
                const photoId = photosByChapter[currentChapter][photoIndex].id;

                if (thumb.classList.toggle('selected')) {
                    selectedPhotos.add(photoId);
                } else {
                    selectedPhotos.delete(photoId);
                }
                updateSelectedCount();
            });
        });
    }

    // 处理照片移动
    movePanel.querySelector('.move-confirm').addEventListener('click', async () => {
        if (selectedPhotos.size === 0) {
            alert('请先选择要移动的照片');
            return;
        }

        const targetChapter = movePanel.querySelector('select').value;
        if (targetChapter === currentChapter) {
            alert('不能移动到当前章节');
            return;
        }

        try {
            // 移动选中的照片
            for (const photoId of selectedPhotos) {
                const photo = photosByChapter[currentChapter].find(p => p.id === photoId);
                if (photo) {
                    // 构建新的文件名
                    const oldPath = photo.url.split('/').pop();
                    const newPath = `photos/${targetChapter}/${oldPath}`;
                    
                    // 移动文件
                    await moveGitHubFile(photo.url, newPath);
                    
                    // 更新数据结构
                    photosByChapter[currentChapter] = photosByChapter[currentChapter].filter(p => p.id !== photoId);
                    photosByChapter[targetChapter].push({
                        ...photo,
                        url: newPath
                    });
                }
            }

            // 重新初始化显示
            selectedPhotos.clear();
            updateSelectedCount();
            isSelectMode = false;
            selectModeBtn.classList.remove('active');
            movePanel.style.display = 'none';
            initSlideshow();
            
            alert('照片移动成功！');
        } catch (error) {
            console.error('移动照片失败:', error);
            alert('移动照片失败，请重试');
        }
    });

    // 取消移动
    movePanel.querySelector('.move-cancel').addEventListener('click', () => {
        isSelectMode = false;
        selectModeBtn.classList.remove('active');
        movePanel.style.display = 'none';
        selectedPhotos.clear();
        updateSelectedCount();
        clearPhotoSelection();
    });

    // 初始化照片选择功能
    addPhotoSelection();
}

// 情人节特辑处理函数
function handleValentineSection() {
    // 隐藏主幻灯片容器
    document.querySelector('.slideshow-container').style.display = 'none';
    
    // 更新媒体网格
    filterValentineMedia('all');
}

// 媒体类型过滤功能
function filterValentineMedia(type) {
    const mediaGrid = document.querySelector('.valentine-media-grid');
    const photos = photosByChapter.valentine; // 直接读取 valentine 中的照片
    
    // 更新标签状态
    document.querySelectorAll('.media-tab').forEach(tab => {
        tab.classList.toggle('active', tab.dataset.type === type);
    });
    
    // 清空网格
    mediaGrid.innerHTML = '';
    
    // 过滤并显示媒体
    const filteredPhotos = photos.filter(item => 
        type === 'all' || item.type === type
    );
    
    if (filteredPhotos.length === 0) {
        mediaGrid.innerHTML = `
            <div class="empty-message">
                <div class="upload-hint">
                    <div class="icon">📸</div>
                    <div class="text">还没有${type === 'video' ? '视频' : type === 'image' ? '照片' : '内容'}</div>
                    <div class="sub-text">点击上方的上传按钮添加</div>
                </div>
            </div>
        `;
        return;
    }
    
    filteredPhotos.forEach(item => {
        const mediaItem = document.createElement('div');
        mediaItem.className = `media-item ${item.type || 'image'}`;
        
        if (item.type === 'video') {
            const video = createVideo(item);
            mediaItem.appendChild(video);
        } else {
            const img = createImage(item);
            mediaItem.appendChild(img);
        }
        
        mediaItem.addEventListener('click', () => {
            openLightbox(item);
        });
        
        mediaGrid.appendChild(mediaItem);
    });
}

// 修改页面加载事件
document.addEventListener('DOMContentLoaded', () => {
    // 为主章节添加点击事件
    document.querySelectorAll('.story-chapters .chapter').forEach(chapter => {
        chapter.addEventListener('click', () => {
            switchChapter(chapter.dataset.chapter);
        });
    });
    
    // 为情人节特辑添加单独的点击事件
    document.querySelector('.valentine-section .chapter').addEventListener('click', () => {
        // 移除主章节的 active 状态
        document.querySelectorAll('.story-chapters .chapter').forEach(ch => {
            ch.classList.remove('active');
        });
        handleValentineSection();
    });
    
    initSlideshow();
    initMusicPlayer();
    createFloatingHearts();
    createBackgroundElements();
    
    // 添加评论提交功能
    const commentContent = document.getElementById('commentContent');
    
    document.getElementById('submitComment').addEventListener('click', () => {
        const content = commentContent.value.trim();
        if (content) {
            // 直接使用 currentSlide 变量获取当前照片
            const photos = photosByChapter[currentChapter];
            if (photos && photos.length > 0) {
                const currentPhotoId = photos[currentSlide].id;  // 使用全局的 currentSlide
                addComment(currentPhotoId, content);
                commentContent.value = '';
            }
        }
    });
    
    // 添加回车发送功能
    commentContent.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            document.getElementById('submitComment').click();
        }
    });
    
    // 修改返回缩略图按钮功能
    const backToGridBtn = document.getElementById('backToGrid');
    backToGridBtn.addEventListener('click', () => {
        // 保持在当前章节，只返回到缩略图
        updateSlide(0);
    });
    
    // 修改情人节特辑上传功能
    const valentineUpload = document.getElementById('valentineUpload');
    valentineUpload.addEventListener('change', async (e) => {
        const files = Array.from(e.target.files);
        if (files.length === 0) return;
        
        // 处理上传
        await handleFileUpload('valentine');
        // 刷新情人节特辑显示
        filterValentineMedia('all');
    });
    
    // 初始化照片移动功能
    addMovePhotoFeature();
    
    // 添加媒体类型过滤事件
    document.querySelectorAll('.media-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            filterValentineMedia(tab.dataset.type);
        });
    });
    
    // 初始显示所有媒体
    filterValentineMedia('all');
}); 