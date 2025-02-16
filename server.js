import express from 'express';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { getConfig } from './config.js';

const app = express();
const PORT = process.env.PORT || 3000;

// 安全中间件
app.use(helmet());
app.use(express.json({ limit: '10mb' }));

// 速率限制
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15分钟
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
});

// 健康检查端点
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});

// API路由
const apiRouter = express.Router();
apiRouter.use(apiLimiter);

apiRouter.get('/config', (req, res) => {
    try {
        const safeConfig = getConfig();
        res.json(safeConfig);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 错误处理中间件
app.use((err, req, res, next) => {
    console.error(`[${new Date().toISOString()}] ERROR:`, err.stack);
    res.status(500).json({
        error: 'Internal Server Error',
        message: process.env.NODE_ENV === 'production' 
            ? 'Something went wrong' 
            : err.message
    });
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    try {
        getConfig(); // 启动时验证配置
        console.log('Configuration validated successfully');
    } catch (error) {
        console.error('Invalid configuration:', error.message);
        process.exit(1);
    }
});
