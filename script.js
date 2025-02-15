// 照片数组，包含描述
const photos = [
    {
        id: '1',
        driveUrl: 'https://drive.google.com/uc?id=YOUR_FILE_ID_1',
        description: '我们的第一次约会',
        date: '2022-01-01'
    },
    // 添加更多照片
];

// 故事数组
const stories = [
    {
        date: '2022-01-01',
        title: '我们的初遇',
        content: '那天阳光正好...'
    },
    // 添加更多故事
];

// 家人祝福数组
const familyStories = [
    {
        name: '妈妈',
        message: '祝你们幸福美满...'
    },
    // 添加更多祝福
];

// 评论存储
let comments = {};

// 从 Google Drive 获取照片 URL
function getGoogleDriveImageUrl(fileId) {
    return `https://drive.google.com/uc?id=${fileId}`;
}

// 初始化照片轮播
function initSlideshow() {
    const slidesContainer = document.querySelector('.slides');
    const descriptionContainer = document.querySelector('.slide-description');
    
    photos.forEach(photo => {
        const img = document.createElement('img');
        img.src = photo.driveUrl;
        img.alt = photo.description;
        slidesContainer.appendChild(img);
    });
    
    let currentSlide = 0;
    
    function updateSlide() {
        slidesContainer.style.transform = `translateX(-${currentSlide * 100}%)`;
        descriptionContainer.textContent = photos[currentSlide].description;
        displayComments(photos[currentSlide].id);
    }
    
    setInterval(() => {
        currentSlide = (currentSlide + 1) % photos.length;
        updateSlide();
    }, 5000);
    
    updateSlide();
}

// 显示评论
function displayComments(photoId) {
    const commentsContainer = document.querySelector('.comments-container');
    commentsContainer.innerHTML = '';
    
    if (comments[photoId]) {
        comments[photoId].forEach(comment => {
            commentsContainer.innerHTML += `
                <div class="comment">
                    <div class="name">${comment.name}</div>
                    <div class="content">${comment.content}</div>
                    <div class="date">${comment.date}</div>
                </div>
            `;
        });
    }
}

// 添加评论
function addComment(photoId, name, content) {
    if (!comments[photoId]) {
        comments[photoId] = [];
    }
    
    comments[photoId].push({
        name: name,
        content: content,
        date: new Date().toLocaleString('zh-CN')
    });
    
    // 这里可以添加将评论保存到后端的代码
    
    displayComments(photoId);
}

// 初始化背景音乐
function initMusicPlayer() {
    const music = document.getElementById('bgMusic');
    const toggleButton = document.getElementById('musicToggle');
    
    toggleButton.addEventListener('click', () => {
        if (music.paused) {
            music.play();
            toggleButton.textContent = '🔊';
        } else {
            music.pause();
            toggleButton.textContent = '🔇';
        }
    });
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
    initSlideshow();
    initMusicPlayer();
    
    // 添加评论提交功能
    const commentForm = document.querySelector('.comment-form');
    const nameInput = document.getElementById('commentName');
    const contentInput = document.getElementById('commentContent');
    
    document.getElementById('submitComment').addEventListener('click', () => {
        const name = nameInput.value.trim();
        const content = contentInput.value.trim();
        
        if (name && content) {
            const currentPhotoId = photos[Math.floor(Math.abs(parseInt(document.querySelector('.slides').style.transform.replace('translateX(-', '').replace('%)', '')) / 100))].id;
            addComment(currentPhotoId, name, content);
            
            // 清空输入框
            nameInput.value = '';
            contentInput.value = '';
        } else {
            alert('请填写名字和评论内容！');
        }
    });
    
    // 添加故事到时间线
    const timeline = document.querySelector('.timeline');
    stories.forEach(story => {
        timeline.innerHTML += `
            <div class="story-item">
                <div class="date">${story.date}</div>
                <h3>${story.title}</h3>
                <p>${story.content}</p>
            </div>
        `;
    });
    
    // 添加家人祝福
    const storiesContainer = document.querySelector('.stories-container');
    familyStories.forEach(story => {
        storiesContainer.innerHTML += `
            <div class="family-story">
                <h3>${story.name}</h3>
                <p>${story.message}</p>
            </div>
        `;
    });
}); 