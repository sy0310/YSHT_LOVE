const express = require('express');
const app = express();

// 从环境变量获取 token
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

app.get('/api/github-token', (req, res) => {
    // 这里应该添加适当的认证和授权检查
    res.send(GITHUB_TOKEN);
});

app.listen(3000, () => {
    console.log('Server running on port 3000');
}); 