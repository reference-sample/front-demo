#!/bin/bash

# === 配置项 ===
URL="http://localhost:9002/api/file/downloadChunk"
FILENAME="24.zip"
OUTPUT="24.zip"
CHUNK_SIZE=$((100 * 1024 * 1024))  # 100MB
TOTAL_SIZE=24614311691
TEMP_DIR=".download"

# === 创建临时目录 ===
mkdir -p "$TEMP_DIR"

echo "文件大小: $TOTAL_SIZE 字节"

# === 计算分片总数 ===
CHUNK_COUNT=$(( (TOTAL_SIZE + CHUNK_SIZE - 1) / CHUNK_SIZE ))
echo "分片大小: $CHUNK_SIZE 字节，每个约 $((CHUNK_SIZE / 1024 / 1024)) MB"
echo "总分片数: $CHUNK_COUNT"

# === 下载每个分片 ===
for ((i=0; i<CHUNK_COUNT; i++)); do
  START=$((i * CHUNK_SIZE))
  END=$((START + CHUNK_SIZE - 1))
  if [ "$END" -ge "$TOTAL_SIZE" ]; then
    END=$((TOTAL_SIZE - 1))
  fi
  RANGE="bytes=$START-$END"
  PART_FILE="$TEMP_DIR/part_$i"

  echo "📦 下载分片 $i: $RANGE -> $PART_FILE"
  curl -s -H "Range: $RANGE" "$URL?fileName=$FILENAME" -o "$PART_FILE"
done

# === 合并分片 ===
echo "🔗 合并分片到 $OUTPUT ..."
cat "$TEMP_DIR"/part_* > "$OUTPUT"

# === 清理临时分片 ===
echo "🧹 清理临时目录 $TEMP_DIR ..."
rm -rf "$TEMP_DIR"

echo "✅ 下载完成: $OUTPUT"
