---
description: How to release and publish packages to NPM
---

# 发布流程 (NPM Publish Workflow)

本项目使用 `Changesets` 进行版本管理和发布。请遵循以下步骤：

## 1. 登录 NPM (首次需要)

确保你已经登录了 NPM 账号，并且有发布 `@my-cashier` scope 包的权限。

```bash
npm login
# 按提示输入用户名、密码、邮箱和 OTP
```

## 2. 生成变更集 (Development Phase)

当你完成了一个特性开发或 bug 修复，准备提交代码时，生成一个 changeset 文件。

```bash
npx changeset
```
- 使用空格键选择需要发布的包（`pay-core`, `pay-types`, `pay-utils`）。
- 选择变更类型：`major` (破坏性更新), `minor` (新特性), `patch` (Bug修复)。
- 输入变更描述（这将出现在 Changelog 中）。

## 3. 版本提升 (Release Phase)

准备发版时，运行以下命令消耗变更集并更新 `package.json` 版本号：

```bash
npx changeset version
```
- 这会自动更新版本号。
- 更新 `CHANGELOG.md`。
- 将 `workspace:*` 依赖替换为具体版本号。

## 4. 构建与发布

确保所有包都已构建最新代码，然后发布。

```bash
# 1. 全量构建
turbo build

# 2. 发布到 NPM
npx changeset publish
```

> **注意**：由于根目录 `package.json` 中配置了 `release` 脚本，你也可以直接运行 `npm run release` (等同于 `changeset publish`)。