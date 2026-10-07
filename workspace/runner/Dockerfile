# Browser dependencies and Chromium match this repository's Playwright version.
FROM mcr.microsoft.com/playwright:v1.63.0-noble@sha256:eff16c30e6f3f4af0a03fa4b706120d5e9b0891c344a27d64559aff5900a4a27

RUN apt-get update && apt-get install -y --no-install-recommends git gh unzip libicu74 \
    && rm -rf /var/lib/apt/lists/* \
    && useradd --create-home runner
RUN curl -fsSL -o /tmp/bun.zip https://github.com/oven-sh/bun/releases/download/bun-v1.4.2/bun-linux-x64.zip \
    && echo '36368faef7527875d5ffa52e53cd48021741f2a83eb6208a8dd64068d422a913  /tmp/bun.zip' | sha256sum -c - \
    && unzip -q /tmp/bun.zip -d /tmp \
    && install /tmp/bun-linux-x64/bun /usr/local/bin/bun \
    && rm -rf /tmp/bun.zip /tmp/bun-linux-x64
WORKDIR /home/runner
RUN curl -fsSL -o /tmp/runner.tar.gz https://github.com/actions/runner/releases/download/v2.338.0/actions-runner-linux-x64-2.338.0.tar.gz \
    && echo 'af4b794c1bc41d73d40535e3fe092a39f9679cd8d965954c2aca25a05ca41d32  /tmp/runner.tar.gz' | sha256sum -c - \
    && tar -xzf /tmp/runner.tar.gz && rm /tmp/runner.tar.gz \
    && chown -R runner:runner /home/runner
USER runner
# Registration happens through stdin after creation, never in the image or env.
CMD ["bash", "-c", "while [ ! -f .configured ]; do sleep 1; done; exec ./run.sh"]
