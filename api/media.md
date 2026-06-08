# Recording & GIFs — Hustle Zone

## Recording Architecture

```
LiveKit SFU
    │
    │── Recording (via LiveKit Egress API)
    │   │
    │   ├── MP4 file → S3/MinIO
    │   ├── Thumbnail frames → S3
    │   └── Metadata → PostgreSQL
    │
    │── GIF Creation (on-demand from recording)
        │
        ├── User selects timestamp range
        ├── FFmpeg extracts segment
        ├── Converts to GIF at 10fps, 480p
        └── Uploads to S3 → returns URL
```

## Recording Flow

```
1. Host clicks "Record" → POST /rooms/:id/record/start
2. Server calls LiveKit Egress API → starts recording room composite
3. All 4 slots + audio mixed into single MP4
4. Egress writes to S3 in chunks
5. Host clicks "Stop" → POST /rooms/:id/record/stop
6. Server finalizes recording → FFmpeg generates thumbnails
7. Recording appears in room's recording gallery
```

## GIF Creation Flow

```
1. User selects start/end times from recording
2. POST /rooms/:id/gif { recordingId, startTime, endTime }
3. Server runs FFmpeg:
   ffmpeg -i recording.mp4 -ss 00:01:30 -to 00:01:35 \
          -vf "fps=10,scale=480:-1" \
          output.gif
4. Uploads to S3
5. Returns GIF URL
6. GIF appears in room's GIF gallery
7. Users can share GIF URL in chat
```

## Storage Structure

```
s3://hustle-zone-media/
├── recordings/
│   ├── {roomId}/
│   │   ├── {recordingId}.mp4
│   │   └── {recordingId}-thumb-{n}.jpg
├── gifs/
│   ├── {roomId}/
│   │   └── {gifId}.gif
├── avatars/
│   └── {userId}.jpg
└── gifts/
    └── {giftId}.gif (animation assets)
```

## LiveKit Egress Configuration

```yaml
egress:
  s3:
    access_key: ${AWS_ACCESS_KEY}
    secret_key: ${AWS_SECRET_KEY}
    region: ${AWS_REGION}
    bucket: hustle-zone-media
  composite:
    preset: COMPOSITE_720P
    video_only: false
    segment_duration: 60s
```
