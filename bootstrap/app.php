<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware) {
        // Mendaftarkan middleware global untuk izin lokasi di Useberry
        $middleware->append(\App\Http\Middleware\AllowUseberryFeatures::class);
    })
    ->withExceptions(function (Exceptions $exceptions) {
        //
    })->create();
