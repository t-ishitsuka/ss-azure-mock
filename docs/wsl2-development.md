# WSL2 開発環境ガイド

## WSL2 の IP アドレス確認方法

WSL2環境では、一部のサービス（Prisma Studioなど）が localhost でアクセスできない場合があります。
その場合は、WSL2のIPアドレスを使用してアクセスしてください。

### IP アドレスの確認

```bash
# WSL2内で実行
ip addr show eth0 | grep -oP '(?<=inet\s)\d+\.\d+\.\d+\.\d+' | head -1
```

または、より詳細な情報を見る場合：

```bash
# WSL2内で実行
ip addr show eth0
```

### 使用例

Prisma Studio にアクセスする場合：
```
http://<WSL2のIP>:5555
```

例：`http://172.21.240.1:5555`

### Windows側からWSL2のIPを確認

PowerShellまたはコマンドプロンプトで：

```powershell
wsl hostname -I
```

### 注意事項

- WSL2のIPアドレスは再起動時に変更される可能性があります
- Remix開発サーバー（Vite）は localhost でアクセス可能です（`http://localhost:3000`）
- PostgreSQLも localhost でアクセス可能です（`localhost:5432`）