// GitHub 配置
const githubConfig = {
    owner: 'your-username',        // 你的 GitHub 用户名
    repo: 'your-repo-name',       // 你的仓库名
    branch: 'main',               // 分支名
};

// 从环境变量或其他安全的方式获取 token
function getGitHubToken() {
    // 这里应该从环境变量或后端服务获取 token
    return process.env.GITHUB_TOKEN;
} 