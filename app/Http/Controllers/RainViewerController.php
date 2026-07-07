<?php

namespace App\Http\Controllers;

use App\Services\RainViewerService;

class RainViewerController extends Controller
{
    protected $rainViewer;

    public function __construct(
        RainViewerService $rainViewer
    ) {
        $this->rainViewer = $rainViewer;
    }

    public function latest()
    {
        $data = $this->rainViewer->latest();

        if (!$data) {

            return response()->json([
                'success' => false
            ],500);

        }

        return response()->json($data);
    }
}