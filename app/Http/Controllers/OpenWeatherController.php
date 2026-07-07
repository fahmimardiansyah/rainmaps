<?php

namespace App\Http\Controllers;

use App\Services\OpenWeatherService;

class OpenWeatherController extends Controller
{
    protected $service;

    public function __construct(OpenWeatherService $service)
    {
        $this->service = $service;
    }

    public function tile()
    {
        return response()->json(
            $this->service->tileInfo()
        );
    }
}