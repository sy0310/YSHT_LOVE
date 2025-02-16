// GitHub 配置模块
const githubConfig = Object.freeze({
    owner: process.env.GITHUB_OWNER || 'sy0310',
    repo: process.env.GITHUB_REPO || 'YSHT_LOVE',
    branch: process.env.GITHUB_BRANCH || 'main',
    token: process.env.GITHUB_TOKEN || ''
});

// 配置验证函数
export const validateConfig = () => {
    const requiredFields = ['owner', 'repo', 'token'];
    const missingFields = requiredFields.filter(field => !githubConfig[field]);
    
    if (missingFields.length > 0) {
        throw new Error(`缺少必要配置: ${missingFields.join(', ')}`);
    }
    
    if (!/^ghp_[a-zA-Z0-9]{36}$/.test(githubConfig.token)) {
        throw new Error('无效的 GitHub Token 格式');
    }
    
    return true;
};

// 安全获取配置
export const getConfig = () => {
    validateConfig();
    return { ...githubConfig, token: '***' }; // 返回脱敏配置
};
