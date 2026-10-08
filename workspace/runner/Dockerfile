# Docker CLI talks only to a disposable per-job daemon, never Docker Desktop.
FROM docker:29.8.0-cli@sha256:f5b8bb0333cfaa027640106e5f02e48b0a8e0c00f7165015f581d58783c76fcf AS docker-cli
# Browser dependencies and Chromium match this repository's Playwright version.
FROM mcr.microsoft.com/playwright:v1.63.0-noble@sha256:eff16c30e6f3f4af0a03fa4b706120d5e9b0891c344a27d64559aff5900a4a27

RUN apt-get update && apt-get install -y --no-install-recommends git gh unzip zip libicu74 gnupg ca-certificates \
    && rm -rf /var/lib/apt/lists/* \
    && useradd --create-home runner
RUN curl -fsSL https://packages.microsoft.com/keys/microsoft.asc | gpg --dearmor > /usr/share/keyrings/microsoft.gpg \
    && echo 'deb [arch=amd64 signed-by=/usr/share/keyrings/microsoft.gpg] https://packages.microsoft.com/repos/azure-cli/ noble main' > /etc/apt/sources.list.d/azure-cli.list \
    && apt-get update && apt-get install -y --no-install-recommends azure-cli=2.91.0-1~noble \
    && rm -rf /var/lib/apt/lists/*
COPY --from=docker-cli /usr/local/bin/docker /usr/local/bin/docker
COPY --from=docker-cli /usr/local/libexec/docker/cli-plugins/docker-buildx /usr/local/libexec/docker/cli-plugins/docker-buildx
RUN curl -fsSL -o /tmp/bun.zip https://github.com/oven-sh/bun/releases/download/bun-v1.4.2/bun-linux-x64.zip \
    && echo '36368faef7527875d5ffa52e53cd48021741f2a83eb6208a8dd64068d422a913  /tmp/bun.zip' | sha256sum -c - \
    && unzip -q /tmp/bun.zip -d /tmp \
    && install /tmp/bun-linux-x64/bun /usr/local/bin/bun \
    && rm -rf /tmp/bun.zip /tmp/bun-linux-x64
WORKDIR /home/runner
RUN mkdir -p /home/runner/.dotnet /opt/hostedtoolcache /home/runner/.azure/bin \
    && curl -fsSL -o /tmp/dotnet.tar.gz https://builds.dotnet.microsoft.com/dotnet/Sdk/10.0.401/dotnet-sdk-10.0.401-linux-x64.tar.gz \
    && echo '51c8b999af9e8dd9998c9edc5944e19a90788862068acd38694e098889054ce8c23d4f0c5cccfa16bf187d044562359e5ee69a9f8ad0bbe913ba90311fbce25b  /tmp/dotnet.tar.gz' | sha512sum -c - \
    && tar -xzf /tmp/dotnet.tar.gz -C /home/runner/.dotnet && rm /tmp/dotnet.tar.gz \
    && curl -fsSL -o /home/runner/.azure/bin/bicep https://github.com/Azure/bicep/releases/download/v0.48.1/bicep-linux-x64 \
    && echo 'b09ec25a9d376c1f8e33ede6ed22b587f915ad68488d5db77a6f9541748c7f6e  /home/runner/.azure/bin/bicep' | sha256sum -c - \
    && chmod +x /home/runner/.azure/bin/bicep \
    && chown -R runner:runner /opt/hostedtoolcache /home/runner
RUN curl -fsSL -o /tmp/runner.tar.gz https://github.com/actions/runner/releases/download/v2.338.0/actions-runner-linux-x64-2.338.0.tar.gz \
    && echo 'af4b794c1bc41d73d40535e3fe092a39f9679cd8d965954c2aca25a05ca41d32  /tmp/runner.tar.gz' | sha256sum -c - \
    && tar -xzf /tmp/runner.tar.gz && rm /tmp/runner.tar.gz \
    && chown -R runner:runner /home/runner
RUN ln -s /usr/local/bin/bun /usr/local/bin/bunx
RUN apt-get update && apt-get install -y --no-install-recommends jq rsync python3-venv \
    && rm -rf /var/lib/apt/lists/*
ENV DOTNET_ROOT=/home/runner/.dotnet DOTNET_INSTALL_DIR=/home/runner/.dotnet \
    DOTNET_CLI_TELEMETRY_OPTOUT=1 DOTNET_SKIP_FIRST_TIME_EXPERIENCE=1 \
    RUNNER_TOOL_CACHE=/opt/hostedtoolcache AGENT_TOOLSDIRECTORY=/opt/hostedtoolcache \
    PATH="/home/runner/.dotnet:${PATH}"
COPY --chown=runner:runner configure.sh ./configure.sh
USER runner
# Registration happens through stdin after creation, never in the image or env.
CMD ["bash", "-c", "while [ ! -f .configured ]; do sleep 1; done; exec ./run.sh"]
