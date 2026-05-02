# 印刷术活字排版系统

一个基于 Vue 3 + TypeScript + Fabric.js + Go Gin + PostgreSQL 的印刷术活字排版与古籍雕版复原系统。

## 功能特性

### 活字柜模块
- 按偏旁部首浏览字模
- 按笔画数筛选字模
- 拖拽字模到排版区域
- 支持楷体、宋体等多种字体风格

### 版面设计模块
- 设置页面尺寸（宽度、高度）
- 自定义边距（上、下、左、右）
- 调整行距、字距、字号
- 界行设置（单线、双线、虚线）
- 版心、界行、鱼尾等古籍版式元素

### 雕版刀路预览
- 阴刻（凹版）/ 阳刻（凸版）模式
- 雕刻深度、刻刀宽度、刻刀角度参数调节
- 木质纹理模拟

### 刷印效果模拟
- 宣纸、连史纸、毛纸等纸张类型
- 墨色浓度、墨色渗透效果
- 纸张纹理透明度调节
- 老化效果模拟

## 技术栈

### 前端
- **框架**: Vue 3 + Composition API
- **语言**: TypeScript
- **UI 组件库**: Element Plus
- **状态管理**: Pinia
- **画布渲染**: Fabric.js
- **HTTP 客户端**: Axios
- **构建工具**: Vite
- **样式**: SCSS

### 后端
- **框架**: Go Gin
- **ORM**: GORM
- **数据库**: PostgreSQL
- **认证**: JWT (待实现)
- **跨域**: CORS

## 项目结构

```
text/
├── frontend/                    # 前端项目
│   ├── src/
│   │   ├── api/                 # API 接口
│   │   │   ├── index.ts        # Axios 实例配置
│   │   │   └── layout.ts       # 版面相关 API
│   │   ├── components/          # 组件
│   │   │   ├── TypeCabinet.vue    # 活字柜组件
│   │   │   ├── LayoutCanvas.vue   # 排版画布组件
│   │   │   └── PropertiesPanel.vue # 属性面板组件
│   │   ├── router/              # 路由配置
│   │   │   └── index.ts
│   │   ├── stores/              # Pinia 状态管理
│   │   │   └── layout.ts        # 排版状态
│   │   ├── styles/              # 全局样式
│   │   │   └── index.scss
│   │   ├── types/               # TypeScript 类型定义
│   │   │   └── index.ts
│   │   ├── utils/               # 工具函数
│   │   │   └── toast.ts
│   │   ├── views/               # 页面视图
│   │   │   └── LayoutView.vue
│   │   ├── App.vue              # 根组件
│   │   ├── main.ts              # 入口文件
│   │   └── vite-env.d.ts        # Vite 类型声明
│   ├── index.html
│   ├── package.json
│   ├── tsconfig.json
│   ├── tsconfig.node.json
│   └── vite.config.ts
├── backend/                     # 后端项目
│   ├── handlers/                # API 处理器
│   │   └── handlers.go
│   ├── models/                  # 数据模型
│   │   └── models.go
│   ├── routes/                  # 路由配置
│   │   └── routes.go
│   ├── .env.example             # 环境变量示例
│   ├── go.mod
│   └── main.go                  # 入口文件
└── README.md
```

## 安装与运行

### 环境要求

- Node.js >= 18.0.0
- Go >= 1.21
- PostgreSQL >= 12

### 前端安装

```bash
cd frontend

# 安装依赖
npm install

# 开发模式运行
npm run dev

# 构建生产版本
npm run build
```

前端服务将在 `http://localhost:3000` 运行。

### 后端安装

```bash
cd backend

# 复制环境变量配置
cp .env.example .env

# 编辑 .env 文件，配置数据库连接
# DATABASE_URL=host=localhost user=postgres password=postgres dbname=printing_system port=5432 sslmode=disable

# 创建数据库
createdb printing_system

# 安装依赖
go mod tidy

# 运行
go run main.go
```

后端服务将在 `http://localhost:8080` 运行。

## API 接口

### 字模接口

- `GET /api/glyphs` - 获取所有字模
- `GET /api/glyphs/radical/:radical` - 按部首获取字模
- `GET /api/glyphs/stroke/:count` - 按笔画数获取字模
- `GET /api/glyphs/:id` - 获取单个字模

### 版面接口

- `GET /api/layouts` - 获取所有版面
- `POST /api/layouts` - 创建新版面
- `GET /api/layouts/:id` - 获取单个版面
- `PUT /api/layouts/:id` - 更新版面
- `DELETE /api/layouts/:id` - 删除版面
- `GET /api/layouts/:id/export` - 导出版面

### 健康检查

- `GET /api/health` - 检查服务状态

## 使用说明

1. **打开活字柜**：左侧面板显示可用的字模，可按部首和笔画数筛选。
2. **拖拽排版**：将字模拖拽到中间的排版画布区域。
3. **调整字符**：在画布上选中字符后，可以移动、缩放、旋转。
4. **版面设置**：右侧属性面板可调整页面尺寸、边距、行距、字距等。
5. **界行设置**：配置古籍版式的界行（边框线、网格线）。
6. **保存版面**：点击顶部工具栏的保存按钮，将版面保存到后端数据库。

## 主题设计

系统采用**暖纸墨色主题**：
- 背景色：暖黄色系 (#f5f0e8)，模拟宣纸质感
- 文字色：深墨色 (#2c2420)，模拟墨色效果
- 强调色：棕褐色 (#8b4513)，模拟木质和印章色
- 边框：浅棕色系，营造古籍风格

## 响应式设计

系统支持响应式布局：
- 桌面端：三栏布局（活字柜 + 画布 + 属性面板）
- 平板端：两栏布局或可折叠侧边栏
- 移动端：单栏布局，底部导航

## 待实现功能

- [ ] 雕版刀路预览可视化
- [ ] 刷印效果模拟可视化
- [ ] 字模图片库（真实扫描的古籍字模）
- [ ] 用户认证系统
- [ ] 版面模板库
- [ ] 版面导出（PNG/SVG/PDF）
- [ ] 多页版面支持
- [ ] 协作编辑功能

## 许可证

MIT License
