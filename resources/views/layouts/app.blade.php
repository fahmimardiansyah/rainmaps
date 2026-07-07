<!DOCTYPE html>
<html lang="en">

<head>

    <meta charset="UTF-8">

    <meta name="viewport" content="width=device-width, initial-scale=1">

    <title>@yield('title')</title>
    <script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>
    <link
        href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&amp;family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap"
        rel="stylesheet" />
    <link
        href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap"
        rel="stylesheet" />
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@100..900&amp;display=swap"
        rel="stylesheet" />

    <link rel="stylesheet" href="{{ asset('assets/css/style.css') }}">

    @stack('styles')

    <script src="{{ asset('assets/js/tailwind-config.js') }}"></script>

</head>

<body class="bg-surface text-on-surface h-screen flex flex-col items-center justify-center">

    @yield('content')

    <script src="{{ asset('assets/js/app.js') }}"></script>

    @stack('scripts')

    @if (View::hasSection('google-maps'))
        <script src="https://maps.googleapis.com/maps/api/js?key={{ config('services.google_maps.api_key') }}&libraries=places,marker,geometry&callback=initMap"
            async defer></script>
    @endif

</body>

</html>
