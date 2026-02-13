<?php

namespace App\Http\Controllers;

use App\Services\WhatsAppService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Symfony\Component\Mime\MimeTypes;

class WhatsAppController extends Controller
{
    public function __construct(protected WhatsAppService $whatsapp) {}

    /**
     * Send WhatsApp Text Message
     *
     * Send a text message via WhatsApp to a specific number.
     */
    public function sendText(Request $request): JsonResponse
    {
        $data = $request->validate([
            'to' => ['required', 'string', 'max:30'],
            'message' => ['required', 'string'],
        ]);

        $result = $this->whatsapp->sendMessage($data['to'], $data['message']);

        if (! $result['success']) {
            return response()->json($result, 500);
        }

        return response()->json($result);
    }

    /**
     * Send WhatsApp Media Message
     *
     * Send a media message (image, video, document) via WhatsApp.
     */
    public function sendMedia(Request $request): JsonResponse
    {
        $data = $request->validate([
            'to' => ['required', 'string', 'max:30'],
            'mediaBase64' => ['required', 'string'],
            'filename' => ['required', 'string', 'max:200'],
            'caption' => ['nullable', 'string'],
        ]);

        $mediaUrl = $this->normalizeMediaUrl($data['mediaBase64'], $data['filename']);
        $mediaType = $this->guessMediaType($data['filename'], $mediaUrl);

        $result = $this->whatsapp->sendMessageWithMedia(
            $data['to'],
            $data['caption'] ?? 'Media',
            $mediaUrl,
            $mediaType
        );

        if (! $result['success']) {
            return response()->json($result, 500);
        }

        return response()->json($result);
    }

    protected function normalizeMediaUrl(string $mediaBase64, string $filename): string
    {
        if (Str::startsWith($mediaBase64, 'data:')) {
            return $mediaBase64;
        }

        $mimeTypes = new MimeTypes;
        $extension = strtolower(pathinfo($filename, PATHINFO_EXTENSION));
        $mimes = $mimeTypes->getMimeTypes($extension);
        $mime = $mimes[0] ?? 'application/octet-stream';

        return 'data:'.$mime.';base64,'.$mediaBase64;
    }

    protected function guessMediaType(string $filename, string $mediaUrl): string
    {
        $extension = strtolower(pathinfo($filename, PATHINFO_EXTENSION));

        $map = [
            'jpg' => 'image', 'jpeg' => 'image', 'png' => 'image', 'gif' => 'image', 'webp' => 'image',
            'mp4' => 'video', 'mov' => 'video', 'avi' => 'video', 'mkv' => 'video',
            'mp3' => 'audio', 'wav' => 'audio', 'ogg' => 'audio',
            'pdf' => 'document', 'doc' => 'document', 'docx' => 'document',
            'xls' => 'document', 'xlsx' => 'document', 'ppt' => 'document', 'pptx' => 'document',
            'webm' => 'sticker',
        ];

        if (isset($map[$extension])) {
            return $map[$extension];
        }

        if (Str::contains($mediaUrl, 'image/')) {
            return 'image';
        }
        if (Str::contains($mediaUrl, 'video/')) {
            return 'video';
        }
        if (Str::contains($mediaUrl, 'audio/')) {
            return 'audio';
        }

        return 'document';
    }
}
