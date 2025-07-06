# Node.js 22 を使用（Debian ベース）
FROM node:22

# 必要なツールをインストール
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    python3-venv \
    make \
    g++ \
    git \
    openssh-client \
    curl \
    bash \
    unzip \
    groff \
    less \
    postgresql-client \
    && rm -rf /var/lib/apt/lists/*

# Azure CLI のインストール
RUN curl -sL https://aka.ms/InstallAzureCLIDeb | bash

# AWS CLI v2 のインストール
RUN curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip" && \
    unzip awscliv2.zip && \
    ./aws/install && \
    rm -rf awscliv2.zip aws/

# Pulumi のインストール
RUN curl -fsSL https://get.pulumi.com | sh && \
    mv /root/.pulumi/bin/pulumi /usr/local/bin/

# 作業ディレクトリの設定
WORKDIR /workspace

# pnpm のインストール
RUN corepack enable && \
    corepack prepare pnpm@latest --activate

# node ユーザーのホームディレクトリとツール用ディレクトリを作成して権限を設定
RUN mkdir -p /home/node/.pulumi && \
    mkdir -p /home/node/.azure && \
    mkdir -p /home/node/.aws && \
    mkdir -p /home/node/.local/share/pnpm && \
    mkdir -p /home/node/.cache && \
    chown -R node:node /home/node && \
    chown -R node:node /workspace

# 環境変数の設定
ENV PATH="/home/node/.pulumi/bin:${PATH}"

# node ユーザーに切り替え
USER node

# デフォルトシェルを bash に設定
SHELL ["/bin/bash", "-c"]

# エントリーポイント
CMD ["bash"]