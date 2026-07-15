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

    <link rel="icon" href="{{ asset('assets/icons/weathermaps.ico') }}" type="image/x-icon">

    <link rel="stylesheet" href="{{ asset('assets/css/style.css') }}">

    @stack('styles')

    <script src="{{ asset('assets/js/tailwind-config.js') }}"></script>

</head>

<body class="bg-surface text-on-surface h-screen flex flex-col items-center justify-center">

    @yield('content')

    <script src="{{ asset('assets/js/app.js') }}"></script>

    @stack('scripts')

    @if (View::hasSection('google-maps'))
        <script
            src="https://maps.googleapis.com/maps/api/js?key={{ config('services.google_maps.api_key') }}&libraries=places,marker,geometry&callback=initMap"
            async defer></script>
    @endif

    <script type="text/javascript" src="https://api.useberry.com/integrations/liveUrl/scripts/useberryScript.js"></script>
    <script>
        (function(m, a, z, e) {
            var s, t, u, v;
            try {
                t = m.sessionStorage.getItem('maze-us');
            } catch (err) {}

            if (!t) {
                t = new Date().getTime();
                try {
                    m.sessionStorage.setItem('maze-us', t);
                } catch (err) {}
            }

            u = document.currentScript || (function() {
                var w = document.getElementsByTagName('script');
                return w[w.length - 1];
            })();
            v = u && u.nonce;

            s = a.createElement('script');
            s.src = z + '?apiKey=' + e;
            s.async = true;
            if (v) s.setAttribute('nonce', v);
            a.getElementsByTagName('head')[0].appendChild(s);
            m.mazeUniversalSnippetApiKey = e;
        })(window, document, 'https://snippet.maze.co/maze-universal-loader.js', '1d46ce3f-b165-4d8b-99ac-0e2f57826545');
    </script>
    <script src="https://t.contentsquare.net/uxa/3ce48ad7613da.js" defer></script>

</body>

</html>
