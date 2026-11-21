# Ruko server, Rust edition. Render has no native Rust runtime, so this image is the deploy path:
# Render → the service → Settings → Runtime: Docker (Dockerfile path: ruko-server/rust/Dockerfile,
# build context: repository root).
FROM rust:1-slim AS build
WORKDIR /src
COPY ruko-server/rust/Cargo.toml ruko-server/rust/Cargo.lock ./
RUN mkdir src && echo "fn main() {}" > src/main.rs && cargo build --release && rm -rf src
COPY ruko-server/rust/src ./src
RUN touch src/main.rs && cargo build --release

FROM debian:bookworm-slim
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends ca-certificates \
    && rm -rf /var/lib/apt/lists/*
COPY --from=build /src/target/release/ruko /app/ruko
COPY ruko-server/ruko-online/public /app/public
ENV PUBLIC_DIR=/app/public \
    DATA_DIR=/app/data \
    PORT=10000
EXPOSE 10000
CMD ["/app/ruko"]
